from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RegisterCarbonProjectRequest(BaseModel):
    project_code: str = Field(min_length=3, max_length=40, pattern=r"^[A-Z]{2,10}-[0-9]{4,12}$")
    title: str = Field(min_length=5, max_length=255)
    description: str = Field(min_length=20)
    methodology: str = Field(min_length=3, max_length=120)
    proponent_organization_id: UUID
    district: str = Field(min_length=2, max_length=120)
    province: str = Field(min_length=2, max_length=120)
    estimated_annual_tco2e: Decimal = Field(gt=0, max_digits=18, decimal_places=4)
    start_date: date
    crediting_period_years: int = Field(ge=1, le=100)


class CarbonProjectResponse(BaseModel):
    id: UUID
    project_code: str
    title: str
    description: str
    methodology: str
    proponent_organization_id: UUID
    district: str
    province: str
    status: str
    estimated_annual_tco2e: Decimal
    start_date: date
    crediting_period_years: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProjectWorkflowRequest(BaseModel):
    action: Literal[
        "submit_for_verification",
        "start_verification",
        "approve",
        "reject",
        "suspend",
    ]
    reason: str = Field(min_length=3, max_length=500)


class IssueCreditBatchRequest(BaseModel):
    vintage_year: int = Field(ge=2000, le=2100)
    quantity_tco2e: Decimal = Field(gt=0, max_digits=18, decimal_places=4)


class CreditBatchResponse(BaseModel):
    id: UUID
    project_id: UUID
    vintage_year: int
    quantity_tco2e: Decimal
    serial_prefix: str
    status: str
    blockchain_tx_id: str | None
    issued_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditEventResponse(BaseModel):
    id: UUID
    event_type: str
    actor_id: UUID | None
    actor_role: str | None
    resource_type: str
    resource_id: UUID | None
    action: str
    outcome: str
    correlation_id: UUID
    metadata: dict[str, object] = Field(alias="metadata_")
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class GisLayerResponse(BaseModel):
    name: str
    status: str
    summary: str


class GisAssessmentResponse(BaseModel):
    project_id: UUID
    district: str
    province: str
    centroid_latitude: Decimal
    centroid_longitude: Decimal
    estimated_area_hectares: Decimal
    forest_cover_percent: Decimal
    carbon_density_tco2e_per_hectare: Decimal
    fire_risk_level: str
    boundary_validation_status: str
    layers: list[GisLayerResponse]
    evidence_sources: list[str]
    findings: list[str]
    recommendation: str
    generated_at: datetime


class AiReviewResponse(BaseModel):
    project_id: UUID
    review_type: str
    model_version: str
    prompt_version: str
    confidence_score: Decimal
    risk_level: str
    findings: list[str]
    required_actions: list[str]
    recommendation: str
    generated_at: datetime


class GisEvidenceSubmissionRequest(BaseModel):
    boundary_geojson: str = Field(min_length=20)
    satellite_scene_id: str = Field(min_length=3, max_length=160)
    land_cover_source: str = Field(min_length=3, max_length=160)
    fire_alert_source: str = Field(min_length=3, max_length=160)
    field_mrv_reference: str = Field(min_length=3, max_length=160)
    verifier_notes: str = Field(min_length=10, max_length=1000)


class EvidenceRecordResponse(BaseModel):
    id: UUID
    evidence_type: str
    status: str
    submitted_by: UUID | None
    submitted_role: str | None
    metadata: dict[str, object]
    created_at: datetime


class ValidationDecisionRequest(BaseModel):
    decision: Literal["valid", "invalid", "requires_revision"]
    notes: str = Field(min_length=5, max_length=1000)


class ValidationDecisionResponse(BaseModel):
    project_id: UUID
    validation_type: str
    status: str
    notes: str
    validated_by: UUID | None
    generated_at: datetime


class StartVerificationRequest(BaseModel):
    monitoring_period_start: date
    monitoring_period_end: date
    assigned_verifier: str = Field(default="Not Assigned", min_length=3, max_length=160)


class VerificationFileRequest(BaseModel):
    file_name: str = Field(min_length=3, max_length=255)
    category: Literal[
        "boundary",
        "monitoring_report",
        "carbon_calculation",
        "biomass_inventory",
        "satellite_imagery",
        "field_photo",
        "inspection_form",
        "drone_imagery",
        "verifier_statement",
        "accreditation_certificate",
        "digital_signature",
    ]
    mime_type: str = Field(min_length=3, max_length=120)
    file_size_bytes: int = Field(gt=0)
    capture_date: date | None = None
    digital_signature: str = Field(min_length=8, max_length=255)


class EvidencePackageRequest(BaseModel):
    files: list[VerificationFileRequest] = Field(min_length=1)
    package_notes: str = Field(min_length=10, max_length=1000)


class VerificationDecisionRequest(BaseModel):
    decision: Literal["pass", "warning", "fail", "approve", "reject", "request_more_information", "return_for_revision"]
    comments: str = Field(min_length=5, max_length=1000)
    digital_signature: str = Field(min_length=8, max_length=255)


class VerificationCaseResponse(BaseModel):
    verification_id: str
    project_id: UUID
    status: str
    assigned_verifier: str
    monitoring_period_start: date
    monitoring_period_end: date
    evidence_complete: bool
    automatic_validation_status: str
    ai_status: str
    gis_status: str
    mrv_status: str
    verifier_status: str
    zicma_status: str
    integrity_score: Decimal | None = None
    risk_score: Decimal | None = None
    confidence_score: Decimal | None = None
    outstanding_actions: list[str]
    created_at: datetime
    updated_at: datetime


class EvidencePackageResponse(BaseModel):
    verification_id: str
    status: str
    files: list[dict[str, object]]
    evidence_complete: bool
    created_at: datetime


class VerificationAssessmentResponse(BaseModel):
    verification_id: str
    stage: str
    status: str
    integrity_score: Decimal | None = None
    risk_score: Decimal | None = None
    confidence_score: Decimal | None = None
    findings: list[str]
    required_actions: list[str]
    generated_at: datetime


class VerificationDecisionResponse(BaseModel):
    verification_id: str
    stage: str
    status: str
    comments: str
    digital_signature: str
    generated_at: datetime


class ErrorResponse(BaseModel):
    code: str
    message: str
    correlation_id: UUID
