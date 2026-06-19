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
    domain_operations: dict[str, list[NationalOperationRecord]]
    legal_rules: list[NationalOperationRecord]
    public_disclosures: list[NationalOperationRecord]
    appeal_cases: list[NationalOperationRecord]
    registry_accounts: list[NationalOperationRecord]
    methodologies: list[NationalOperationRecord]
    accreditations: list[NationalOperationRecord]
    gis_processing_jobs: list[NationalOperationRecord]
    non_conformances: list[NationalOperationRecord]
    buffer_allocations: list[NationalOperationRecord]
    ledger_transfers: list[NationalOperationRecord]
    ledger_retirements: list[NationalOperationRecord]
    ledger_freezes: list[NationalOperationRecord]
    article6_authorizations: list[NationalOperationRecord]
    market_settlements: list[NationalOperationRecord]
    marketplace_controls: list[NationalOperationRecord]
    compliance_cases: list[NationalOperationRecord]
    accounting_snapshots: list[NationalOperationRecord]
    stage_decisions: list[NationalOperationRecord]
    audit_timeline: list[NationalOperationRecord]


class EnterpriseRole(BaseModel):
    name: str
    category: str
    permissions: list[str]


class EnterpriseDomain(BaseModel):
    key: str
    name: str
    objective: str
    required_controls: list[str]
    primary_roles: list[str]


class EnterpriseArchitectureResponse(BaseModel):
    platform: str
    regulation_context: list[str]
    lifecycle: list[str]
    roles: list[EnterpriseRole]
    domains: list[EnterpriseDomain]
    generated_at: datetime


class OpenRegistryAccountRequest(BaseModel):
    organization_name: str = Field(min_length=3, max_length=180)
    account_type: str = Field(pattern="^(project_developer|verifier|buyer|broker|regulator|custodian)$")
    kyb_reference: str = Field(min_length=4, max_length=120)
    beneficial_owner_checked: bool = True


class EnterpriseControlRequest(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    status: str = Field(min_length=3, max_length=80)
    owner: str = Field(min_length=3, max_length=120)
    controls: list[str] = Field(min_length=1, max_length=12)
    details: dict[str, object] = Field(default_factory=dict)


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


class RegistryRuleRequest(BaseModel):
    rule_code: str = Field(min_length=3, max_length=40)
    title: str = Field(min_length=4, max_length=180)
    effective_date: str = Field(min_length=10, max_length=10)
    authority_reference: str = Field(min_length=4, max_length=160)


class PublicDisclosureRequest(BaseModel):
    disclosure_type: str = Field(pattern="^(project|issuance|retirement|sanction|methodology|article6)$")
    title: str = Field(min_length=4, max_length=180)
    publication_reference: str = Field(min_length=4, max_length=160)


class AppealCaseRequest(BaseModel):
    appellant: str = Field(min_length=3, max_length=180)
    decision_reference: str = Field(min_length=4, max_length=120)
    grounds: str = Field(min_length=10, max_length=600)


class GisProcessingJobRequest(BaseModel):
    project_code: str = Field(min_length=3, max_length=40)
    job_type: str = Field(pattern="^(boundary_overlap|cadastre_check|protected_area_check|stac_raster_processing|fire_screening)$")
    source_dataset: str = Field(min_length=4, max_length=180)
    processing_hash: str = Field(min_length=8, max_length=128)


class NonConformanceRequest(BaseModel):
    project_code: str = Field(min_length=3, max_length=40)
    severity: str = Field(pattern="^(minor|major|critical)$")
    finding: str = Field(min_length=10, max_length=600)
    corrective_action_due: str = Field(min_length=10, max_length=10)


class BufferAllocationRequest(BaseModel):
    project_code: str = Field(min_length=3, max_length=40)
    issued_tco2e: int = Field(gt=0)
    buffer_percent: float = Field(ge=0, le=100)
    reversal_risk_class: str = Field(pattern="^(low|medium|high|critical)$")


class LedgerTransferRequest(BaseModel):
    serial_prefix: str = Field(min_length=4, max_length=120)
    from_account: str = Field(min_length=4, max_length=120)
    to_account: str = Field(min_length=4, max_length=120)
    quantity_tco2e: int = Field(gt=0)
    settlement_reference: str = Field(min_length=4, max_length=160)


class LedgerRetirementRequest(BaseModel):
    serial_prefix: str = Field(min_length=4, max_length=120)
    account_id: str = Field(min_length=4, max_length=120)
    beneficiary: str = Field(min_length=3, max_length=180)
    purpose: str = Field(min_length=4, max_length=180)
    quantity_tco2e: int = Field(gt=0)


class LedgerFreezeRequest(BaseModel):
    serial_prefix: str = Field(min_length=4, max_length=120)
    reason: str = Field(min_length=10, max_length=600)
    freeze_scope: str = Field(pattern="^(batch|account|project|market_listing)$")


class MarketSettlementRequest(BaseModel):
    listing_reference: str = Field(min_length=4, max_length=120)
    buyer_account: str = Field(min_length=4, max_length=120)
    seller_account: str = Field(min_length=4, max_length=120)
    quantity_tco2e: int = Field(gt=0)
    settlement_status: str = Field(pattern="^(escrow_locked|settled|failed|cancelled)$")


class NationalActionResponse(BaseModel):
    id: str
    status: str
    message: str
    generated_at: datetime


class RetirementCertificateResponse(BaseModel):
    certificate_id: str
    status: str
    beneficiary: str
    purpose: str
    serial_prefix: str
    quantity_tco2e: int
    retired_at: datetime
    verification_hash: str


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


ENTERPRISE_LIFECYCLE = [
    "Organization Registration",
    "Organization Approval",
    "Registry Account Creation",
    "Project Registration",
    "Project Validation",
    "Project Approval",
    "Project Implementation",
    "Monitoring Period",
    "Monitoring Report Submission",
    "Verification Case",
    "Evidence Package Upload",
    "Automatic Validation",
    "AI Assessment",
    "GIS Review",
    "MRV Review",
    "Verifier Decision",
    "ZiCMA Review",
    "Credit Issuance",
    "Credit Registry",
    "Marketplace Listing",
    "Trading",
    "Settlement",
    "Ownership Transfer",
    "Retirement",
    "Article 6 Authorization",
    "Corresponding Adjustment",
    "National Reporting",
    "Long-Term Monitoring",
]

ENTERPRISE_ROLES = [
    EnterpriseRole(name="Super Administrator", category="administration", permissions=["*"]),
    EnterpriseRole(name="ZiCMA Administrator", category="government", permissions=["registry.admin", "article6.approve", "compliance.enforce"]),
    EnterpriseRole(name="Registry Officer", category="government", permissions=["organizations.review", "projects.review", "credits.issue"]),
    EnterpriseRole(name="Registry Manager", category="government", permissions=["registry.manage", "credits.manage", "reports.approve"]),
    EnterpriseRole(name="Project Developer", category="market", permissions=["projects.create", "evidence.upload", "monitoring.submit"]),
    EnterpriseRole(name="Accredited Validator", category="assurance", permissions=["validation.review", "validation.decide"]),
    EnterpriseRole(name="Accredited Verifier", category="assurance", permissions=["verification.review", "verification.sign"]),
    EnterpriseRole(name="GIS Analyst", category="technical", permissions=["gis.review", "gis.lineage.record"]),
    EnterpriseRole(name="MRV Officer", category="technical", permissions=["mrv.review", "monitoring.inspect"]),
    EnterpriseRole(name="AI Review Officer", category="technical", permissions=["ai.review", "ai.override"]),
    EnterpriseRole(name="Compliance Officer", category="government", permissions=["compliance.case.open", "ledger.freeze"]),
    EnterpriseRole(name="Legal Officer", category="government", permissions=["appeals.review", "rules.adopt"]),
    EnterpriseRole(name="Marketplace Operator", category="market", permissions=["marketplace.list", "settlement.record"]),
    EnterpriseRole(name="Finance Officer", category="finance", permissions=["invoices.issue", "payments.reconcile", "fees.configure"]),
    EnterpriseRole(name="Community Officer", category="community", permissions=["consultation.record", "safeguards.review"]),
    EnterpriseRole(name="Buyer", category="market", permissions=["portfolio.view", "credits.buy", "credits.retire"]),
    EnterpriseRole(name="Seller", category="market", permissions=["portfolio.view", "credits.sell"]),
    EnterpriseRole(name="Auditor", category="assurance", permissions=["audit.view", "reports.export"]),
    EnterpriseRole(name="Public User", category="public", permissions=["public.registry.view", "certificate.verify"]),
]

ENTERPRISE_DOMAINS = [
    EnterpriseDomain(key="dashboard", name="Dashboard", objective="Executive operating picture across registry, market, climate, compliance, GIS and AI work.", required_controls=["executive dashboard", "registry dashboard", "national climate dashboard"], primary_roles=["ZiCMA Administrator", "Registry Manager"]),
    EnterpriseDomain(key="identity", name="Identity & User Management", objective="Register users, manage sessions, MFA, invitations, approval, suspension, signatures, API keys and RBAC permissions.", required_controls=["user registration", "login", "forgot password", "MFA", "email verification", "account approval", "session management", "permission management"], primary_roles=["Super Administrator", "ZiCMA Administrator"]),
    EnterpriseDomain(key="organizations", name="Organizations", objective="Register organizations before projects, manage KYB, documents, approval, registry accounts, users and accreditation.", required_controls=["organization registration", "KYB", "organization approval", "registry account creation", "organization documents"], primary_roles=["Registry Officer", "Project Developer"]),
    EnterpriseDomain(key="carbon-registry", name="Carbon Registry", objective="Maintain the official project registry and methodology-controlled project records.", required_controls=["project registry", "methodology governance", "public registry"], primary_roles=["Registry Officer", "Registry Manager"]),
    EnterpriseDomain(key="project-lifecycle", name="Project Lifecycle", objective="Enforce the exact national project lifecycle from organization registration to long-term monitoring.", required_controls=ENTERPRISE_LIFECYCLE, primary_roles=["Registry Manager", "Project Developer"]),
    EnterpriseDomain(key="validation", name="Validation", objective="Separate project validation from verification with methodology, additionality, financial, safeguard, land and design reviews.", required_controls=["methodology review", "additionality", "financial feasibility", "environmental safeguards", "social safeguards", "stakeholder consultation", "land ownership validation", "validation report"], primary_roles=["Accredited Validator", "Registry Officer"]),
    EnterpriseDomain(key="monitoring", name="Monitoring", objective="Manage monitoring periods, reports, inspections, IoT, drone, satellite, forest change and carbon measurement history.", required_controls=["monitoring schedule", "monitoring report", "field inspection", "IoT data", "drone data", "satellite monitoring", "forest change detection"], primary_roles=["Project Developer", "MRV Officer"]),
    EnterpriseDomain(key="verification", name="Verification", objective="Operate verification as case management with evidence package, hashing, AI, GIS, MRV, verifier and ZiCMA review.", required_controls=["case dashboard", "evidence package", "automatic validation", "AI review", "GIS review", "MRV review", "digital signatures"], primary_roles=["Accredited Verifier", "ZiCMA Administrator"]),
    EnterpriseDomain(key="credit-registry", name="Credit Registry", objective="Separate credits from projects and track batches, serials, vintage, owner, status, history, retirement and blockchain reference.", required_controls=["credit batch", "serial numbers", "owner", "status", "transfer history", "retirement"], primary_roles=["Registry Officer", "Registry Manager"]),
    EnterpriseDomain(key="marketplace", name="Marketplace", objective="Operate wallet, portfolio, listings, spot, OTC, auctions, settlement, invoices, payments, fees and analytics.", required_controls=["wallet", "portfolio", "listings", "spot market", "OTC", "auction", "settlement", "payments"], primary_roles=["Marketplace Operator", "Buyer", "Seller"]),
    EnterpriseDomain(key="article6", name="Article 6 Operations", objective="Run authorization, ITMOs, export/import approval, corresponding adjustment, national accounting and UN reporting.", required_controls=["authorization", "ITMOs", "export approval", "import approval", "corresponding adjustment", "UN reporting"], primary_roles=["ZiCMA Administrator", "Legal Officer"]),
    EnterpriseDomain(key="gis", name="GIS Intelligence", objective="Provide interactive maps, boundary drawing/upload, satellite/fire/forest/community/road/water/carbon layers and historical comparison.", required_controls=["boundary drawing", "GeoJSON upload", "shapefile upload", "satellite layers", "fire layers", "forest cover", "carbon density"], primary_roles=["GIS Analyst"]),
    EnterpriseDomain(key="ai", name="AI Intelligence", objective="Provide decision-support AI with confidence, explanation, evidence, and human override.", required_controls=["PDD assistant", "fraud detection", "leakage detection", "additionality assessment", "document analysis", "satellite analysis", "risk assessment", "price forecasting"], primary_roles=["AI Review Officer", "Registry Manager"]),
    EnterpriseDomain(key="mrv", name="MRV", objective="Control monitoring, reporting and verification evidence, measurements and field data.", required_controls=["field plots", "carbon measurements", "inspection history", "MRV review"], primary_roles=["MRV Officer"]),
    EnterpriseDomain(key="compliance", name="Compliance", objective="Handle surveillance, sanctions, fraud, registry corrections, reversals and regulatory cases.", required_controls=["fraud case", "sanctions", "registry correction", "reversal management"], primary_roles=["Compliance Officer"]),
    EnterpriseDomain(key="appeals", name="Appeals", objective="Make every regulatory decision appealable through submission, review, independent panel, decision and final resolution.", required_controls=["appeal submission", "appeal review", "independent panel", "decision", "final resolution"], primary_roles=["Legal Officer", "Auditor"]),
    EnterpriseDomain(key="reporting", name="Reporting", objective="Produce financial, registry, marketplace, Article 6, national climate and audit reports.", required_controls=["registry reports", "financial reports", "national climate reports", "UN reports", "audit exports"], primary_roles=["Registry Manager", "Finance Officer", "Auditor"]),
    EnterpriseDomain(key="administration", name="Administration", objective="Manage configuration, permissions, API keys, workflows, fees, standards and system operations.", required_controls=["permission configuration", "API keys", "workflow configuration", "fee configuration", "audit settings"], primary_roles=["Super Administrator"]),
]

DOMAIN_STAGE_MAP = {
    "dashboard": 1,
    "identity": 2,
    "organizations": 2,
    "carbon-registry": 3,
    "project-lifecycle": 3,
    "validation": 3,
    "monitoring": 5,
    "verification": 5,
    "credit-registry": 6,
    "marketplace": 8,
    "article6": 7,
    "gis": 4,
    "ai": 5,
    "mrv": 5,
    "compliance": 8,
    "appeals": 1,
    "reporting": 7,
    "administration": 1,
}


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


@operations_router.get("/architecture", response_model=EnterpriseArchitectureResponse)
async def get_enterprise_architecture() -> EnterpriseArchitectureResponse:
    return EnterpriseArchitectureResponse(
        platform="ZAI-CTS",
        regulation_context=[
            "Zimbabwe SI 48 of 2025",
            "Paris Agreement Article 6",
            "Voluntary carbon market registry operations",
            "National climate accounting and public registry transparency",
        ],
        lifecycle=ENTERPRISE_LIFECYCLE,
        roles=ENTERPRISE_ROLES,
        domains=ENTERPRISE_DOMAINS,
        generated_at=datetime.now(tz=UTC),
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


def _domain_records(records: list[NationalOperationRecord]) -> dict[str, list[NationalOperationRecord]]:
    return {
        domain.key: [
            record
            for record in records
            if record.operation_type == "domain_control" and record.metadata.get("domain") == domain.key
        ]
        for domain in ENTERPRISE_DOMAINS
    }


def _stage_completion(records: list[NationalOperationRecord]) -> list[dict[str, object]]:
    completion_controls = {
        1: ["registry_rule", "public_disclosure", "appeal_case", "stage_decision"],
        2: ["registry_account", "verifier_accreditation"],
        3: ["methodology"],
        4: ["gis_processing_job", "stage_decision"],
        5: ["non_conformance", "buffer_allocation", "stage_decision"],
        6: ["ledger_transfer", "ledger_retirement", "ledger_freeze"],
        7: ["article6_authorization", "accounting_snapshot"],
        8: ["compliance_case", "marketplace_listing", "market_settlement", "public_disclosure"],
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
        domain_operations=_domain_records(records),
        legal_rules=_filter_records(records, "registry_rule"),
        public_disclosures=_filter_records(records, "public_disclosure"),
        appeal_cases=_filter_records(records, "appeal_case"),
        registry_accounts=_filter_records(records, "registry_account"),
        methodologies=_filter_records(records, "methodology"),
        accreditations=_filter_records(records, "verifier_accreditation"),
        gis_processing_jobs=_filter_records(records, "gis_processing_job"),
        non_conformances=_filter_records(records, "non_conformance"),
        buffer_allocations=_filter_records(records, "buffer_allocation"),
        ledger_transfers=_filter_records(records, "ledger_transfer"),
        ledger_retirements=_filter_records(records, "ledger_retirement"),
        ledger_freezes=_filter_records(records, "ledger_freeze"),
        article6_authorizations=_filter_records(records, "article6_authorization"),
        market_settlements=_filter_records(records, "market_settlement"),
        marketplace_controls=_filter_records(records, "marketplace_listing"),
        compliance_cases=_filter_records(records, "compliance_case"),
        accounting_snapshots=_filter_records(records, "accounting_snapshot"),
        stage_decisions=_filter_records(records, "stage_decision"),
        audit_timeline=records[:50],
    )


@operations_router.post("/domains/{domain}/controls/{control}", response_model=NationalActionResponse, status_code=status.HTTP_201_CREATED)
async def record_domain_control(
    domain: str,
    control: str,
    request: EnterpriseControlRequest,
    audit_writer: AuditWriter = Depends(get_audit_writer),
    current_user: CurrentUser = Depends(get_current_user),
    x_correlation_id: UUID | None = Header(default=None, alias="X-Correlation-Id"),
) -> NationalActionResponse:
    if domain not in DOMAIN_STAGE_MAP:
        return NationalActionResponse(
            id=str(uuid4()),
            status="rejected",
            message="Unknown enterprise domain.",
            generated_at=datetime.now(tz=UTC),
        )
    domain_name = next(item.name for item in ENTERPRISE_DOMAINS if item.key == domain)
    return await _write_operation(
        payload={
            "operation_type": "domain_control",
            "status": request.status,
            "title": request.title,
            "stage": DOMAIN_STAGE_MAP[domain],
            "owner": request.owner,
            "controls": request.controls,
            "message": f"{domain_name} control recorded.",
            "domain": domain,
            "domain_name": domain_name,
            "control": control,
            "details": request.details,
        },
        audit_writer=audit_writer,
        current_user=current_user,
        x_correlation_id=x_correlation_id,
    )


@operations_router.get("/public/retirement-certificates/{certificate_id}", response_model=RetirementCertificateResponse)
async def get_retirement_certificate(
    certificate_id: str,
    audit_reader: AuditReader = Depends(get_audit_reader),
) -> RetirementCertificateResponse:
    events = await audit_reader.list_for_resource("national_registry", NATIONAL_OPERATIONS_RESOURCE_ID, 300)
    records = [_operation_record(event) for event in events]
    for record in records:
        if record.operation_type == "ledger_retirement" and record.metadata.get("certificate_id") == certificate_id:
            return RetirementCertificateResponse(
                certificate_id=certificate_id,
                status=record.status,
                beneficiary=str(record.metadata.get("beneficiary", "")),
                purpose=str(record.metadata.get("purpose", "")),
                serial_prefix=str(record.metadata.get("serial_prefix", "")),
                quantity_tco2e=int(record.metadata.get("quantity_tco2e", 0)),
                retired_at=record.created_at,
                verification_hash=str(record.metadata.get("operation_id", record.id)),
            )
    return RetirementCertificateResponse(
        certificate_id=certificate_id,
        status="not_found",
        beneficiary="",
        purpose="",
        serial_prefix="",
        quantity_tco2e=0,
        retired_at=datetime.now(tz=UTC),
        verification_hash="",
    )


@operations_router.post("/rules/adopt", response_model=NationalActionResponse, status_code=status.HTTP_201_CREATED)
async def adopt_registry_rule(
    request: RegistryRuleRequest,
    audit_writer: AuditWriter = Depends(get_audit_writer),
    current_user: CurrentUser = Depends(get_current_user),
    x_correlation_id: UUID | None = Header(default=None, alias="X-Correlation-Id"),
) -> NationalActionResponse:
    return await _write_operation(
        payload={
            "operation_type": "registry_rule",
            "status": "adopted",
            "title": request.title,
            "stage": 1,
            "owner": "National Registry Authority",
            "controls": ["Legal authority referenced", "Effective date locked", "Rulebook audit entry created"],
            "message": "Registry operating rule adopted.",
            **request.model_dump(),
        },
        audit_writer=audit_writer,
        current_user=current_user,
        x_correlation_id=x_correlation_id,
    )


@operations_router.post("/public-disclosures/publish", response_model=NationalActionResponse, status_code=status.HTTP_201_CREATED)
async def publish_public_disclosure(
    request: PublicDisclosureRequest,
    audit_writer: AuditWriter = Depends(get_audit_writer),
    current_user: CurrentUser = Depends(get_current_user),
    x_correlation_id: UUID | None = Header(default=None, alias="X-Correlation-Id"),
) -> NationalActionResponse:
    return await _write_operation(
        payload={
            "operation_type": "public_disclosure",
            "status": "published",
            "title": request.title,
            "stage": 1 if request.disclosure_type in {"methodology", "project"} else 8,
            "owner": "Public Registry Desk",
            "controls": ["Disclosure approval captured", "Publication reference locked", "Public registry timeline updated"],
            "message": "Public disclosure published to the registry transparency workflow.",
            **request.model_dump(),
        },
        audit_writer=audit_writer,
        current_user=current_user,
        x_correlation_id=x_correlation_id,
    )


@operations_router.post("/appeals/open", response_model=NationalActionResponse, status_code=status.HTTP_201_CREATED)
async def open_appeal_case(
    request: AppealCaseRequest,
    audit_writer: AuditWriter = Depends(get_audit_writer),
    current_user: CurrentUser = Depends(get_current_user),
    x_correlation_id: UUID | None = Header(default=None, alias="X-Correlation-Id"),
) -> NationalActionResponse:
    return await _write_operation(
        payload={
            "operation_type": "appeal_case",
            "status": "open",
            "title": f"Appeal by {request.appellant}",
            "stage": 1,
            "owner": "Appeals Secretariat",
            "controls": ["Decision reference captured", "Appeal grounds recorded", "Regulator review clock started"],
            "message": "Appeal case opened.",
            **request.model_dump(),
        },
        audit_writer=audit_writer,
        current_user=current_user,
        x_correlation_id=x_correlation_id,
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


@operations_router.post("/gis/jobs", response_model=NationalActionResponse, status_code=status.HTTP_201_CREATED)
async def record_gis_processing_job(
    request: GisProcessingJobRequest,
    audit_writer: AuditWriter = Depends(get_audit_writer),
    current_user: CurrentUser = Depends(get_current_user),
    x_correlation_id: UUID | None = Header(default=None, alias="X-Correlation-Id"),
) -> NationalActionResponse:
    return await _write_operation(
        payload={
            "operation_type": "gis_processing_job",
            "status": "lineage_recorded",
            "title": f"{request.project_code} {request.job_type}",
            "stage": 4,
            "owner": "GIS Operations",
            "controls": ["Source dataset recorded", "Processing hash locked", "Spatial decision reproducibility enabled"],
            "message": "GIS processing job lineage recorded.",
            **request.model_dump(),
        },
        audit_writer=audit_writer,
        current_user=current_user,
        x_correlation_id=x_correlation_id,
    )


@operations_router.post("/verification/non-conformances", response_model=NationalActionResponse, status_code=status.HTTP_201_CREATED)
async def open_non_conformance(
    request: NonConformanceRequest,
    audit_writer: AuditWriter = Depends(get_audit_writer),
    current_user: CurrentUser = Depends(get_current_user),
    x_correlation_id: UUID | None = Header(default=None, alias="X-Correlation-Id"),
) -> NationalActionResponse:
    return await _write_operation(
        payload={
            "operation_type": "non_conformance",
            "status": "open",
            "title": f"{request.project_code} {request.severity} non-conformance",
            "stage": 5,
            "owner": "Verification Oversight",
            "controls": ["Finding recorded", "Severity classified", "Corrective action deadline locked"],
            "message": "Verification non-conformance opened.",
            **request.model_dump(),
        },
        audit_writer=audit_writer,
        current_user=current_user,
        x_correlation_id=x_correlation_id,
    )


@operations_router.post("/verification/buffer-allocations", response_model=NationalActionResponse, status_code=status.HTTP_201_CREATED)
async def allocate_buffer_pool(
    request: BufferAllocationRequest,
    audit_writer: AuditWriter = Depends(get_audit_writer),
    current_user: CurrentUser = Depends(get_current_user),
    x_correlation_id: UUID | None = Header(default=None, alias="X-Correlation-Id"),
) -> NationalActionResponse:
    buffer_quantity = round(request.issued_tco2e * (request.buffer_percent / 100))
    return await _write_operation(
        payload={
            "operation_type": "buffer_allocation",
            "status": "allocated",
            "title": f"{request.project_code} buffer allocation",
            "stage": 5,
            "owner": "Issuance Control Desk",
            "controls": ["Reversal risk classified", "Buffer percentage applied", "Net issuable volume calculated"],
            "message": "Buffer allocation recorded for issuance risk control.",
            "buffer_quantity_tco2e": buffer_quantity,
            "net_issuable_tco2e": request.issued_tco2e - buffer_quantity,
            **request.model_dump(),
        },
        audit_writer=audit_writer,
        current_user=current_user,
        x_correlation_id=x_correlation_id,
    )


@operations_router.post("/ledger/transfers", response_model=NationalActionResponse, status_code=status.HTTP_201_CREATED)
async def transfer_credit_units(
    request: LedgerTransferRequest,
    audit_writer: AuditWriter = Depends(get_audit_writer),
    current_user: CurrentUser = Depends(get_current_user),
    x_correlation_id: UUID | None = Header(default=None, alias="X-Correlation-Id"),
) -> NationalActionResponse:
    return await _write_operation(
        payload={
            "operation_type": "ledger_transfer",
            "status": "transferred",
            "title": f"{request.quantity_tco2e} tCO2e transfer {request.serial_prefix}",
            "stage": 6,
            "owner": "National Ledger",
            "controls": ["Source account debited", "Destination account credited", "Settlement reference linked"],
            "message": "Credit transfer recorded in the national ledger workflow.",
            **request.model_dump(),
        },
        audit_writer=audit_writer,
        current_user=current_user,
        x_correlation_id=x_correlation_id,
    )


@operations_router.post("/ledger/retirements", response_model=NationalActionResponse, status_code=status.HTTP_201_CREATED)
async def retire_credit_units(
    request: LedgerRetirementRequest,
    audit_writer: AuditWriter = Depends(get_audit_writer),
    current_user: CurrentUser = Depends(get_current_user),
    x_correlation_id: UUID | None = Header(default=None, alias="X-Correlation-Id"),
) -> NationalActionResponse:
    certificate_id = f"ZW-RET-{datetime.now(tz=UTC).strftime('%Y%m%d')}-{uuid4().hex[:8].upper()}"
    return await _write_operation(
        payload={
            "operation_type": "ledger_retirement",
            "status": "retired",
            "title": f"Retirement certificate {certificate_id}",
            "stage": 6,
            "owner": "National Ledger",
            "controls": ["Units removed from circulation", "Beneficiary captured", "Public certificate generated"],
            "message": "Credit retirement recorded and certificate generated.",
            "certificate_id": certificate_id,
            **request.model_dump(),
        },
        audit_writer=audit_writer,
        current_user=current_user,
        x_correlation_id=x_correlation_id,
    )


@operations_router.post("/ledger/freezes", response_model=NationalActionResponse, status_code=status.HTTP_201_CREATED)
async def freeze_credit_units(
    request: LedgerFreezeRequest,
    audit_writer: AuditWriter = Depends(get_audit_writer),
    current_user: CurrentUser = Depends(get_current_user),
    x_correlation_id: UUID | None = Header(default=None, alias="X-Correlation-Id"),
) -> NationalActionResponse:
    return await _write_operation(
        payload={
            "operation_type": "ledger_freeze",
            "status": "frozen",
            "title": f"{request.freeze_scope} freeze {request.serial_prefix}",
            "stage": 6,
            "owner": "Regulatory Enforcement",
            "controls": ["Transfer hold applied", "Reason recorded", "Enforcement timeline updated"],
            "message": "Credit units frozen for regulatory control.",
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


@operations_router.post("/marketplace/settlements", response_model=NationalActionResponse, status_code=status.HTTP_201_CREATED)
async def record_market_settlement(
    request: MarketSettlementRequest,
    audit_writer: AuditWriter = Depends(get_audit_writer),
    current_user: CurrentUser = Depends(get_current_user),
    x_correlation_id: UUID | None = Header(default=None, alias="X-Correlation-Id"),
) -> NationalActionResponse:
    return await _write_operation(
        payload={
            "operation_type": "market_settlement",
            "status": request.settlement_status,
            "title": f"Settlement {request.listing_reference}",
            "stage": 8,
            "owner": "Market Oversight Desk",
            "controls": ["Buyer account linked", "Seller account linked", "Settlement state locked"],
            "message": "Marketplace settlement control recorded.",
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
