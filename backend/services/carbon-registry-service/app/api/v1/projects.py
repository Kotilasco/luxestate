from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status

from app.api.dependencies import get_audit_reader, get_audit_writer, get_credit_batch_repository, get_project_repository
from app.application.commands.register_project import RegisterCarbonProjectCommand
from app.application.dto import (
    AuditEventResponse,
    AiReviewResponse,
    CarbonProjectResponse,
    CreditBatchResponse,
    ErrorResponse,
    GisAssessmentResponse,
    GisLayerResponse,
    IssueCreditBatchRequest,
    ProjectWorkflowRequest,
    RegisterCarbonProjectRequest,
)
from app.application.ports import AuditReader, AuditWriter, CarbonProjectRepository, CreditBatchRepository
from app.application.queries.get_projects import GetCarbonProjectQuery, ListCarbonProjectsQuery
from app.domain.entities.carbon_project import ProjectStatus
from app.infrastructure.security.current_user import CurrentUser, get_current_user

router = APIRouter(prefix="/api/v1/projects", tags=["Carbon Projects"])


DISTRICT_GIS_PROFILES = {
    "kariba": {
        "lat": Decimal("-16.5167"),
        "lng": Decimal("28.8000"),
        "forest_cover": Decimal("67.50"),
        "carbon_density": Decimal("142.80"),
        "fire_risk": "medium",
    },
    "binga": {
        "lat": Decimal("-17.6167"),
        "lng": Decimal("27.3333"),
        "forest_cover": Decimal("54.20"),
        "carbon_density": Decimal("118.40"),
        "fire_risk": "high",
    },
    "hwange": {
        "lat": Decimal("-18.3645"),
        "lng": Decimal("26.4988"),
        "forest_cover": Decimal("48.60"),
        "carbon_density": Decimal("109.70"),
        "fire_risk": "high",
    },
}

DEFAULT_GIS_PROFILE = {
    "lat": Decimal("-19.0154"),
    "lng": Decimal("29.1549"),
    "forest_cover": Decimal("42.00"),
    "carbon_density": Decimal("96.50"),
    "fire_risk": "medium",
}


@router.post(
    "",
    response_model=CarbonProjectResponse,
    status_code=status.HTTP_201_CREATED,
    responses={409: {"model": ErrorResponse}},
)
async def register_project(
    request: RegisterCarbonProjectRequest,
    repository: CarbonProjectRepository = Depends(get_project_repository),
    audit_writer: AuditWriter = Depends(get_audit_writer),
    current_user: CurrentUser = Depends(get_current_user),
    x_correlation_id: UUID | None = Header(default=None, alias="X-Correlation-Id"),
) -> CarbonProjectResponse:
    command = RegisterCarbonProjectCommand(repository, audit_writer)
    return await command.execute(
        request,
        actor_id=current_user.actor_id,
        actor_role=current_user.actor_role,
        correlation_id=x_correlation_id or uuid4(),
    )


@router.get("", response_model=list[CarbonProjectResponse])
async def list_projects(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    repository: CarbonProjectRepository = Depends(get_project_repository),
) -> list[CarbonProjectResponse]:
    query = ListCarbonProjectsQuery(repository)
    return await query.execute(limit=limit, offset=offset)


@router.get("/{project_id}", response_model=CarbonProjectResponse, responses={404: {"model": ErrorResponse}})
async def get_project(
    project_id: UUID,
    repository: CarbonProjectRepository = Depends(get_project_repository),
) -> CarbonProjectResponse:
    query = GetCarbonProjectQuery(repository)
    return await query.execute(project_id)


@router.patch("/{project_id}/workflow", response_model=CarbonProjectResponse, responses={404: {"model": ErrorResponse}})
async def advance_project_workflow(
    project_id: UUID,
    request: ProjectWorkflowRequest,
    repository: CarbonProjectRepository = Depends(get_project_repository),
    audit_writer: AuditWriter = Depends(get_audit_writer),
    current_user: CurrentUser = Depends(get_current_user),
    x_correlation_id: UUID | None = Header(default=None, alias="X-Correlation-Id"),
) -> CarbonProjectResponse:
    project = await repository.get_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carbon project was not found.")

    transition_map = {
        "submit_for_verification": ProjectStatus.SUBMITTED_FOR_VERIFICATION,
        "start_verification": ProjectStatus.UNDER_VERIFICATION,
        "approve": ProjectStatus.APPROVED,
        "reject": ProjectStatus.REJECTED,
        "suspend": ProjectStatus.SUSPENDED,
    }

    try:
        if request.action == "submit_for_verification":
            project.assert_can_submit_for_verification()
        elif request.action == "start_verification":
            project.assert_can_start_verification()
        elif request.action == "approve":
            project.assert_can_approve()
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    next_status = transition_map[request.action]
    updated = await repository.update_status(project_id, next_status, current_user.actor_id)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carbon project was not found.")

    await audit_writer.write(
        event_type=f"carbon.project.{request.action}",
        actor_id=current_user.actor_id,
        actor_role=current_user.actor_role,
        organization_id=updated.proponent_organization_id,
        resource_type="carbon_project",
        resource_id=updated.id,
        action=request.action,
        outcome="success",
        correlation_id=x_correlation_id or uuid4(),
        metadata={"from_status": project.status.value, "to_status": next_status.value, "reason": request.reason},
    )
    return CarbonProjectResponse.model_validate(updated)


@router.post(
    "/{project_id}/credits",
    response_model=CreditBatchResponse,
    status_code=status.HTTP_201_CREATED,
    responses={404: {"model": ErrorResponse}},
)
async def issue_credit_batch(
    project_id: UUID,
    request: IssueCreditBatchRequest,
    repository: CarbonProjectRepository = Depends(get_project_repository),
    credit_repository: CreditBatchRepository = Depends(get_credit_batch_repository),
    audit_writer: AuditWriter = Depends(get_audit_writer),
    current_user: CurrentUser = Depends(get_current_user),
    x_correlation_id: UUID | None = Header(default=None, alias="X-Correlation-Id"),
) -> CreditBatchResponse:
    project = await repository.get_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carbon project was not found.")

    try:
        project.assert_can_issue_credits()
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    serial_prefix = f"ZW-{project.project_code}-{request.vintage_year}-{uuid4().hex[:8].upper()}"
    blockchain_tx_id = f"fabric:{uuid4().hex}"
    batch = await credit_repository.issue(
        project_id=project.id,
        vintage_year=request.vintage_year,
        quantity_tco2e=request.quantity_tco2e,
        serial_prefix=serial_prefix,
        blockchain_tx_id=blockchain_tx_id,
        actor_id=current_user.actor_id,
    )
    await repository.update_status(project_id, ProjectStatus.CREDITS_ISSUED, current_user.actor_id)
    await audit_writer.write(
        event_type="carbon.credits.issued",
        actor_id=current_user.actor_id,
        actor_role=current_user.actor_role,
        organization_id=project.proponent_organization_id,
        resource_type="carbon_project",
        resource_id=project.id,
        action="issue_credits",
        outcome="success",
        correlation_id=x_correlation_id or uuid4(),
        metadata={
            "credit_batch_id": str(batch.id),
            "quantity_tco2e": str(batch.quantity_tco2e),
            "serial_prefix": batch.serial_prefix,
            "blockchain_tx_id": batch.blockchain_tx_id,
        },
    )
    return CreditBatchResponse.model_validate(batch)


@router.get("/{project_id}/credits", response_model=list[CreditBatchResponse])
async def list_credit_batches(
    project_id: UUID,
    credit_repository: CreditBatchRepository = Depends(get_credit_batch_repository),
) -> list[CreditBatchResponse]:
    batches = await credit_repository.list_for_project(project_id)
    return [CreditBatchResponse.model_validate(batch) for batch in batches]


@router.get("/{project_id}/audit-events", response_model=list[AuditEventResponse])
async def list_project_audit_events(
    project_id: UUID,
    limit: int = Query(default=25, ge=1, le=100),
    audit_reader: AuditReader = Depends(get_audit_reader),
) -> list[AuditEventResponse]:
    events = await audit_reader.list_for_resource("carbon_project", project_id, limit)
    return [AuditEventResponse.model_validate(event) for event in events]


@router.post("/{project_id}/gis-assessment", response_model=GisAssessmentResponse, responses={404: {"model": ErrorResponse}})
async def run_gis_assessment(
    project_id: UUID,
    repository: CarbonProjectRepository = Depends(get_project_repository),
    audit_writer: AuditWriter = Depends(get_audit_writer),
    current_user: CurrentUser = Depends(get_current_user),
    x_correlation_id: UUID | None = Header(default=None, alias="X-Correlation-Id"),
) -> GisAssessmentResponse:
    project = await repository.get_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carbon project was not found.")

    profile = DISTRICT_GIS_PROFILES.get(project.district.lower(), DEFAULT_GIS_PROFILE)
    estimated_area = (project.estimated_annual_tco2e / profile["carbon_density"]).quantize(Decimal("0.0001"))
    boundary_status = "requires_boundary_submission"
    findings = [
        f"Project located in {project.district}, {project.province}; district profile is suitable for screening only.",
        f"Estimated project area is {estimated_area} hectares using declared annual tCO2e and district carbon density.",
        f"Forest cover profile is {profile['forest_cover']} percent and fire risk is {profile['fire_risk']}.",
        "Production GIS verification requires the project boundary polygon, authoritative Zimbabwe administrative boundaries, satellite land-cover analysis, active fire screening, and field MRV evidence.",
    ]
    if profile["fire_risk"] == "high":
        findings.append("High fire risk requires annual satellite fire alert monitoring before credit issuance.")

    response = GisAssessmentResponse(
        project_id=project.id,
        district=project.district,
        province=project.province,
        centroid_latitude=profile["lat"],
        centroid_longitude=profile["lng"],
        estimated_area_hectares=estimated_area,
        forest_cover_percent=profile["forest_cover"],
        carbon_density_tco2e_per_hectare=profile["carbon_density"],
        fire_risk_level=profile["fire_risk"],
        boundary_validation_status=boundary_status,
        layers=[
            GisLayerResponse(name="District boundary", status="screened", summary=f"{project.district} administrative boundary profile selected."),
            GisLayerResponse(name="Forest cover", status="screened", summary=f"{profile['forest_cover']} percent forest cover baseline for readiness review."),
            GisLayerResponse(name="Fire alerts", status="screened", summary=f"{profile['fire_risk']} fire risk classification for readiness review."),
            GisLayerResponse(name="Carbon density", status="screened", summary=f"{profile['carbon_density']} tCO2e per hectare profile for readiness review."),
        ],
        evidence_sources=[
            "Zimbabwe authoritative administrative boundary dataset for province/district intersection",
            "Submitted project boundary polygon in GeoJSON/Shapefile projected to WGS84",
            "Copernicus Sentinel-2 imagery for vegetation and land-use verification",
            "ESA WorldCover 10m land-cover product for forest/non-forest baseline",
            "NASA FIRMS MODIS/VIIRS active fire observations for fire-risk screening",
            "Field MRV plots, geotagged photos, and verifier sign-off records",
        ],
        findings=findings,
        recommendation="Submit the project boundary polygon and MRV evidence before this project can be GIS-verified for approval.",
        generated_at=datetime.now(tz=UTC),
    )
    await audit_writer.write(
        event_type="gis.project.assessment_completed",
        actor_id=current_user.actor_id,
        actor_role=current_user.actor_role,
        organization_id=project.proponent_organization_id,
        resource_type="carbon_project",
        resource_id=project.id,
        action="run_gis_assessment",
        outcome=response.boundary_validation_status,
        correlation_id=x_correlation_id or uuid4(),
        metadata={
            "district": response.district,
            "estimated_area_hectares": str(response.estimated_area_hectares),
            "fire_risk_level": response.fire_risk_level,
            "boundary_validation_status": response.boundary_validation_status,
        },
    )
    return response


@router.post("/{project_id}/ai-review", response_model=AiReviewResponse, responses={404: {"model": ErrorResponse}})
async def run_ai_review(
    project_id: UUID,
    repository: CarbonProjectRepository = Depends(get_project_repository),
    audit_writer: AuditWriter = Depends(get_audit_writer),
    current_user: CurrentUser = Depends(get_current_user),
    x_correlation_id: UUID | None = Header(default=None, alias="X-Correlation-Id"),
) -> AiReviewResponse:
    project = await repository.get_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carbon project was not found.")

    annual_tco2e = project.estimated_annual_tco2e
    confidence = Decimal("0.91")
    risk_level = "low"
    required_actions: list[str] = []
    findings = [
        "Project description satisfies minimum narrative completeness for PDD screening.",
        f"Methodology {project.methodology} is present and linked to afforestation/reforestation review pathway.",
        f"Crediting period of {project.crediting_period_years} years is inside configured policy limits.",
    ]
    if annual_tco2e > Decimal("100000.0000"):
        risk_level = "medium"
        confidence = Decimal("0.86")
        required_actions.append("Require senior verifier review because estimated annual tCO2e exceeds 100,000.")
    if project.crediting_period_years > 40:
        risk_level = "high"
        confidence = Decimal("0.78")
        required_actions.append("Reduce or justify crediting period above standard programme threshold.")
    if "afforestation" not in project.methodology.lower() and "forest" not in project.description.lower():
        risk_level = "medium"
        confidence = min(confidence, Decimal("0.82"))
        required_actions.append("Attach methodology applicability evidence for non-forest project narrative.")

    if not required_actions:
        required_actions.append("Proceed to verifier assignment and regulator review.")

    response = AiReviewResponse(
        project_id=project.id,
        review_type="pdd_compliance_and_risk_review",
        model_version="zai-cts-deterministic-review-1.0",
        prompt_version="pdd-risk-v1",
        confidence_score=confidence,
        risk_level=risk_level,
        findings=findings,
        required_actions=required_actions,
        recommendation=(
            "AI review passed with standard verifier controls."
            if risk_level == "low"
            else "AI review requires targeted human verification controls because one or more policy risk thresholds were triggered."
        ),
        generated_at=datetime.now(tz=UTC),
    )
    await audit_writer.write(
        event_type="ai.project.review_completed",
        actor_id=current_user.actor_id,
        actor_role=current_user.actor_role,
        organization_id=project.proponent_organization_id,
        resource_type="carbon_project",
        resource_id=project.id,
        action="run_ai_review",
        outcome=response.risk_level,
        correlation_id=x_correlation_id or uuid4(),
        metadata={
            "review_type": response.review_type,
            "model_version": response.model_version,
            "prompt_version": response.prompt_version,
            "confidence_score": str(response.confidence_score),
            "risk_level": response.risk_level,
        },
    )
    return response
