from datetime import date
from uuid import UUID, uuid4

import pytest

from app.application.commands.register_project import (
    ProjectAlreadyExistsError,
    RegisterCarbonProjectCommand,
)
from app.application.dto import RegisterCarbonProjectRequest
from app.application.ports import AuditWriter, CarbonProjectRepository
from app.domain.entities.carbon_project import CarbonProject


class InMemoryProjectRepository(CarbonProjectRepository):
    def __init__(self) -> None:
        self.projects: dict[UUID, CarbonProject] = {}

    async def add(self, project: CarbonProject) -> CarbonProject:
        self.projects[project.id] = project
        return project

    async def get_by_id(self, project_id: UUID) -> CarbonProject | None:
        return self.projects.get(project_id)

    async def get_by_code(self, project_code: str) -> CarbonProject | None:
        return next((project for project in self.projects.values() if project.project_code == project_code), None)

    async def list(self, limit: int, offset: int) -> list[CarbonProject]:
        return list(self.projects.values())[offset : offset + limit]


class CapturingAuditWriter(AuditWriter):
    def __init__(self) -> None:
        self.events: list[dict[str, object]] = []

    async def write(self, **kwargs: object) -> None:
        self.events.append(kwargs)


def valid_request() -> RegisterCarbonProjectRequest:
    return RegisterCarbonProjectRequest(
        project_code="ZAI-20250001",
        title="Kariba Forest Restoration Programme",
        description="A verified afforestation and forest conservation programme for carbon sequestration.",
        methodology="VM0047 Afforestation Reforestation Revegetation",
        proponent_organization_id=uuid4(),
        district="Kariba",
        province="Mashonaland West",
        estimated_annual_tco2e="125000.0000",
        start_date=date(2026, 1, 1),
        crediting_period_years=30,
    )


@pytest.mark.asyncio
async def test_register_project_creates_draft_project_and_audit_event() -> None:
    repository = InMemoryProjectRepository()
    audit = CapturingAuditWriter()
    command = RegisterCarbonProjectCommand(repository, audit)

    response = await command.execute(
        valid_request(),
        actor_id=uuid4(),
        actor_role="project_developer.owner",
        correlation_id=uuid4(),
    )

    assert response.project_code == "ZAI-20250001"
    assert response.status == "draft"
    assert len(repository.projects) == 1
    assert audit.events[0]["event_type"] == "carbon.project.registered"
    assert audit.events[0]["outcome"] == "success"


@pytest.mark.asyncio
async def test_register_project_rejects_duplicate_project_code() -> None:
    repository = InMemoryProjectRepository()
    audit = CapturingAuditWriter()
    command = RegisterCarbonProjectCommand(repository, audit)

    request = valid_request()
    await command.execute(request, actor_id=None, actor_role=None, correlation_id=uuid4())

    with pytest.raises(ProjectAlreadyExistsError):
        await command.execute(request, actor_id=None, actor_role=None, correlation_id=uuid4())

    assert audit.events[-1]["event_type"] == "carbon.project.registration_rejected"
    assert audit.events[-1]["outcome"] == "duplicate"
