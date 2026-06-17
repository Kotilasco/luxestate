from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.ports import AuditReader
from app.infrastructure.database.models import AuditEventModel


class SqlAlchemyAuditReader(AuditReader):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_for_resource(self, resource_type: str, resource_id: UUID, limit: int) -> list[AuditEventModel]:
        result = await self._session.execute(
            select(AuditEventModel)
            .where(
                AuditEventModel.resource_type == resource_type,
                AuditEventModel.resource_id == resource_id,
                AuditEventModel.deleted_at.is_(None),
            )
            .order_by(AuditEventModel.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
