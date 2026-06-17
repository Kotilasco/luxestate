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
    CREDITS_ISSUED = "credits_issued"
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

    def assert_can_start_verification(self) -> None:
        if self.status != ProjectStatus.SUBMITTED_FOR_VERIFICATION:
            raise ValueError("Only submitted projects can enter verification.")

    def assert_can_approve(self) -> None:
        if self.status != ProjectStatus.UNDER_VERIFICATION:
            raise ValueError("Only projects under verification can be approved.")

    def assert_can_issue_credits(self) -> None:
        if self.status not in {ProjectStatus.APPROVED, ProjectStatus.CREDITS_ISSUED}:
            raise ValueError("Only approved projects can receive issued credits.")
