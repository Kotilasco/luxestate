from abc import ABC, abstractmethod
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from app.domain.entities.carbon_project import CarbonProject
from app.domain.entities.carbon_project import ProjectStatus


class CarbonProjectRepository(ABC):
    @abstractmethod
    async def add(self, project: CarbonProject) -> CarbonProject:
        raise NotImplementedError

    @abstractmethod
    async def get_by_id(self, project_id: UUID) -> CarbonProject | None:
        raise NotImplementedError

    @abstractmethod
    async def get_by_code(self, project_code: str) -> CarbonProject | None:
        raise NotImplementedError

    @abstractmethod
    async def list(self, limit: int, offset: int) -> list[CarbonProject]:
        raise NotImplementedError

    @abstractmethod
    async def update_status(self, project_id: UUID, status: ProjectStatus, actor_id: UUID | None) -> CarbonProject | None:
        raise NotImplementedError


class CreditBatchRecord(ABC):
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


class CreditBatchRepository(ABC):
    @abstractmethod
    async def issue(
        self,
        *,
        project_id: UUID,
        vintage_year: int,
        quantity_tco2e: Decimal,
        serial_prefix: str,
        blockchain_tx_id: str,
        actor_id: UUID | None,
    ) -> CreditBatchRecord:
        raise NotImplementedError

    @abstractmethod
    async def list_for_project(self, project_id: UUID) -> list[CreditBatchRecord]:
        raise NotImplementedError


class AuditWriter(ABC):
    @abstractmethod
    async def write(
        self,
        *,
        event_type: str,
        actor_id: UUID | None,
        actor_role: str | None,
        organization_id: UUID | None,
        resource_type: str,
        resource_id: UUID | None,
        action: str,
        outcome: str,
        correlation_id: UUID,
        metadata: dict[str, object],
    ) -> None:
        raise NotImplementedError


class AuditReader(ABC):
    @abstractmethod
    async def list_for_resource(self, resource_type: str, resource_id: UUID, limit: int) -> list[object]:
        raise NotImplementedError
