from collections.abc import AsyncGenerator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.ports import AuditReader, AuditWriter, CarbonProjectRepository, CreditBatchRepository
from app.infrastructure.database.session import get_session
from app.infrastructure.repositories.sqlalchemy_audit_reader import SqlAlchemyAuditReader


async def get_db_session(
    session: AsyncSession = Depends(get_session),
) -> AsyncGenerator[AsyncSession, None]:
    yield session
from app.infrastructure.repositories.sqlalchemy_audit_writer import SqlAlchemyAuditWriter
from app.infrastructure.repositories.sqlalchemy_carbon_project_repository import (
    SqlAlchemyCarbonProjectRepository,
)
from app.infrastructure.repositories.sqlalchemy_credit_batch_repository import SqlAlchemyCreditBatchRepository


async def get_project_repository(
    session: AsyncSession = Depends(get_session),
) -> AsyncGenerator[CarbonProjectRepository, None]:
    yield SqlAlchemyCarbonProjectRepository(session)


async def get_audit_writer(
    session: AsyncSession = Depends(get_session),
) -> AsyncGenerator[AuditWriter, None]:
    yield SqlAlchemyAuditWriter(session)


async def get_credit_batch_repository(
    session: AsyncSession = Depends(get_session),
) -> AsyncGenerator[CreditBatchRepository, None]:
    yield SqlAlchemyCreditBatchRepository(session)


async def get_audit_reader(
    session: AsyncSession = Depends(get_session),
) -> AsyncGenerator[AuditReader, None]:
    yield SqlAlchemyAuditReader(session)
