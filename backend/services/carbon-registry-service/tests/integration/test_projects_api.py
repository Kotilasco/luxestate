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
        return list(reversed([
            event
            for event in self.events
            if getattr(event, "resource_type") == resource_type and getattr(event, "resource_id") == resource_id
        ]))[:limit]


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

        start_verification_response = await client.post(
            f"/api/v1/projects/{project_id}/verification/start",
            headers={"X-Actor-Role": "project_developer.owner"},
            json={
                "monitoring_period_start": "2026-01-01",
                "monitoring_period_end": "2026-12-31",
                "assigned_verifier": "Zimbabwe Accredited Verifier Pool",
            },
        )
        assert start_verification_response.status_code == 201
        verification_id = start_verification_response.json()["verification_id"]

        evidence_package_response = await client.post(
            f"/api/v1/projects/{project_id}/verification/evidence-package",
            headers={"X-Actor-Role": "project_developer.owner"},
            json={
                "package_notes": "Complete evidence package.",
                "files": [
                    {"file_name": "boundary.geojson", "category": "boundary", "mime_type": "application/geo+json", "file_size_bytes": 1000, "capture_date": "2026-12-31", "digital_signature": "SIG-BOUNDARY"},
                    {"file_name": "monitoring-report.pdf", "category": "monitoring_report", "mime_type": "application/pdf", "file_size_bytes": 1000, "capture_date": "2026-12-31", "digital_signature": "SIG-MR-2026"},
                    {"file_name": "carbon.xlsx", "category": "carbon_calculation", "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "file_size_bytes": 1000, "capture_date": "2026-12-31", "digital_signature": "SIG-CARBON"},
                    {"file_name": "biomass.csv", "category": "biomass_inventory", "mime_type": "text/csv", "file_size_bytes": 1000, "capture_date": "2026-12-31", "digital_signature": "SIG-BIOMASS"},
                    {"file_name": "sentinel.json", "category": "satellite_imagery", "mime_type": "application/json", "file_size_bytes": 1000, "capture_date": "2026-12-31", "digital_signature": "SIG-SAT-2026"},
                    {"file_name": "photos.zip", "category": "field_photo", "mime_type": "application/zip", "file_size_bytes": 1000, "capture_date": "2026-12-31", "digital_signature": "SIG-PHOTO-2026"},
                    {"file_name": "inspection.pdf", "category": "inspection_form", "mime_type": "application/pdf", "file_size_bytes": 1000, "capture_date": "2026-12-31", "digital_signature": "SIG-INSPECT-2026"},
                    {"file_name": "drone.zip", "category": "drone_imagery", "mime_type": "application/zip", "file_size_bytes": 1000, "capture_date": "2026-12-31", "digital_signature": "SIG-DRONE-2026"},
                    {"file_name": "verifier.pdf", "category": "verifier_statement", "mime_type": "application/pdf", "file_size_bytes": 1000, "capture_date": "2026-12-31", "digital_signature": "SIG-VERIFIER"},
                    {"file_name": "accreditation.pdf", "category": "accreditation_certificate", "mime_type": "application/pdf", "file_size_bytes": 1000, "capture_date": "2026-12-31", "digital_signature": "SIG-ACCREDIT"},
                    {"file_name": "signature.txt", "category": "digital_signature", "mime_type": "text/plain", "file_size_bytes": 1000, "capture_date": "2026-12-31", "digital_signature": "SIG-DIGITAL-2026"},
                ],
            },
        )
        assert evidence_package_response.status_code == 200
        assert evidence_package_response.json()["verification_id"] == verification_id
        assert evidence_package_response.json()["evidence_complete"] is True

        automatic_response = await client.post(f"/api/v1/projects/{project_id}/verification/automatic-validation")
        assert automatic_response.status_code == 200
        assert automatic_response.json()["status"] == "pass"

        verification_ai_response = await client.post(f"/api/v1/projects/{project_id}/verification/ai-assessment")
        assert verification_ai_response.status_code == 200
        assert verification_ai_response.json()["stage"] == "ai_review"

        for stage, decision in [("gis", "approve"), ("mrv", "pass"), ("verifier", "approve"), ("zicma", "approve")]:
            decision_response = await client.post(
                f"/api/v1/projects/{project_id}/verification/{stage}-decision",
                headers={"X-Actor-Role": "regulator.approver"},
                json={"decision": decision, "comments": f"{stage} decision accepted.", "digital_signature": f"SIG-{stage.upper()}-2026"},
            )
            assert decision_response.status_code == 200

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

        gis_response = await client.post(
            f"/api/v1/projects/{project_id}/gis-assessment",
            headers={"X-Actor-Role": "gis.analyst"},
        )
        assert gis_response.status_code == 200
        assert gis_response.json()["boundary_validation_status"] == "requires_boundary_submission"
        assert len(gis_response.json()["layers"]) == 4
        assert len(gis_response.json()["evidence_sources"]) >= 4

        evidence_response = await client.post(
            f"/api/v1/projects/{project_id}/gis-evidence",
            headers={"X-Actor-Role": "gis.verifier"},
            json={
                "boundary_geojson": '{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[28.7,-16.4],[28.9,-16.4],[28.9,-16.6],[28.7,-16.6],[28.7,-16.4]]]}}',
                "satellite_scene_id": "S2A_MSIL2A_20260615T073621_KARIBA",
                "land_cover_source": "ESA WorldCover 10m 2021 baseline",
                "fire_alert_source": "NASA FIRMS VIIRS 375m last 30 days",
                "field_mrv_reference": "MRV-FIELD-KARIBA-2026-001",
                "verifier_notes": "Boundary, satellite and field MRV evidence submitted for regulator validation.",
            },
        )
        assert evidence_response.status_code == 201
        assert evidence_response.json()["status"] == "submitted"

        gis_validation_response = await client.post(
            f"/api/v1/projects/{project_id}/gis-validation",
            headers={"X-Actor-Role": "regulator.gis_approver"},
            json={"decision": "valid", "notes": "Submitted boundary and MRV evidence accepted."},
        )
        assert gis_validation_response.status_code == 200
        assert gis_validation_response.json()["status"] == "valid"

        ai_response = await client.post(
            f"/api/v1/projects/{project_id}/ai-review",
            headers={"X-Actor-Role": "ai.reviewer"},
        )
        assert ai_response.status_code == 200
        assert ai_response.json()["review_type"] == "pdd_compliance_and_risk_review"
        assert Decimal(ai_response.json()["confidence_score"]) > Decimal("0.80")

        ai_validation_response = await client.post(
            f"/api/v1/projects/{project_id}/ai-validation",
            headers={"X-Actor-Role": "regulator.ai_approver"},
            json={"decision": "valid", "notes": "AI review accepted with human verification controls."},
        )
        assert ai_validation_response.status_code == 200
        assert ai_validation_response.json()["status"] == "valid"

        evidence_list_response = await client.get(f"/api/v1/projects/{project_id}/evidence")
        assert evidence_list_response.status_code == 200
        assert len(evidence_list_response.json()) >= 3
