# Domain Driven Design and Bounded Contexts

## Bounded Contexts

| Context | Responsibility | Data Ownership |
| --- | --- | --- |
| Identity & Access | OAuth2/OIDC identities, organizations, RBAC, ABAC, MFA | Users, organizations, roles, policies |
| Carbon Registry | Carbon projects, methodologies, credit batches, lifecycle status | Projects, boundaries, credit batches |
| Project Lifecycle | Application review, regulator approvals, lifecycle state transitions | Project cases, approvals, decision records |
| MRV | Measurement, reporting, verification evidence and field inspections | MRV submissions, evidence, inspections |
| GIS | Zimbabwe map layers, spatial validation, satellite observations | Boundaries, layers, spatial observations |
| Marketplace | Spot/OTC/auction listings, orders, portfolios, certificates | Listings, orders, portfolios, retirement certificates |
| Payments & Settlement | Escrow, invoices, settlement confirmations | Invoices, settlement events, payment references |
| Blockchain Ledger | Hyperledger Fabric transaction anchoring and synchronization | Ledger references, transaction hashes |
| AI Services | Explainable AI copilots, anomaly detection, forecasting | AI requests, prompt versions, model outputs |
| Community Revenue | Revenue sharing, trust funds, RDC transparency | Revenue allocations, community projects |
| Regulatory Portal | Compliance actions, reporting, national supervision | Regulatory decisions and reports |
| Audit | Immutable audit trail and SIEM integration | Audit events and access logs |

## Aggregate Roots

| Aggregate | Context | Invariants |
| --- | --- | --- |
| CarbonProject | Carbon Registry | Project status transitions are explicit, audited, and actor-bound |
| ProjectBoundary | GIS | Boundary must be valid geometry within Zimbabwe and must not overlap forbidden zones |
| MRVSubmission | MRV | Evidence cannot be approved without verifier assignment and audit record |
| CarbonCreditBatch | Carbon Registry | Issuance requires approved MRV and regulator authorization |
| MarketplaceOrder | Marketplace | Settlement and transfer must be atomic and auditable |
| CommunityRevenueAllocation | Community Revenue | Allocation must reference a retired/settled credit transaction |
| AIAdvisoryRecord | AI Services | Output must include model version, confidence, explanation, and human override state |

## Event Vocabulary

- `carbon.project.registered`
- `carbon.project.submitted_for_verification`
- `mrv.submission.created`
- `mrv.submission.approved`
- `carbon.credits.issued`
- `carbon.credits.transferred`
- `carbon.credits.retired`
- `gis.boundary.validated`
- `ai.advisory.completed`
- `audit.security_event.recorded`

