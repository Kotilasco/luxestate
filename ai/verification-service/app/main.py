from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel, Field


REQUIRED_CATEGORIES = {
    "boundary",
    "monitoring_report",
    "carbon_calculation",
    "biomass_inventory",
    "satellite_imagery",
    "field_photo",
    "inspection_form",
    "drone_imagery",
    "verifier_statement",
    "accreditation_certificate",
    "digital_signature",
}


class VerificationAnalysisRequest(BaseModel):
    project: dict[str, Any]
    verification_case: dict[str, Any]
    evidence_files: list[dict[str, Any]] = Field(default_factory=list)
    gis_profile: dict[str, Any] = Field(default_factory=dict)


class VerificationAnalysisResponse(BaseModel):
    model_version: str
    status: str
    confidence_score: Decimal
    risk_score: Decimal
    findings: list[str]
    required_actions: list[str]
    document_checks: list[dict[str, Any]]
    generated_at: datetime


app = FastAPI(
    title="ZAI-CTS Local AI Verification Model",
    version="1.0.0",
    description="Local deterministic verification intelligence service for evidence ownership, category, GIS and integrity scoring.",
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "healthy", "service": "ai-verification-service"}


@app.post("/v1/verification/analyze", response_model=VerificationAnalysisResponse)
async def analyze_verification(request: VerificationAnalysisRequest) -> VerificationAnalysisResponse:
    project_code = str(request.project.get("project_code", "")).upper()
    files = request.evidence_files
    categories = {str(file.get("category", "")) for file in files}
    missing_categories = sorted(REQUIRED_CATEGORIES - categories)
    document_checks: list[dict[str, Any]] = []
    risk_points = 8

    if missing_categories:
        risk_points += len(missing_categories) * 5

    manifest_matches = 0
    format_warnings = 0
    unsigned = 0
    zip_packages = 0

    for file in files:
        metadata = file.get("zip_metadata") if isinstance(file.get("zip_metadata"), dict) else {}
        manifest = metadata.get("manifest") if isinstance(metadata.get("manifest"), dict) else {}
        manifest_code = str(manifest.get("project_code", "")).upper()
        content_match = bool(file.get("project_code_detected")) or manifest_code == project_code
        format_status = str(file.get("format_status", "requires_review"))
        signature_present = len(str(file.get("digital_signature", ""))) >= 8
        is_zip = str(file.get("extension", "")).lower() == ".zip"
        zip_packages += 1 if is_zip else 0
        manifest_matches += 1 if manifest_code == project_code else 0
        format_warnings += 1 if format_status != "valid" else 0
        unsigned += 0 if signature_present else 1

        if not content_match:
            risk_points += 2 if not missing_categories else 8
        if format_status != "valid":
            risk_points += 2
        if not signature_present:
            risk_points += 6

        document_checks.append(
            {
                "file_name": file.get("file_name"),
                "category": file.get("category"),
                "ownership_status": "matched" if content_match else "requires_human_review",
                "manifest_project_code": manifest_code or None,
                "format_status": format_status,
                "sha256": file.get("sha256"),
                "signature_status": "present" if signature_present else "missing",
            }
        )

    fire_risk = str(request.gis_profile.get("fire_risk", request.gis_profile.get("fire_risk_level", "medium"))).lower()
    if fire_risk == "high":
        risk_points += 12
    elif fire_risk == "medium":
        risk_points += 6

    risk_score = min(Decimal(risk_points), Decimal("99.00"))
    confidence = max(Decimal("100.00") - risk_score, Decimal("1.00"))
    status = "pass" if risk_score < Decimal("30") and not missing_categories else "warning"
    if len(missing_categories) > 4:
        status = "fail"
    elif missing_categories or unsigned:
        status = "warning"

    findings = [
        f"AI model verified {len(files)} evidence file record(s) against project {project_code}.",
        f"Category coverage: {len(categories)}/{len(REQUIRED_CATEGORIES)} required categories.",
        f"Manifest matches detected: {manifest_matches}; consolidated ZIP packages detected: {zip_packages}.",
        f"Format warnings: {format_warnings}; unsigned records: {unsigned}; GIS fire risk: {fire_risk}.",
    ]
    required_actions = []
    if missing_categories:
        required_actions.append(f"Submit missing evidence categories: {', '.join(missing_categories)}.")
    if format_warnings:
        required_actions.append("Human verifier must confirm files with format warnings.")
    if any(check["ownership_status"] != "matched" for check in document_checks):
        required_actions.append("Human verifier must confirm document ownership for unmatched files.")
    if not required_actions:
        required_actions.append("Human verifier must review AI explainability before approval.")

    return VerificationAnalysisResponse(
        model_version="zai-local-verification-model-1.0",
        status=status,
        confidence_score=confidence.quantize(Decimal("0.01")),
        risk_score=risk_score.quantize(Decimal("0.01")),
        findings=findings,
        required_actions=required_actions,
        document_checks=document_checks,
        generated_at=datetime.now(tz=UTC),
    )
