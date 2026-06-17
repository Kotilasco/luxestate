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


class ErrorResponse(BaseModel):
    code: str
    message: str
    correlation_id: UUID
