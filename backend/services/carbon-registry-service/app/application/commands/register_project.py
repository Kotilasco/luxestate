from datetime import UTC, datetime
from uuid import UUID, uuid4

from app.application.dto import CarbonProjectResponse, RegisterCarbonProjectRequest
from app.application.ports import AuditWriter, CarbonProjectRepository
from app.domain.entities.carbon_project import CarbonProject, ProjectStatus


class ProjectAlreadyExistsError(Exception):
    pass


class RegisterCarbonProjectCommand:
    def __init__(self, repository: CarbonProjectRepository, audit_writer: AuditWriter) -> None:
        self._repository = repository
        self._audit_writer = audit_writer

    async def execute(
        self,
        request: RegisterCarbonProjectRequest,
        *,
        actor_id: UUID | None,
        actor_role: str | None,
        correlation_id: UUID,
    ) -> CarbonProjectResponse:
        existing = await self._repository.get_by_code(request.project_code)
        if existing is not None:
            await self._audit_writer.write(
                event_type="carbon.project.registration_rejected",
                actor_id=actor_id,
                actor_role=actor_role,
                organization_id=request.proponent_organization_id,
                resource_type="carbon_project",
                resource_id=existing.id,
                action="register_project",
                outcome="duplicate",
                correlation_id=correlation_id,
                metadata={"project_code": request.project_code},
            )
            raise ProjectAlreadyExistsError(f"Project code {request.project_code} already exists.")

        now = datetime.now(tz=UTC)
        project = CarbonProject(
            id=uuid4(),
            project_code=request.project_code,
            title=request.title,
            description=request.description,
            methodology=request.methodology,
            proponent_organization_id=request.proponent_organization_id,
            district=request.district,
            province=request.province,
            status=ProjectStatus.DRAFT,
            estimated_annual_tco2e=request.estimated_annual_tco2e,
            start_date=request.start_date,
            crediting_period_years=request.crediting_period_years,
            created_at=now,
            updated_at=now,
            created_by=actor_id,
            updated_by=actor_id,
        )
        saved = await self._repository.add(project)
        await self._audit_writer.write(
            event_type="carbon.project.registered",
            actor_id=actor_id,
            actor_role=actor_role,
            organization_id=request.proponent_organization_id,
            resource_type="carbon_project",
            resource_id=saved.id,
            action="register_project",
            outcome="success",
            correlation_id=correlation_id,
            metadata={"project_code": request.project_code, "status": saved.status.value},
        )
        return CarbonProjectResponse.model_validate(saved)
