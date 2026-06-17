from collections.abc import AsyncGenerator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.ports import AuditWriter, CarbonProjectRepository
from app.infrastructure.database.session import get_session
from app.infrastructure.repositories.sqlalchemy_audit_writer import SqlAlchemyAuditWriter
from app.infrastructure.repositories.sqlalchemy_carbon_project_repository import (
    SqlAlchemyCarbonProjectRepository,
)


async def get_project_repository(
    session: AsyncSession = Depends(get_session),
) -> AsyncGenerator[CarbonProjectRepository, None]:
    yield SqlAlchemyCarbonProjectRepository(session)


async def get_audit_writer(
    session: AsyncSession = Depends(get_session),
) -> AsyncGenerator[AuditWriter, None]:
    yield SqlAlchemyAuditWriter(session)
