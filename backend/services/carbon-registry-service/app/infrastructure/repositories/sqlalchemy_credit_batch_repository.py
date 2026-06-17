from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.ports import CreditBatchRecord, CreditBatchRepository
from app.infrastructure.database.models import CarbonCreditBatchModel


class SqlAlchemyCreditBatchRepository(CreditBatchRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

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
        now = datetime.now(tz=UTC)
        model = CarbonCreditBatchModel(
            id=uuid4(),
            project_id=project_id,
            vintage_year=vintage_year,
            quantity_tco2e=quantity_tco2e,
            serial_prefix=serial_prefix,
            status="issued",
            blockchain_tx_id=blockchain_tx_id,
            issued_at=now,
            created_at=now,
            updated_at=now,
            created_by=actor_id,
            updated_by=actor_id,
        )
        self._session.add(model)
        await self._session.commit()
        await self._session.refresh(model)
        return model

    async def list_for_project(self, project_id: UUID) -> list[CreditBatchRecord]:
        result = await self._session.execute(
            select(CarbonCreditBatchModel)
            .where(
                CarbonCreditBatchModel.project_id == project_id,
                CarbonCreditBatchModel.deleted_at.is_(None),
            )
            .order_by(CarbonCreditBatchModel.created_at.desc())
        )
        return list(result.scalars().all())
