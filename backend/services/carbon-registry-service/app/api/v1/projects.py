from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status

from app.api.dependencies import get_audit_reader, get_audit_writer, get_credit_batch_repository, get_project_repository
from app.application.commands.register_project import RegisterCarbonProjectCommand
from app.application.dto import (
    AuditEventResponse,
    CarbonProjectResponse,
    CreditBatchResponse,
    ErrorResponse,
    IssueCreditBatchRequest,
    ProjectWorkflowRequest,
    RegisterCarbonProjectRequest,
)
from app.application.ports import AuditReader, AuditWriter, CarbonProjectRepository, CreditBatchRepository
from app.application.queries.get_projects import GetCarbonProjectQuery, ListCarbonProjectsQuery
from app.domain.entities.carbon_project import ProjectStatus
from app.infrastructure.security.current_user import CurrentUser, get_current_user

router = APIRouter(prefix="/api/v1/projects", tags=["Carbon Projects"])


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
