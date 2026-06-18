from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from uuid import UUID, uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.dependencies import get_audit_reader, get_audit_writer
from app.application.ports import AuditReader, AuditWriter
from app.main import create_app


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

    async def list_for_resource(self, resource_type: str, resource_id: UUID, limit: int) -> list[object]:
        return list(
            reversed(
                [
                    event
                    for event in self.events
                    if getattr(event, "resource_type") == resource_type and getattr(event, "resource_id") == resource_id
                ]
            )
        )[:limit]


@pytest.mark.asyncio
async def test_national_operations_record_auditable_controls() -> None:
    app = create_app()
    audit_store = CapturingAuditWriter()

    async def audit_writer_override() -> AsyncGenerator[AuditWriter, None]:
        yield audit_store

    async def audit_reader_override() -> AsyncGenerator[AuditReader, None]:
        yield audit_store

    app.dependency_overrides[get_audit_writer] = audit_writer_override
    app.dependency_overrides[get_audit_reader] = audit_reader_override

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        readiness_response = await client.get("/api/v1/national-readiness")
        assert readiness_response.status_code == 200
        assert len(readiness_response.json()["stages"]) == 8

        account_response = await client.post(
            "/api/v1/national-operations/accounts/open",
            headers={"X-Actor-Role": "regulator.approver"},
            json={
                "organization_name": "Kariba Forest Carbon Programme Ltd",
                "account_type": "project_developer",
                "kyb_reference": "ZIM-KYB-2026-0001",
                "beneficial_owner_checked": True,
            },
        )
        assert account_response.status_code == 201
        assert account_response.json()["status"] == "account_opened"

        methodology_response = await client.post(
            "/api/v1/national-operations/methodologies/approve",
            headers={"X-Actor-Role": "regulator.approver"},
            json={
                "code": "ZAI-ARR-001",
                "name": "Zimbabwe ARR Methodology",
                "standard": "National Carbon Standard",
                "version": "1.0",
                "eligibility_rules": ["Land tenure evidence required"],
            },
        )
        assert methodology_response.status_code == 201

        for path, payload in [
            (
                "/api/v1/national-operations/rules/adopt",
                {
                    "rule_code": "ZAI-RULE-001",
                    "title": "National Carbon Registry Operating Rules",
                    "effective_date": "2026-07-01",
                    "authority_reference": "ZiCMA-REGISTRY-AUTHORITY-2026",
                },
            ),
            (
                "/api/v1/national-operations/public-disclosures/publish",
                {
                    "disclosure_type": "project",
                    "title": "ZAI-20250002 public registry disclosure",
                    "publication_reference": "PUBLIC-ZAI-20250002-2026",
                },
            ),
            (
                "/api/v1/national-operations/gis/jobs",
                {
                    "project_code": "ZAI-20250002",
                    "job_type": "stac_raster_processing",
                    "source_dataset": "Sentinel-2 L2A",
                    "processing_hash": "GIS-HASH-2026-001",
                },
            ),
            (
                "/api/v1/national-operations/verification/buffer-allocations",
                {
                    "project_code": "ZAI-20250002",
                    "issued_tco2e": 50000,
                    "buffer_percent": 12.5,
                    "reversal_risk_class": "medium",
                },
            ),
            (
                "/api/v1/national-operations/ledger/transfers",
                {
                    "serial_prefix": "ZW-ZAI-20250002-2026",
                    "from_account": "ACC-DEVELOPER",
                    "to_account": "ACC-BUYER",
                    "quantity_tco2e": 10000,
                    "settlement_reference": "SETTLEMENT-001",
                },
            ),
            (
                "/api/v1/national-operations/ledger/freezes",
                {
                    "serial_prefix": "ZW-ZAI-20250002-2026",
                    "reason": "Regulatory surveillance hold.",
                    "freeze_scope": "batch",
                },
            ),
            (
                "/api/v1/national-operations/marketplace/settlements",
                {
                    "listing_reference": "LISTING-001",
                    "buyer_account": "ACC-BUYER",
                    "seller_account": "ACC-DEVELOPER",
                    "quantity_tco2e": 10000,
                    "settlement_status": "escrow_locked",
                },
            ),
        ]:
            response = await client.post(path, headers={"X-Actor-Role": "regulator.approver"}, json=payload)
            assert response.status_code == 201

        retirement_response = await client.post(
            "/api/v1/national-operations/ledger/retirements",
            headers={"X-Actor-Role": "regulator.approver"},
            json={
                "serial_prefix": "ZW-ZAI-20250002-2026",
                "account_id": "ACC-BUYER",
                "beneficiary": "Zimbabwe Net Zero Claim Demonstration",
                "purpose": "Voluntary climate claim retirement",
                "quantity_tco2e": 2500,
            },
        )
        assert retirement_response.status_code == 201

        operations_response = await client.get("/api/v1/national-operations")
        assert operations_response.status_code == 200
        body = operations_response.json()
        assert len(body["registry_accounts"]) == 1
        assert len(body["methodologies"]) == 1
        assert len(body["ledger_transfers"]) == 1
        assert len(body["ledger_retirements"]) == 1
        assert len(body["ledger_freezes"]) == 1
        assert len(body["public_disclosures"]) == 1
        assert body["stage_completion"][1]["completed_controls"] == 1
        assert len(body["audit_timeline"]) == 10

        certificate_id = body["ledger_retirements"][0]["metadata"]["certificate_id"]
        certificate_response = await client.get(f"/api/v1/national-operations/public/retirement-certificates/{certificate_id}")
        assert certificate_response.status_code == 200
        assert certificate_response.json()["status"] == "retired"
        assert certificate_response.json()["quantity_tco2e"] == 2500
