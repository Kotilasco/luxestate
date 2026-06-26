"""Pydantic schemas for AI Validation Service."""

from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum
from typing import Any, Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field


class AIComponent(StrEnum):
    PDD = "pdd"
    ADDITIONALITY = "additionality"
    REMOTE_SENSING = "remote_sensing"


class ValidationStatus(StrEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    OVERRIDDEN = "overridden"


class OverrideStatus(StrEnum):
    NONE = "none"
    REQUESTED = "requested"
    APPROVED = "approved"
    REJECTED = "rejected"


class AIResultMetadata(BaseModel):
    """Metadata attached to all AI validation results."""

    model_config = ConfigDict(from_attributes=True)

    confidence_score: float = Field(ge=0.0, le=1.0)
    explanation: str
    evidence_references: list[str] = Field(default_factory=list)
    model_version: str
    prompt_version: str = "1.0.0"
    audit_event_id: UUID = Field(default_factory=uuid4)
    human_override_status: OverrideStatus = OverrideStatus.NONE
    human_override_by: UUID | None = None
    human_override_reason: str | None = None


# ===== PDD Co-Pilot Schemas =====

class ProjectLocation(BaseModel):
    district: str
    province: str
    coordinates: tuple[float, float] | None = None


class PDDDraftRequest(BaseModel):
    project_id: UUID
    description: str = Field(min_length=50, max_length=5000)
    project_type: Literal["forestry", "agriculture", "renewable_energy", "waste", "industrial"]
    location: ProjectLocation | None = None


class MethodologyMatch(BaseModel):
    methodology_id: str
    name: str
    relevance_score: float = Field(ge=0.0, le=1.0)
    applicability_conditions: list[str]


class PDDDrafSection(BaseModel):
    """Individual PDD section."""

    title: str
    content: str
    si48_compliance_score: float = Field(ge=0.0, le=1.0)
    missing_elements: list[str] = Field(default_factory=list)


class PDDDraftResponse(BaseModel):
    draft_id: UUID = Field(default_factory=uuid4)
    project_id: UUID
    structured_sections: dict[str, PDDDrafSection]
    methodology_suggestions: list[MethodologyMatch]
    compliance_score: float = Field(ge=0.0, le=100.0)
    missing_fields: list[str] = Field(default_factory=list)
    suggested_improvements: list[str] = Field(default_factory=list)
    metadata: AIResultMetadata


class SI48Violation(BaseModel):
    section: str
    severity: Literal["error", "warning", "info"]
    message: str
    suggestion: str


class PDDValidationRequest(BaseModel):
    project_id: UUID
    pdd_content: dict[str, Any]


class PDDValidationResponse(BaseModel):
    validation_id: UUID = Field(default_factory=uuid4)
    project_id: UUID
    is_compliant: bool
    si48_score: float = Field(ge=0.0, le=100.0)
    violations: list[SI48Violation]
    suggestions: list[str]
    metadata: AIResultMetadata


class MethodologySuggestionRequest(BaseModel):
    project_type: str
    description: str
    location: ProjectLocation | None = None


class MethodologySuggestionResponse(BaseModel):
    suggestions: list[MethodologyMatch]
    metadata: AIResultMetadata


# ===== Additionality Checker Schemas =====

class FinancialData(BaseModel):
    investment_required_usd: Decimal | None = None
    carbon_revenue_percentage: float | None = Field(None, ge=0.0, le=100.0)
    payback_period_years: float | None = None
    irr_without_carbon: float | None = None


class AdditionalityRequest(BaseModel):
    project_id: UUID
    project_description: str
    project_type: str
    location: ProjectLocation | None = None
    financial_data: FinancialData | None = None
    barriers: list[str] = Field(default_factory=list)


class BaselineAnalysis(BaseModel):
    baseline_emissions_tco2e_per_year: float
    baseline_scenario_description: str
    calculation_methodology: str
    confidence: float = Field(ge=0.0, le=1.0)


class LegislationMatch(BaseModel):
    law_reference: str
    requirement: str
    compliance_status: Literal["compliant", "non_compliant", "not_applicable"]


class LegislationAnalysis(BaseModel):
    applicable_laws: list[LegislationMatch]
    conflicts_identified: list[str]
    overall_compliance_score: float = Field(ge=0.0, le=1.0)


class FinancialAnalysis(BaseModel):
    irr_without_carbon: float | None
    irr_with_carbon: float | None
    financial_viability_without_carbon: bool
    carbon_revenue_dependence: Literal["critical", "significant", "minor", "none"]
    analysis_notes: str


class BarrierAssessment(BaseModel):
    barrier_type: Literal["financial", "institutional", "technical", "social"]
    description: str
    severity: Literal["high", "medium", "low"]
    evidence: str


class BarrierAnalysis(BaseModel):
    identified_barriers: list[BarrierAssessment]
    overall_barrier_score: float = Field(ge=0.0, le=1.0)


class AdditionalityConclusion(StrEnum):
    ADDITIONAL = "additional"
    NOT_ADDITIONAL = "not_additional"
    INCONCLUSIVE = "inconclusive"


class AdditionalityResponse(BaseModel):
    assessment_id: UUID = Field(default_factory=uuid4)
    project_id: UUID
    overall_score: float = Field(ge=0.0, le=100.0)
    conclusion: AdditionalityConclusion
    confidence: float = Field(ge=0.0, le=1.0)
    baseline_scenario: BaselineAnalysis
    legislation_analysis: LegislationAnalysis
    financial_analysis: FinancialAnalysis
    barrier_analysis: BarrierAnalysis
    reasoning_summary: str
    metadata: AIResultMetadata


# ===== Remote Sensing Schemas =====

class RemoteSensingRequest(BaseModel):
    project_id: UUID
    boundary_geojson: dict[str, Any]
    analysis_types: list[Literal["forest_cover", "biomass", "agriculture", "change_detection", "anomaly_detection"]]
    date_range: tuple[date, date] | None = None
    satellite_sources: list[Literal["landsat_8", "landsat_9", "sentinel_2", "sentinel_1", "modis"]] | None = None


class RemoteSensingJobResponse(BaseModel):
    analysis_id: UUID = Field(default_factory=uuid4)
    project_id: UUID
    status: ValidationStatus
    estimated_completion: datetime | None = None
    message: str | None = None


class HistoricalReading(BaseModel):
    date: date
    forest_cover_percent: float
    carbon_stock_tco2e: float
    biomass_density_mg_per_ha: float
    data_quality_score: float = Field(ge=0.0, le=1.0)


class AnomalyType(StrEnum):
    DEFORESTATION = "deforestation"
    BURNING = "burning"
    ILLEGAL_LOGGING = "illegal_logging"
    ENCROACHMENT = "encroachment"


class DetectedAnomaly(BaseModel):
    anomaly_id: UUID = Field(default_factory=uuid4)
    anomaly_type: AnomalyType
    severity: Literal["critical", "high", "medium", "low"]
    detected_date: date
    area_affected_ha: float
    coordinates: list[float]  # [lat, lon]
    confidence: float = Field(ge=0.0, le=1.0)
    satellite_image_url: str | None = None
    description: str


class RemoteSensingResults(BaseModel):
    analysis_id: UUID
    project_area_km2: float
    forest_cover_percent: float
    carbon_stock_tco2e: float
    biomass_density_mg_per_ha: float
    historical_readings: list[HistoricalReading]
    anomalies: list[DetectedAnomaly]
    satellite_sources_used: list[str]
    imagery_date_range: tuple[date, date]
    metadata: AIResultMetadata


class CarbonForecast(BaseModel):
    year: int
    predicted_carbon_stock: float
    confidence_interval_lower: float
    confidence_interval_upper: float
    risk_factors: list[str]


class CarbonForecastResponse(BaseModel):
    analysis_id: UUID
    forecast_years: int
    annual_predictions: list[CarbonForecast]
    metadata: AIResultMetadata


class AlertConfigRequest(BaseModel):
    project_id: UUID
    deforestation_threshold_percent: float = Field(default=5.0, ge=0.0, le=100.0)
    anomaly_confidence_threshold: float = Field(default=0.8, ge=0.0, le=1.0)
    monitoring_frequency_days: int = Field(default=30, ge=1, le=365)
    alert_recipients: list[str]


class AlertConfigResponse(BaseModel):
    config_id: UUID = Field(default_factory=uuid4)
    project_id: UUID
    status: Literal["active", "paused"]
    message: str


# ===== Governance Schemas =====

class AIExplanationResponse(BaseModel):
    validation_id: UUID
    component: AIComponent
    explanation: str
    confidence_score: float
    evidence_references: list[str]
    model_decision_path: str | None = None


class OverrideRequest(BaseModel):
    reason: str = Field(min_length=20)
    new_decision: str
    supporting_evidence: list[str] = Field(default_factory=list)


class OverrideResponse(BaseModel):
    override_id: UUID = Field(default_factory=uuid4)
    status: Literal["pending", "approved", "rejected"]
    original_result: dict[str, Any]
    overridden_by: UUID
    override_timestamp: datetime = Field(default_factory=datetime.utcnow)
    message: str


class AuditLogEntry(BaseModel):
    audit_id: UUID
    timestamp: datetime
    component: AIComponent
    project_id: UUID
    actor_id: UUID | None
    action: str
    result_summary: dict[str, Any]
    confidence_score: float | None
    model_version: str


class AuditLogResponse(BaseModel):
    entries: list[AuditLogEntry]
    total_count: int
    page: int
    page_size: int
