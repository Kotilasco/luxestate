from collections.abc import AsyncGenerator
from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import UUID, uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.dependencies import get_audit_reader, get_audit_writer, get_credit_batch_repository, get_project_repository
from app.application.ports import AuditReader, AuditWriter, CarbonProjectRepository, CreditBatchRepository
from app.domain.entities.carbon_project import CarbonProject, ProjectStatus
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

    async def update_status(self, project_id: UUID, status: ProjectStatus, actor_id: UUID | None) -> CarbonProject | None:
        project = self.projects.get(project_id)
        if project is None:
            return None
        updated = CarbonProject(
            id=project.id,
            project_code=project.project_code,
            title=project.title,
            description=project.description,
            methodology=project.methodology,
            proponent_organization_id=project.proponent_organization_id,
            district=project.district,
            province=project.province,
            status=status,
            estimated_annual_tco2e=project.estimated_annual_tco2e,
            start_date=project.start_date,
            crediting_period_years=project.crediting_period_years,
            created_at=project.created_at,
            updated_at=datetime.now(tz=UTC),
            created_by=project.created_by,
            updated_by=actor_id,
        )
        self.projects[project_id] = updated
        return updated


class InMemoryCreditBatch:
    def __init__(self, *, project_id: UUID, vintage_year: int, quantity_tco2e: Decimal, serial_prefix: str, blockchain_tx_id: str) -> None:
        now = datetime.now(tz=UTC)
        self.id = uuid4()
        self.project_id = project_id
        self.vintage_year = vintage_year
        self.quantity_tco2e = quantity_tco2e
        self.serial_prefix = serial_prefix
        self.status = "issued"
        self.blockchain_tx_id = blockchain_tx_id
        self.issued_at = now
        self.created_at = now
        self.updated_at = now


class InMemoryCreditBatchRepository(CreditBatchRepository):
    def __init__(self) -> None:
        self.batches: list[InMemoryCreditBatch] = []

    async def issue(
        self,
        *,
        project_id: UUID,
        vintage_year: int,
        quantity_tco2e: Decimal,
        serial_prefix: str,
        blockchain_tx_id: str,
        actor_id: UUID | None,
    ) -> InMemoryCreditBatch:
        batch = InMemoryCreditBatch(
            project_id=project_id,
            vintage_year=vintage_year,
            quantity_tco2e=quantity_tco2e,
            serial_prefix=serial_prefix,
            blockchain_tx_id=blockchain_tx_id,
        )
        self.batches.append(batch)
        return batch

    async def list_for_project(self, project_id: UUID) -> list[InMemoryCreditBatch]:
        return [batch for batch in self.batches if batch.project_id == project_id]


class CapturingAuditWriter(AuditWriter, AuditReader):
    def __init__(self) -> None:
        self.events: list[object] = []

    async def write(self, **kwargs: object) -> None:
        event = type(
            "AuditEvent",
            (),
            {
                "id": uuid4(),
                "created_at": datetime.now(tz=UTC),
                "metadata_": kwargs.get("metadata", {}),
                **kwargs,
            },
        )()
        self.events.append(event)
        return None

    async def list_for_resource(self, resource_type: str, resource_id: UUID, limit: int) -> list[object]:
        return [
            event
            for event in self.events
            if getattr(event, "resource_type") == resource_type and getattr(event, "resource_id") == resource_id
        ][:limit]


@pytest.mark.asyncio
async def test_projects_api_register_and_list() -> None:
    app = create_app()
    repository = InMemoryProjectRepository()
    credit_repository = InMemoryCreditBatchRepository()
    audit_writer = CapturingAuditWriter()

    async def repository_override() -> AsyncGenerator[CarbonProjectRepository, None]:
        yield repository

    async def audit_override() -> AsyncGenerator[AuditWriter, None]:
        yield audit_writer

    async def credit_override() -> AsyncGenerator[CreditBatchRepository, None]:
        yield credit_repository

    async def audit_reader_override() -> AsyncGenerator[AuditReader, None]:
        yield audit_writer

    app.dependency_overrides[get_project_repository] = repository_override
    app.dependency_overrides[get_audit_writer] = audit_override
    app.dependency_overrides[get_credit_batch_repository] = credit_override
    app.dependency_overrides[get_audit_reader] = audit_reader_override

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

        for action, expected_status in [
            ("submit_for_verification", "submitted_for_verification"),
            ("start_verification", "under_verification"),
            ("approve", "approved"),
        ]:
            workflow_response = await client.patch(
                f"/api/v1/projects/{project_id}/workflow",
                headers={"X-Actor-Role": "regulator.approver"},
                json={"action": action, "reason": "Integration test workflow action."},
            )
            assert workflow_response.status_code == 200
            assert workflow_response.json()["status"] == expected_status

        credit_response = await client.post(
            f"/api/v1/projects/{project_id}/credits",
            headers={"X-Actor-Role": "regulator.approver"},
            json={"vintage_year": 2026, "quantity_tco2e": "50000.0000"},
        )
        assert credit_response.status_code == 201
        assert credit_response.json()["status"] == "issued"

        audit_response = await client.get(f"/api/v1/projects/{project_id}/audit-events")
        assert audit_response.status_code == 200
        assert len(audit_response.json()) >= 1
