from __future__ import annotations

from html import escape
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


OUTPUT = Path("docs/operations/ZAI-CTS-System-Operation-Guide.docx")


SECTIONS: list[tuple[str, list[str]]] = [
    (
        "Zimbabwe AI-Enhanced Carbon Trading Ecosystem",
        [
            "This document explains how ZAI-CTS works as a production-grade national platform for Zimbabwe's carbon market under SI 48 of 2025 and Paris Agreement Article 6.",
            "The platform is designed as critical digital infrastructure, combining carbon registry workflows, MRV, GIS intelligence, AI-assisted decision support, blockchain audit anchoring, marketplace operations, payments, community revenue transparency, and regulatory reporting.",
        ],
    ),
    (
        "High-Level Operating Model",
        [
            "Project developers register carbon projects and submit project design information, GIS boundaries, methodology details, and supporting evidence.",
            "The Carbon Registry Service stores the authoritative project record in PostgreSQL/PostGIS, applies domain validation, and writes immutable audit events for sensitive actions.",
            "MRV workflows collect measurement, reporting, and verification data from field inspections, satellite imagery, IoT sources, drone uploads, and documentary evidence.",
            "Verifiers and regulators review evidence through secured portals. AI assists with summaries, anomaly detection, additionality assessment, leakage risk, legal interpretation, and satellite intelligence, but final approval remains human-controlled.",
            "Approved credit issuance, transfer, retirement, and corresponding adjustment events are anchored to Hyperledger Fabric. The blockchain stores lifecycle proofs and hashes; PostgreSQL remains the system of record.",
            "Market participants use the marketplace for spot trading, OTC, auctions, portfolios, certificates, escrow, settlement, and retirement.",
            "Communities, RDCs, and government users access transparency dashboards for revenue sharing, trust funds, schools, clinics, water projects, and project benefits.",
        ],
    ),
    (
        "Runtime Components",
        [
            "Web Portal: Next.js, React, TypeScript, TailwindCSS, and Material UI portal for regulators, developers, verifiers, traders, and transparency users.",
            "API Gateway: Node.js edge service that applies request correlation, security headers, rate limiting, and routes API requests to backend services.",
            "Carbon Registry Service: FastAPI service using Clean Architecture, domain entities, command/query application services, repository interfaces, SQLAlchemy infrastructure adapters, OpenAPI, health, metrics, and tests.",
            "PostgreSQL/PostGIS: relational and geospatial system of record for organizations, carbon projects, credit batches, boundaries, and audit events.",
            "Redis: cache, rate-limit backing store, and short-lived workflow state store.",
            "RabbitMQ: event bus for domain events, async workflows, notifications, outbox dispatch, and integration tasks.",
            "Hyperledger Fabric: permissioned ledger for immutable carbon-credit lifecycle anchoring.",
            "AI Services: LangChain and model integrations with confidence score, explainability, prompt version, model version, human override, drift monitoring, bias monitoring, and audit trail.",
            "GIS Services: PostGIS, Mapbox/OpenLayers, GeoJSON APIs, satellite overlays, Zimbabwe district layers, forest cover, fire alerts, rainfall, communities, and IoT sensors.",
        ],
    ),
    (
        "Security Model",
        [
            "ZAI-CTS follows Zero Trust principles. All access must be authenticated, authorized, logged, and observable.",
            "Authentication is based on OAuth2/OpenID Connect and JWTs. MFA is mandatory for regulators, administrators, auditors, verifiers, and approvers.",
            "Authorization combines RBAC and ABAC. RBAC controls broad role capabilities; ABAC controls resource-specific decisions such as organization, project ownership, district, approval status, risk level, and assurance level.",
            "All sensitive operations create audit events with actor, role, organization, resource, action, outcome, correlation ID, and metadata.",
            "Production deployments must use TLS externally, mTLS internally, encrypted storage, secrets management, SIEM integration, WAF controls, and API rate limiting.",
        ],
    ),
    (
        "API Flow",
        [
            "Clients call the API Gateway over HTTPS.",
            "The gateway attaches or preserves X-Correlation-Id, applies security middleware and rate limits, then forwards requests to the appropriate backend service.",
            "Backend services validate DTOs, execute application-layer commands or queries, enforce domain invariants, persist via repository interfaces, write audit events, and return OpenAPI-documented responses.",
            "For carbon project registration, the RegisterCarbonProjectCommand rejects duplicate project codes, creates a draft CarbonProject aggregate, persists it, and writes a carbon.project.registered audit event.",
        ],
    ),
    (
        "Docker Startup",
        [
            "Run the enterprise stack with: docker compose -f infrastructure/docker/docker-compose.yml up --build -d",
            "Recommended local endpoints after startup: Web Portal http://localhost:3000, API Gateway http://localhost:8082/health, Carbon Registry http://localhost:8101/health, RabbitMQ Management http://localhost:15673.",
            "The local compose file uses non-conflicting host ports to avoid interfering with existing containers on the workstation.",
        ],
    ),
    (
        "Quality Gates",
        [
            "Backend validation performed in this repository includes Python compile checks, FastAPI unit tests, FastAPI integration tests, and Docker Compose configuration validation.",
            "Node.js dependency installation may require working npm registry access and trusted enterprise CA configuration. CI is configured to build the API Gateway and Web Portal where registry access is available.",
            "Production readiness requires tests passing, linting, security scanning, OpenAPI documentation, monitoring, Kubernetes deployment manifests, and completed operational runbooks.",
        ],
    ),
]


def paragraph_xml(text: str, style: str | None = None) -> str:
    style_xml = f'<w:pPr><w:pStyle w:val="{style}"/></w:pPr>' if style else ""
    return f"<w:p>{style_xml}<w:r><w:t>{escape(text)}</w:t></w:r></w:p>"


def build_document_xml() -> str:
    body: list[str] = []
    for index, (heading, paragraphs) in enumerate(SECTIONS):
        body.append(paragraph_xml(heading, "Title" if index == 0 else "Heading1"))
        for paragraph in paragraphs:
            body.append(paragraph_xml(paragraph))
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        f"<w:body>{''.join(body)}"
        '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>'
        "</w:body></w:document>"
    )


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(OUTPUT, "w", ZIP_DEFLATED) as docx:
        docx.writestr(
            "[Content_Types].xml",
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            '<Default Extension="xml" ContentType="application/xml"/>'
            '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
            '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
            "</Types>",
        )
        docx.writestr(
            "_rels/.rels",
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
            "</Relationships>",
        )
        docx.writestr(
            "word/styles.xml",
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            '<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style>'
            '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style>'
            "</w:styles>",
        )
        docx.writestr("word/document.xml", build_document_xml())
    print(OUTPUT)


if __name__ == "__main__":
    main()
