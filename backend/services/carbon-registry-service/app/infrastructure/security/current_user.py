from dataclasses import dataclass
from uuid import UUID

from fastapi import Header


@dataclass(frozen=True)
class CurrentUser:
    actor_id: UUID | None
    actor_role: str | None


async def get_current_user(
    x_actor_id: UUID | None = Header(default=None, alias="X-Actor-Id"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
) -> CurrentUser:
    return CurrentUser(actor_id=x_actor_id, actor_role=x_actor_role)
