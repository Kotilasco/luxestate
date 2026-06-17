from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True)
class CarbonProjectRegistered:
    project_id: UUID
    project_code: str
    organization_id: UUID
    occurred_at: datetime
    actor_id: UUID | None
