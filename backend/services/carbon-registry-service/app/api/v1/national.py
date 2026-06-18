from datetime import UTC, datetime
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel


router = APIRouter(prefix="/api/v1/national-readiness", tags=["National Registry Readiness"])


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
