# MASTER_SPECIFICATION.md

# Zimbabwe AI-Enhanced Carbon Trading Ecosystem (ZAI-CTS)
## Master Production Specification v1.0

> This document is the constitutional specification for the repository. Every generated file, service, database object, API, UI component, AI workflow, blockchain contract, infrastructure resource, and test MUST conform to this specification.

---

# 1. Vision

Build a production-grade national digital platform implementing Zimbabwe's carbon market under SI 48 of 2025 and the Paris Agreement Article 6.

The platform is NOT a prototype.
The platform is NOT a demonstration.
The platform SHALL be implemented as enterprise software suitable for national critical infrastructure.

---

# 2. Core Principles

- Clean Architecture
- Domain Driven Design
- SOLID
- Twelve-Factor App
- Zero Trust Security
- API First
- AI Native
- Cloud Ready
- On-Prem Ready
- Event Driven
- Immutable Audit
- Explainable AI
- GIS First
- Mobile First for field operations

---

# 3. Technology Stack

Backend
- Python FastAPI
- Node.js API Gateway
- PostgreSQL
- Redis
- RabbitMQ

Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Material UI

Mobile
- Flutter

Blockchain
- Hyperledger Fabric (preferred)
- Hedera (optional)

AI
- OpenAI GPT-5.5
- LangChain
- Gemini
- OCR
- Computer Vision
- ML Forecasting

Infrastructure
- Docker
- Kubernetes
- GitHub Actions
- Terraform
- Prometheus
- Grafana

---

# 4. Major Domains

1. Identity & Access
2. Carbon Registry
3. Project Lifecycle
4. Marketplace
5. Payments & Settlement
6. MRV
7. GIS
8. AI Services
9. Community Revenue
10. Regulatory Portal
11. Reporting & BI
12. Administration

---

# 5. Architecture Rules

Every module MUST contain:

- Folder structure
- README
- OpenAPI documentation
- Unit tests
- Integration tests
- Validation
- Logging
- Metrics
- Health endpoints
- Dockerfile

Never generate placeholders, TODOs, fake APIs or mock production logic.

---

# 6. Coding Standards

- Python typing mandatory
- Async FastAPI
- Dependency Injection
- Repository Pattern
- CQRS where beneficial
- Service Layer
- DTO separation
- Structured logging
- Global exception handling

---

# 7. Database Standards

Use PostgreSQL.

Every table requires:

- UUID PK
- created_at
- updated_at
- created_by
- updated_by
- audit trail
- soft delete where appropriate

Use migrations only.

No destructive schema changes.

---

# 8. Security

- OAuth2
- OpenID Connect
- JWT
- RBAC
- ABAC
- MFA
- TLS
- AES256
- Immutable audit logs
- Secrets manager
- API rate limiting
- SIEM integration

---

# 9. AI Governance

Every AI service shall provide:

- Confidence score
- Explainability
- Prompt version
- Model version
- Human override
- Audit trail
- Bias monitoring
- Drift monitoring

AI Modules:
- PDD Copilot
- Legal Copilot
- Additionality Engine
- Leakage Detection
- Fraud Detection
- Price Forecasting
- Satellite Intelligence
- Executive Assistant

---

# 10. Blockchain

Implement smart contracts for:

- Project registration
- Credit issuance
- Serialization
- Authorization
- Transfer
- Retirement
- Corresponding adjustment
- Audit history

Blockchain SHALL never replace relational databases.

---

# 11. GIS

Interactive Zimbabwe map.

Layers:

- Districts
- Projects
- Forest cover
- Fire alerts
- Carbon density
- Satellite imagery
- Communities
- IoT sensors
- Rainfall

---

# 12. Marketplace

Support:

- Spot trading
- OTC
- Auctions
- Wallets
- Escrow
- Settlement
- Portfolio
- Certificates
- Retirement

---

# 13. MRV

Support:

- IoT ingestion
- Drone uploads
- Satellite imagery
- Field inspections
- Offline mobile
- Photo verification
- Geotagging

---

# 14. Community

Support:

- Revenue sharing
- Trust funds
- RDC dashboards
- School projects
- Clinics
- Water projects
- Transparency portal

---

# 15. UI Standards

Target quality comparable to:

- Azure Portal
- SAP Fiori
- ArcGIS
- Palantir Foundry

Requirements:

- Dark mode
- Light mode
- Responsive
- Accessibility
- Live dashboards
- Interactive maps

---

# 16. DevSecOps

Mandatory:

- Docker
- Kubernetes
- GitHub Actions
- Terraform
- Helm
- Prometheus
- Grafana
- Disaster recovery
- Backup strategy

---

# 17. Quality Gates

Code is complete only if:

- Builds successfully
- Tests pass
- Lint passes
- Security scan passes
- Documentation complete
- APIs documented
- Monitoring enabled

---

# 18. AI Agent Rules

When generating code:

1. Produce production-ready code.
2. Never simplify architecture.
3. Never omit tests.
4. Always explain design decisions.
5. Always update documentation.
6. Maintain backward compatibility.
7. Follow this specification before any prompt.
8. If a request conflicts with this specification, explain the conflict and propose a compliant alternative.

---

# 19. Implementation Phases

Phase 1: Architecture
Phase 2: Database
Phase 3: Backend
Phase 4: Blockchain
Phase 5: AI
Phase 6: Frontend
Phase 7: GIS
Phase 8: Marketplace
Phase 9: MRV
Phase 10: Community
Phase 11: Security
Phase 12: DevSecOps
Phase 13: Enterprise Review

---

# 20. Definition of Done

The platform is complete only when it is:

- Production deployable
- Secure
- Auditable
- Scalable
- Explainable
- Maintainable
- Fully documented
- Fully tested
- Compliant with Zimbabwean regulations
- Ready for enterprise operation
