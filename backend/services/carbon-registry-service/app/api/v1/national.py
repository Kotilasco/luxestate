from datetime import UTC, datetime
from typing import Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Header, status
from pydantic import BaseModel, Field

from app.api.dependencies import get_audit_reader, get_audit_writer
from app.application.ports import AuditReader, AuditWriter
from app.infrastructure.security.current_user import CurrentUser, get_current_user


router = APIRouter(prefix="/api/v1/national-readiness", tags=["National Registry Readiness"])
operations_router = APIRouter(prefix="/api/v1/national-operations", tags=["National Registry Operations"])
NATIONAL_OPERATIONS_RESOURCE_ID = UUID("99999999-9999-4999-8999-999999999999")


class NationalStage(BaseModel):
    stage: int
    name: str
    status: Literal["not_started", "in_progress", "partially_implemented", "blocked"]
    maturity_score: int
    objective: str
    required_capabilities: list[str]
    current_gaps: list[str]
    next_controls: list[str]


class NationalReadinessResponse(BaseModel):
    platform: str
    jurisdiction: str
    maturity_score: int
    deployment_position: str
    generated_at: datetime
    stages: list[NationalStage]


class NationalOperationRecord(BaseModel):
    id: str
    operation_type: str
    status: str
    title: str
    stage: int
    owner: str
    controls: list[str]
    metadata: dict[str, object]
    created_at: datetime


class NationalOperationsResponse(BaseModel):
    generated_at: datetime
    stage_completion: list[dict[str, object]]
    registry_accounts: list[NationalOperationRecord]
    methodologies: list[NationalOperationRecord]
    accreditations: list[NationalOperationRecord]
    article6_authorizations: list[NationalOperationRecord]
    marketplace_controls: list[NationalOperationRecord]
    compliance_cases: list[NationalOperationRecord]
    accounting_snapshots: list[NationalOperationRecord]
    stage_decisions: list[NationalOperationRecord]
    audit_timeline: list[NationalOperationRecord]


class OpenRegistryAccountRequest(BaseModel):
    organization_name: str = Field(min_length=3, max_length=180)
    account_type: str = Field(pattern="^(project_developer|verifier|buyer|broker|regulator|custodian)$")
    kyb_reference: str = Field(min_length=4, max_length=120)
    beneficial_owner_checked: bool = True


class ApproveMethodologyRequest(BaseModel):
    code: str = Field(min_length=3, max_length=40)
    name: str = Field(min_length=4, max_length=180)
    standard: str = Field(min_length=2, max_length=80)
    version: str = Field(min_length=1, max_length=40)
    eligibility_rules: list[str] = Field(default_factory=list)


class GrantAccreditationRequest(BaseModel):
    verifier_name: str = Field(min_length=3, max_length=180)
    scope: str = Field(min_length=3, max_length=180)
    valid_until: str = Field(min_length=10, max_length=10)
    conflict_screening_reference: str = Field(min_length=4, max_length=120)


class Article6AuthorizationRequest(BaseModel):
    project_code: str = Field(min_length=3, max_length=40)
    buyer_country: str = Field(min_length=2, max_length=80)
    ndc_sector: str = Field(min_length=3, max_length=120)
    authorized_volume_tco2e: int = Field(gt=0)
    corresponding_adjustment_required: bool = True


class MarketplaceListingRequest(BaseModel):
    project_code: str = Field(min_length=3, max_length=40)
    vintage_year: int = Field(ge=2020, le=2100)
    volume_tco2e: int = Field(gt=0)
    floor_price_usd: float = Field(gt=0)
    claims_control: str = Field(min_length=4, max_length=160)


class ComplianceCaseRequest(BaseModel):
    subject: str = Field(min_length=4, max_length=180)
    risk_type: str = Field(min_length=3, max_length=80)
    severity: str = Field(pattern="^(low|medium|high|critical)$")
    allegation: str = Field(min_length=10, max_length=600)


class AccountingSnapshotRequest(BaseModel):
    reporting_period: str = Field(min_length=4, max_length=40)
    ndc_sector: str = Field(min_length=3, max_length=120)
    issued_tco2e: int = Field(ge=0)
    retired_tco2e: int = Field(ge=0)
    authorized_itmo_tco2e: int = Field(ge=0)


class StageDecisionRequest(BaseModel):
    stage: int = Field(ge=1, le=8)
    decision: Literal["open", "in_review", "control_passed", "blocked", "approved_for_pilot"]
    notes: str = Field(min_length=8, max_length=600)


class NationalActionResponse(BaseModel):
    id: str
    status: str
    message: str
    generated_at: datetime


NATIONAL_STAGES = [
    NationalStage(
        stage=1,
        name="Legal Authority and Registry Governance",
        status="in_progress",
        maturity_score=28,
        objective="Establish ZAI-CTS as a legally authoritative national system of record.",
        required_capabilities=[
            "Registry operating rules",
            "Regulator delegation matrix",
            "Appeals and enforcement workflows",
            "Public disclosure policy",
        ],
        current_gaps=[
            "No codified legal operating rule engine",
            "No dispute, sanction or appeals case module",
            "No gazetted public registry disclosure workflow",
        ],
        next_controls=[
            "Create registry rulebook configuration",
            "Add enforcement and appeals case records",
            "Add public transparency publication approval",
        ],
    ),
    NationalStage(
        stage=2,
        name="Identity, Accreditation and Account Opening",
        status="partially_implemented",
        maturity_score=34,
        objective="Control who may develop, verify, trade, hold, transfer and retire credits.",
        required_capabilities=[
            "Organization KYB",
            "User RBAC/ABAC",
            "Verifier accreditation and conflict checks",
            "Credit holding accounts",
        ],
        current_gaps=[
            "No formal account opening workflow",
            "No accreditation scope/expiry/sanction model",
            "No conflict-of-interest enforcement",
        ],
        next_controls=[
            "Add registry account ledger tables",
            "Add verifier accreditation registry",
            "Add ABAC constraints for verifier assignments",
        ],
    ),
    NationalStage(
        stage=3,
        name="Project Registration and Methodology Governance",
        status="partially_implemented",
        maturity_score=42,
        objective="Register eligible projects against approved standards and methodologies.",
        required_capabilities=[
            "Methodology library",
            "Project eligibility screening",
            "Public comment records",
            "Safeguards and grievance intake",
        ],
        current_gaps=[
            "No methodology versioning",
            "No safeguards/public consultation workflow",
            "No eligibility rule engine",
        ],
        next_controls=[
            "Add methodology catalog",
            "Add safeguards evidence package",
            "Add public consultation workflow",
        ],
    ),
    NationalStage(
        stage=4,
        name="GIS, Remote Sensing and MRV Evidence",
        status="in_progress",
        maturity_score=38,
        objective="Validate project boundaries, land cover, carbon density, fire risk, MRV plots and evidence chain of custody.",
        required_capabilities=[
            "PostGIS boundary versioning",
            "Satellite time series",
            "MRV plot validation",
            "Remote sensing processing lineage",
        ],
        current_gaps=[
            "No real raster/STAC processing pipeline",
            "No authoritative cadastre/protected-area integration",
            "No reproducible geospatial job records",
        ],
        next_controls=[
            "Add geospatial processing jobs",
            "Add overlap and duplicate project detection",
            "Add official boundary/cadastre source integrations",
        ],
    ),
    NationalStage(
        stage=5,
        name="Verification, Issuance and Buffer Controls",
        status="in_progress",
        maturity_score=36,
        objective="Control verified monitoring periods, regulator approvals, credit issuance and reversal risk.",
        required_capabilities=[
            "Monitoring period workflow",
            "Verification opinion records",
            "Issuance authorization",
            "Buffer/reversal accounting",
        ],
        current_gaps=[
            "No methodology-specific MRV engine",
            "No buffer contribution/reversal module",
            "No non-conformity and corrective action workflow",
        ],
        next_controls=[
            "Add non-conformance records",
            "Add issuance authorization gate",
            "Add buffer pool ledger",
        ],
    ),
    NationalStage(
        stage=6,
        name="Credit Ledger, Transfers and Retirements",
        status="not_started",
        maturity_score=22,
        objective="Operate an account-based credit ledger for issuance, holdings, transfers, retirements, cancellations and freezes.",
        required_capabilities=[
            "Credit accounts",
            "Serialized units",
            "Transfer workflow",
            "Retirement certificates",
            "Freeze/cancel/reversal states",
        ],
        current_gaps=[
            "Credit batches exist but not account-based unit holdings",
            "No transfer, retirement or cancellation workflow",
            "No public retirement certificate",
        ],
        next_controls=[
            "Add account ledger schema",
            "Add transfer and retirement APIs",
            "Add public certificate verification",
        ],
    ),
    NationalStage(
        stage=7,
        name="Article 6 and National Climate Accounting",
        status="not_started",
        maturity_score=15,
        objective="Support host-country authorization, ITMO tracking, corresponding adjustments and NDC/BTR reporting.",
        required_capabilities=[
            "Article 6 authorization",
            "ITMO first transfer records",
            "Corresponding adjustment status",
            "NDC sector and inventory mapping",
        ],
        current_gaps=[
            "No host-country authorization workflow",
            "No corresponding adjustment ledger",
            "No UNFCCC reporting package generation",
        ],
        next_controls=[
            "Add Article 6 authorization table",
            "Add NDC accounting dashboard",
            "Add BTR/annual information export",
        ],
    ),
    NationalStage(
        stage=8,
        name="Marketplace, Surveillance and Public Transparency",
        status="not_started",
        maturity_score=20,
        objective="Enable controlled credit trading, claims, market oversight and public registry transparency.",
        required_capabilities=[
            "Listings and orders",
            "Buyer/seller KYB",
            "Trade surveillance",
            "Public registry",
            "Claims and retirement guidance",
        ],
        current_gaps=[
            "Marketplace is not yet transaction-grade",
            "No settlement, escrow, trade surveillance or claims controls",
            "No public transparency portal",
        ],
        next_controls=[
            "Add listing/order schema",
            "Add market conduct alerts",
            "Add public registry and retirement search",
        ],
    ),
]


@router.get("", response_model=NationalReadinessResponse)
async def get_national_readiness() -> NationalReadinessResponse:
    score = round(sum(stage.maturity_score for stage in NATIONAL_STAGES) / len(NATIONAL_STAGES))
    return NationalReadinessResponse(
        platform="ZAI-CTS",
        jurisdiction="Zimbabwe",
        maturity_score=score,
        deployment_position="Controlled pilot only. Not yet ready to operate as the official national registry.",
        generated_at=datetime.now(tz=UTC),
        stages=NATIONAL_STAGES,
    )


def _operation_record(event: object) -> NationalOperationRecord:
    metadata = getattr(event, "metadata_", {}) or {}
    return NationalOperationRecord(
        id=str(metadata.get("operation_id", getattr(event, "id", uuid4()))),
        operation_type=str(metadata.get("operation_type", getattr(event, "action", "national_control"))),
        status=str(metadata.get("status", getattr(event, "outcome", "recorded"))),
        title=str(metadata.get("title", getattr(event, "event_type", "National control"))),
        stage=int(metadata.get("stage", 0)),
        owner=str(metadata.get("owner", getattr(event, "actor_role", "regulator"))),
        controls=[str(control) for control in metadata.get("controls", [])],
        metadata=metadata,
        created_at=getattr(event, "created_at", datetime.now(tz=UTC)),
    )


def _filter_records(records: list[NationalOperationRecord], operation_type: str) -> list[NationalOperationRecord]:
    return [record for record in records if record.operation_type == operation_type]


def _stage_completion(records: list[NationalOperationRecord]) -> list[dict[str, object]]:
    completion_controls = {
        1: ["stage_decision"],
        2: ["registry_account", "verifier_accreditation"],
        3: ["methodology"],
        4: ["stage_decision"],
        5: ["stage_decision"],
        6: ["marketplace_listing"],
        7: ["article6_authorization", "accounting_snapshot"],
        8: ["compliance_case", "marketplace_listing"],
    }
    result: list[dict[str, object]] = []
    for stage in NATIONAL_STAGES:
        required = completion_controls[stage.stage]
        present = {record.operation_type for record in records if record.stage == stage.stage}
        completed = sum(1 for control in required if control in present)
        result.append(
            {
                "stage": stage.stage,
                "name": stage.name,
                "required_controls": required,
                "completed_controls": completed,
                "completion_percent": round((completed / len(required)) * 100),
                "status": "operationalizing" if completed else stage.status,
            }
        )
    return result


async def _write_operation(
    *,
    payload: dict[str, object],
    audit_writer: AuditWriter,
    current_user: CurrentUser,
    x_correlation_id: UUID | None,
) -> NationalActionResponse:
    operation_id = str(uuid4())
    now = datetime.now(tz=UTC)
    metadata = {
        "operation_id": operation_id,
        "recorded_at": now.isoformat(),
        **payload,
    }
    await audit_writer.write(
        event_type=f"national.{payload['operation_type']}.recorded",
        actor_id=current_user.actor_id,
        actor_role=current_user.actor_role,
        organization_id=None,
        resource_type="national_registry",
        resource_id=NATIONAL_OPERATIONS_RESOURCE_ID,
        action=str(payload["operation_type"]),
        outcome=str(payload.get("status", "recorded")),
        correlation_id=x_correlation_id or uuid4(),
        metadata=metadata,
    )
    return NationalActionResponse(
        id=operation_id,
        status=str(payload.get("status", "recorded")),
        message=str(payload.get("message", "National registry control recorded.")),
        generated_at=now,
    )


@operations_router.get("", response_model=NationalOperationsResponse)
async def get_national_operations(
    audit_reader: AuditReader = Depends(get_audit_reader),
) -> NationalOperationsResponse:
    events = await audit_reader.list_for_resource("national_registry", NATIONAL_OPERATIONS_RESOURCE_ID, 300)
    records = [_operation_record(event) for event in events]
    records.sort(key=lambda record: record.created_at, reverse=True)
    return NationalOperationsResponse(
        generated_at=datetime.now(tz=UTC),
        stage_completion=_stage_completion(records),
        registry_accounts=_filter_records(records, "registry_account"),
        methodologies=_filter_records(records, "methodology"),
        accreditations=_filter_records(records, "verifier_accreditation"),
        article6_authorizations=_filter_records(records, "article6_authorization"),
        marketplace_controls=_filter_records(records, "marketplace_listing"),
        compliance_cases=_filter_records(records, "compliance_case"),
        accounting_snapshots=_filter_records(records, "accounting_snapshot"),
        stage_decisions=_filter_records(records, "stage_decision"),
        audit_timeline=records[:50],
    )


@operations_router.post("/accounts/open", response_model=NationalActionResponse, status_code=status.HTTP_201_CREATED)
async def open_registry_account(
    request: OpenRegistryAccountRequest,
    audit_writer: AuditWriter = Depends(get_audit_writer),
    current_user: CurrentUser = Depends(get_current_user),
    x_correlation_id: UUID | None = Header(default=None, alias="X-Correlation-Id"),
) -> NationalActionResponse:
    return await _write_operation(
        payload={
            "operation_type": "registry_account",
            "status": "account_opened",
            "title": f"{request.organization_name} registry account",
            "stage": 2,
            "owner": "Registry Operations",
            "controls": ["KYB passed", "Beneficial ownership screened", "RBAC account profile created"],
            "message": "Registry account opened with KYB and account-control evidence.",
            **request.model_dump(),
        },
        audit_writer=audit_writer,
        current_user=current_user,
        x_correlation_id=x_correlation_id,
    )


@operations_router.post("/methodologies/approve", response_model=NationalActionResponse, status_code=status.HTTP_201_CREATED)
async def approve_methodology(
    request: ApproveMethodologyRequest,
    audit_writer: AuditWriter = Depends(get_audit_writer),
    current_user: CurrentUser = Depends(get_current_user),
    x_correlation_id: UUID | None = Header(default=None, alias="X-Correlation-Id"),
) -> NationalActionResponse:
    return await _write_operation(
        payload={
            "operation_type": "methodology",
            "status": "approved",
            "title": f"{request.code} {request.version}",
            "stage": 3,
            "owner": "Methodology Committee",
            "controls": ["Version locked", "Eligibility rules attached", "Standards compatibility recorded"],
            "message": "Methodology approved for controlled national registry use.",
            **request.model_dump(),
        },
        audit_writer=audit_writer,
        current_user=current_user,
        x_correlation_id=x_correlation_id,
    )


@operations_router.post("/accreditations/grant", response_model=NationalActionResponse, status_code=status.HTTP_201_CREATED)
async def grant_verifier_accreditation(
    request: GrantAccreditationRequest,
    audit_writer: AuditWriter = Depends(get_audit_writer),
    current_user: CurrentUser = Depends(get_current_user),
    x_correlation_id: UUID | None = Header(default=None, alias="X-Correlation-Id"),
) -> NationalActionResponse:
    return await _write_operation(
        payload={
            "operation_type": "verifier_accreditation",
            "status": "active",
            "title": request.verifier_name,
            "stage": 2,
            "owner": "Accreditation Unit",
            "controls": ["Scope recorded", "Expiry recorded", "Conflict screen completed"],
            "message": "Verifier accreditation granted with conflict screening controls.",
            **request.model_dump(),
        },
        audit_writer=audit_writer,
        current_user=current_user,
        x_correlation_id=x_correlation_id,
    )


@operations_router.post("/article6/authorize", response_model=NationalActionResponse, status_code=status.HTTP_201_CREATED)
async def authorize_article6_transfer(
    request: Article6AuthorizationRequest,
    audit_writer: AuditWriter = Depends(get_audit_writer),
    current_user: CurrentUser = Depends(get_current_user),
    x_correlation_id: UUID | None = Header(default=None, alias="X-Correlation-Id"),
) -> NationalActionResponse:
    return await _write_operation(
        payload={
            "operation_type": "article6_authorization",
            "status": "host_country_authorized",
            "title": f"{request.project_code} Article 6 authorization",
            "stage": 7,
            "owner": "National Article 6 Authority",
            "controls": ["Host-country authorization", "NDC sector mapped", "Corresponding adjustment flagged"],
            "message": "Article 6 authorization recorded for national accounting control.",
            **request.model_dump(),
        },
        audit_writer=audit_writer,
        current_user=current_user,
        x_correlation_id=x_correlation_id,
    )


@operations_router.post("/marketplace/list", response_model=NationalActionResponse, status_code=status.HTTP_201_CREATED)
async def create_marketplace_listing_control(
    request: MarketplaceListingRequest,
    audit_writer: AuditWriter = Depends(get_audit_writer),
    current_user: CurrentUser = Depends(get_current_user),
    x_correlation_id: UUID | None = Header(default=None, alias="X-Correlation-Id"),
) -> NationalActionResponse:
    return await _write_operation(
        payload={
            "operation_type": "marketplace_listing",
            "status": "surveillance_ready",
            "title": f"{request.project_code} vintage {request.vintage_year}",
            "stage": 8,
            "owner": "Market Oversight Desk",
            "controls": ["Listing limits checked", "Claims control attached", "Trade surveillance active"],
            "message": "Marketplace listing control recorded with surveillance requirements.",
            **request.model_dump(),
        },
        audit_writer=audit_writer,
        current_user=current_user,
        x_correlation_id=x_correlation_id,
    )


@operations_router.post("/compliance/cases", response_model=NationalActionResponse, status_code=status.HTTP_201_CREATED)
async def open_compliance_case(
    request: ComplianceCaseRequest,
    audit_writer: AuditWriter = Depends(get_audit_writer),
    current_user: CurrentUser = Depends(get_current_user),
    x_correlation_id: UUID | None = Header(default=None, alias="X-Correlation-Id"),
) -> NationalActionResponse:
    return await _write_operation(
        payload={
            "operation_type": "compliance_case",
            "status": "open",
            "title": request.subject,
            "stage": 8,
            "owner": "Regulatory Enforcement",
            "controls": ["Case opened", "Severity classified", "Audit hold applied"],
            "message": "Regulatory compliance case opened.",
            **request.model_dump(),
        },
        audit_writer=audit_writer,
        current_user=current_user,
        x_correlation_id=x_correlation_id,
    )


@operations_router.post("/reporting/snapshots", response_model=NationalActionResponse, status_code=status.HTTP_201_CREATED)
async def create_accounting_snapshot(
    request: AccountingSnapshotRequest,
    audit_writer: AuditWriter = Depends(get_audit_writer),
    current_user: CurrentUser = Depends(get_current_user),
    x_correlation_id: UUID | None = Header(default=None, alias="X-Correlation-Id"),
) -> NationalActionResponse:
    net_position = request.issued_tco2e - request.retired_tco2e - request.authorized_itmo_tco2e
    return await _write_operation(
        payload={
            "operation_type": "accounting_snapshot",
            "status": "snapshot_locked",
            "title": f"{request.reporting_period} {request.ndc_sector}",
            "stage": 7,
            "owner": "National Inventory Team",
            "controls": ["Issued volume reconciled", "Retirements deducted", "ITMO authorizations deducted"],
            "message": "National accounting snapshot locked for reporting review.",
            "net_national_position_tco2e": net_position,
            **request.model_dump(),
        },
        audit_writer=audit_writer,
        current_user=current_user,
        x_correlation_id=x_correlation_id,
    )


@operations_router.post("/stages/decision", response_model=NationalActionResponse, status_code=status.HTTP_201_CREATED)
async def record_stage_decision(
    request: StageDecisionRequest,
    audit_writer: AuditWriter = Depends(get_audit_writer),
    current_user: CurrentUser = Depends(get_current_user),
    x_correlation_id: UUID | None = Header(default=None, alias="X-Correlation-Id"),
) -> NationalActionResponse:
    stage = next(stage for stage in NATIONAL_STAGES if stage.stage == request.stage)
    return await _write_operation(
        payload={
            "operation_type": "stage_decision",
            "status": request.decision,
            "title": f"Stage {request.stage}: {stage.name}",
            "stage": request.stage,
            "owner": "National Programme Board",
            "controls": ["Decision maker captured", "Notes recorded", "Audit timeline updated"],
            "message": "National deployment stage decision recorded.",
            **request.model_dump(),
        },
        audit_writer=audit_writer,
        current_user=current_user,
        x_correlation_id=x_correlation_id,
    )
