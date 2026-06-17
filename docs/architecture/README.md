# ZAI-CTS Enterprise Architecture

Zimbabwe AI-Enhanced Carbon Trading Ecosystem (ZAI-CTS) is a national critical-infrastructure platform for carbon project registration, MRV, credit issuance, marketplace operations, community benefit transparency, GIS intelligence, AI-assisted verification, and immutable blockchain audit anchoring.

This repository follows the `MASTER_SPECIFICATION.md` as its constitutional specification.

## C4 Context

```mermaid
C4Context
title ZAI-CTS System Context
Person(projectDeveloper, "Project Developer", "Registers carbon projects and submits MRV evidence")
Person(verifier, "Accredited Verifier", "Reviews MRV data, GIS evidence, and compliance")
Person(regulator, "Regulator", "Approves projects, issuance, transfers, and retirements")
Person(trader, "Market Participant", "Buys, sells, retires, and manages carbon credits")
Person(community, "Community/RDC", "Views revenue sharing and project benefits")
System(zai, "ZAI-CTS", "National AI-enhanced carbon trading ecosystem")
System_Ext(identityProvider, "National/OIDC Identity Provider", "OAuth2/OIDC identity, MFA")
System_Ext(paymentProvider, "Banks/Payment Providers", "Settlement and escrow rails")
System_Ext(satelliteProvider, "Satellite/GIS Providers", "Imagery, forest cover, rainfall, fire alerts")
System_Ext(fabric, "Hyperledger Fabric Network", "Immutable credit lifecycle and audit history")
Rel(projectDeveloper, zai, "Registers projects, submits evidence")
Rel(verifier, zai, "Validates MRV and GIS evidence")
Rel(regulator, zai, "Approves, issues, supervises")
Rel(trader, zai, "Trades and retires credits")
Rel(community, zai, "Reviews transparency dashboards")
Rel(zai, identityProvider, "Authenticates via OIDC")
Rel(zai, paymentProvider, "Settles payments")
Rel(zai, satelliteProvider, "Consumes geospatial data")
Rel(zai, fabric, "Submits ledger transactions")
```

## C4 Containers

```mermaid
C4Container
title ZAI-CTS Container Architecture
Person(user, "Authenticated User")
System_Boundary(zai, "ZAI-CTS") {
  Container(web, "Web Portal", "Next.js, TypeScript, Tailwind, MUI", "Regulator, developer, trader, and community portal")
  Container(mobile, "Field Mobile App", "Flutter", "Offline field inspections and geotagged evidence capture")
  Container(gateway, "API Gateway", "Node.js", "JWT validation, rate limiting, routing, policy enforcement")
  Container(registry, "Carbon Registry Service", "FastAPI", "Projects, credit batches, lifecycle records")
  Container(mrv, "MRV Service", "FastAPI", "Submissions, inspections, IoT/drone evidence")
  Container(gis, "GIS Service", "FastAPI, PostGIS", "Spatial validation and map layers")
  Container(ai, "AI Advisory Service", "FastAPI, LangChain", "Explainable AI assistance and anomaly detection")
  Container(blockchain, "Blockchain Adapter", "FastAPI/Fabric SDK", "Fabric transaction orchestration")
  ContainerDb(db, "PostgreSQL/PostGIS", "Relational and geospatial system of record")
  ContainerDb(redis, "Redis", "Caching, rate limits, short-lived workflow state")
  ContainerQueue(rabbit, "RabbitMQ", "Domain events, outbox dispatch, async workflows")
}
Rel(user, web, "Uses HTTPS")
Rel(web, gateway, "REST/JSON")
Rel(mobile, gateway, "REST/JSON")
Rel(gateway, registry, "REST/JSON")
Rel(gateway, mrv, "REST/JSON")
Rel(gateway, gis, "REST/JSON")
Rel(gateway, ai, "REST/JSON")
Rel(registry, db, "SQL")
Rel(registry, rabbit, "Publishes domain events")
Rel(gis, db, "PostGIS")
Rel(ai, db, "Reads approved evidence and policies")
Rel(blockchain, rabbit, "Consumes approved lifecycle events")
```

## Production Readiness Benchmarks

| Benchmark | ZAI-CTS Control |
| --- | --- |
| Microsoft Azure | Zero Trust, Kubernetes, managed identity patterns, telemetry-first design |
| SAP | Master-data discipline, approval workflows, auditability, financial-grade settlement records |
| Salesforce | Role-aware portals, case/workflow lifecycle, API-first extension model |
| Palantir | Data fusion across MRV, GIS, blockchain, AI, and regulatory sources |
| ArcGIS | PostGIS, map layers, satellite overlays, field evidence geotagging |
| Bloomberg | Market-grade pricing, trading records, portfolio views, immutable historical data |

