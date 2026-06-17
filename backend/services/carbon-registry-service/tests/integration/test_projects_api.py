from collections.abc import AsyncGenerator
from datetime import date
from uuid import UUID, uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.dependencies import get_audit_writer, get_project_repository
from app.application.ports import AuditWriter, CarbonProjectRepository
from app.domain.entities.carbon_project import CarbonProject
from app.main import create_app


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
    async def write(self, **kwargs: object) -> None:
        return None


@pytest.mark.asyncio
async def test_projects_api_register_and_list() -> None:
    app = create_app()
    repository = InMemoryProjectRepository()
    audit_writer = CapturingAuditWriter()

    async def repository_override() -> AsyncGenerator[CarbonProjectRepository, None]:
        yield repository

    async def audit_override() -> AsyncGenerator[AuditWriter, None]:
        yield audit_writer

    app.dependency_overrides[get_project_repository] = repository_override
    app.dependency_overrides[get_audit_writer] = audit_override

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/projects",
            headers={"X-Actor-Role": "project_developer.owner"},
            json={
                "project_code": "ZAI-20250002",
                "title": "Hwange Community Carbon Programme",
                "description": "Community-led climate mitigation project with verifiable carbon sequestration.",
                "methodology": "VM0047 Afforestation Reforestation Revegetation",
                "proponent_organization_id": str(uuid4()),
                "district": "Hwange",
                "province": "Matabeleland North",
                "estimated_annual_tco2e": "50000.0000",
                "start_date": date(2026, 1, 1).isoformat(),
                "crediting_period_years": 25,
            },
        )
        assert response.status_code == 201
        project_id = response.json()["id"]

        list_response = await client.get("/api/v1/projects")
        assert list_response.status_code == 200
        assert list_response.json()[0]["id"] == project_id

        get_response = await client.get(f"/api/v1/projects/{project_id}")
        assert get_response.status_code == 200
        assert get_response.json()["project_code"] == "ZAI-20250002"
