from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.ports import CarbonProjectRepository
from app.domain.entities.carbon_project import CarbonProject, ProjectStatus
from app.infrastructure.database.models import CarbonProjectModel


def _to_domain(model: CarbonProjectModel) -> CarbonProject:
    return CarbonProject(
        id=model.id,
        project_code=model.project_code,
        title=model.title,
        description=model.description,
        methodology=model.methodology,
        proponent_organization_id=model.proponent_organization_id,
        district=model.district,
        province=model.province,
        status=ProjectStatus(model.status),
        estimated_annual_tco2e=model.estimated_annual_tco2e,
        start_date=model.start_date,
        crediting_period_years=model.crediting_period_years,
        created_at=model.created_at,
        updated_at=model.updated_at,
        created_by=model.created_by,
        updated_by=model.updated_by,
    )


class SqlAlchemyCarbonProjectRepository(CarbonProjectRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, project: CarbonProject) -> CarbonProject:
        model = CarbonProjectModel(
            id=project.id,
            project_code=project.project_code,
            title=project.title,
            description=project.description,
            methodology=project.methodology,
            proponent_organization_id=project.proponent_organization_id,
            district=project.district,
            province=project.province,
            status=project.status.value,
            estimated_annual_tco2e=project.estimated_annual_tco2e,
            start_date=project.start_date,
            crediting_period_years=project.crediting_period_years,
            created_at=project.created_at,
            updated_at=project.updated_at,
            created_by=project.created_by,
            updated_by=project.updated_by,
        )
        self._session.add(model)
        await self._session.commit()
        return project

    async def get_by_id(self, project_id: UUID) -> CarbonProject | None:
        result = await self._session.execute(
            select(CarbonProjectModel).where(
                CarbonProjectModel.id == project_id,
                CarbonProjectModel.deleted_at.is_(None),
            )
        )
        model = result.scalar_one_or_none()
        return _to_domain(model) if model else None

    async def get_by_code(self, project_code: str) -> CarbonProject | None:
        result = await self._session.execute(
            select(CarbonProjectModel).where(
                CarbonProjectModel.project_code == project_code,
                CarbonProjectModel.deleted_at.is_(None),
            )
        )
        model = result.scalar_one_or_none()
        return _to_domain(model) if model else None

    async def list(self, limit: int, offset: int) -> list[CarbonProject]:
        result = await self._session.execute(
            select(CarbonProjectModel)
            .where(CarbonProjectModel.deleted_at.is_(None))
            .order_by(CarbonProjectModel.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return [_to_domain(model) for model in result.scalars().all()]

    async def update_status(self, project_id: UUID, status: ProjectStatus, actor_id: UUID | None) -> CarbonProject | None:
        result = await self._session.execute(
            select(CarbonProjectModel).where(
                CarbonProjectModel.id == project_id,
                CarbonProjectModel.deleted_at.is_(None),
            )
        )
        model = result.scalar_one_or_none()
        if model is None:
            return None

        model.status = status.value
        model.updated_at = datetime.now(tz=UTC)
        model.updated_by = actor_id
        await self._session.commit()
        await self._session.refresh(model)
        return _to_domain(model)
