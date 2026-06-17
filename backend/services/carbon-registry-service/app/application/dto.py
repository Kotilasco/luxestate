from datetime import date, datetime
from decimal import Decimal
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


class ErrorResponse(BaseModel):
    code: str
    message: str
    correlation_id: UUID
