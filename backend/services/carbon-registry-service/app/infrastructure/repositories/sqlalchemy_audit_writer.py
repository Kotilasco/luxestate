from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.application.ports import AuditWriter
from app.infrastructure.database.models import AuditEventModel


class SqlAlchemyAuditWriter(AuditWriter):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

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
        now = datetime.now(tz=UTC)
        self._session.add(
            AuditEventModel(
                id=uuid4(),
                event_type=event_type,
                actor_id=actor_id,
                actor_role=actor_role,
                organization_id=organization_id,
                resource_type=resource_type,
                resource_id=resource_id,
                action=action,
                outcome=outcome,
                ip_address=str(metadata.get("ip_address")) if metadata.get("ip_address") else None,
                device=str(metadata.get("device")) if metadata.get("device") else None,
                workflow_step=str(metadata.get("workflow_step", action)),
                digital_signature=str(metadata.get("digital_signature")) if metadata.get("digital_signature") else None,
                old_value=metadata.get("old_value") if isinstance(metadata.get("old_value"), dict) else None,
                new_value=metadata.get("new_value") if isinstance(metadata.get("new_value"), dict) else None,
                correlation_id=correlation_id,
                metadata_=metadata,
                created_at=now,
                updated_at=now,
                created_by=actor_id,
                updated_by=actor_id,
            )
        )
        await self._session.commit()
