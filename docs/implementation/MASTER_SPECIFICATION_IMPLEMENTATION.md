# Master Specification Implementation Map

This document maps the `MASTER_SPECIFICATION.md` requirements to the implemented ZAI-CTS modules.

## Implemented Enterprise Refactor

- Replaced the old limited navigation model with 18 operational domains:
  - Dashboard
  - Identity & User Management
  - Organizations
  - Carbon Registry
  - Project Lifecycle
  - Validation
  - Monitoring
  - Verification
  - Credit Registry
  - Marketplace
  - Article 6 Operations
  - GIS Intelligence
  - AI Intelligence
  - MRV
  - Compliance
  - Appeals
  - Reporting
  - Administration
- Added backend architecture endpoint:
  - `GET /api/v1/national-operations/architecture`
- Added backend auditable domain-control endpoint:
  - `POST /api/v1/national-operations/domains/{domain}/controls/{control}`
- Added configurable enterprise roles and permissions for all required roles.
- Added the exact 28-step project lifecycle from the master specification.
- Added database migration `database/migrations/0002_enterprise_domains.sql` for IAM, organizations, validation, monitoring, finance, reversals, and enterprise domain controls.

## IAM

Implemented as a domain-backed workflow with RBAC catalog, permissions, users, sessions, MFA, verification, approvals, suspension, invitations, digital signatures, API keys, and session controls represented in API, UI, and schema.

## Organizations

Implemented organization registration, KYB/KYC, document, approval, accreditation, registry account and user-administration workflow controls.

## Validation

Implemented as a separate domain from Verification. Controls include methodology review, additionality, financial feasibility, environmental safeguards, social safeguards, consultation, land ownership, design review, validation report and approval.

## Monitoring

Implemented controls for monitoring schedules, reports, field inspection, IoT data, drone data, satellite monitoring, forest change detection, carbon measurements and monitoring history.

## Verification

Verification remains a case-management module with evidence package upload, hashing, automatic validation, AI, GIS, MRV, verifier review, ZiCMA review, signatures and audit timeline.

## Credit Registry and Marketplace

Credit Registry is now separated in navigation and domain controls from Project Registry. Marketplace controls cover wallet, portfolio, listings, spot, OTC, auctions, settlement, invoices, payments, fees and analytics.

## Article 6

Article 6 Operations include authorization, ITMOs, export/import approval, corresponding adjustment, national accounting and UN reporting controls.

## Compliance, Appeals, Reversals and Finance

Compliance, Appeals, Reversal Management and Finance are implemented as auditable operational domains and database schemas. All controls generate immutable audit records.

## Audit

All domain controls are recorded through the existing audit writer with actor, role, workflow step, timestamp, control metadata and correlation ID.

## Remaining Production Hardening

The platform now has the enterprise workflow structure and working auditable controls. Before official national production use, the implementation still needs real external identity provider integration, payment provider integration, PostGIS/STAC processing jobs, legally approved rule configurations, full table-backed repositories for every domain, formal migrations applied to production environments, penetration testing and disaster recovery exercises.
