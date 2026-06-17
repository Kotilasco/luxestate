from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum
from uuid import UUID


class ProjectStatus(StrEnum):
    DRAFT = "draft"
    SUBMITTED_FOR_VERIFICATION = "submitted_for_verification"
    UNDER_VERIFICATION = "under_verification"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


@dataclass(frozen=True)
class CarbonProject:
    id: UUID
    project_code: str
    title: str
    description: str
    methodology: str
    proponent_organization_id: UUID
    district: str
    province: str
    status: ProjectStatus
    estimated_annual_tco2e: Decimal
    start_date: date
    crediting_period_years: int
    created_at: datetime
    updated_at: datetime
    created_by: UUID | None
    updated_by: UUID | None

    def assert_can_submit_for_verification(self) -> None:
        if self.status != ProjectStatus.DRAFT:
            raise ValueError("Only draft projects can be submitted for verification.")
