from abc import ABC, abstractmethod
from uuid import UUID

from app.domain.entities.carbon_project import CarbonProject


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
