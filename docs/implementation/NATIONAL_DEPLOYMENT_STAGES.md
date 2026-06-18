# ZAI-CTS National Deployment Stages

This document converts the national-registry gap review into implementation stages for an official Zimbabwe carbon registry and trading platform.

## Stage 1: Legal Authority and Registry Governance

Objective: establish ZAI-CTS as a legally governed system of record.

Required build:
- Registry operating rules engine.
- Regulator delegation matrix.
- Case management for enforcement, appeals, disputes and sanctions.
- Public disclosure approval workflow.
- Immutable publication and decision logs.

Exit gate:
- Every legal decision has a role, authority basis, digital signature, reason, audit event and appeal path.

## Stage 2: Identity, Accreditation and Account Opening

Objective: control who can develop, verify, hold, transfer, buy, sell and retire credits.

Required build:
- Organization KYB.
- User RBAC and ABAC.
- Registry holding accounts.
- Verifier accreditation scope, expiry and sanction registry.
- Conflict-of-interest checks.

Exit gate:
- No project, verification, transfer or market action can occur without an approved organization, account and role authorization.

## Stage 3: Project Registration and Methodology Governance

Objective: register eligible projects against approved standards and methodologies.

Required build:
- Methodology catalog.
- Project eligibility screening.
- Public comment workflow.
- Safeguards and grievance evidence.
- Methodology versioning and rule application.

Exit gate:
- A project cannot progress to verification unless methodology, safeguards, consultation and eligibility are complete.

## Stage 4: GIS, Remote Sensing and MRV Evidence

Objective: validate project geography, land cover, risk and MRV evidence.

Required build:
- PostGIS boundary versioning.
- STAC/raster processing pipeline.
- Official Zimbabwe boundary/cadastre/protected-area overlays.
- Remote sensing lineage.
- MRV plot geotag and sampling controls.
- Fire, leakage and reversal monitoring.

Exit gate:
- Every spatial decision has dataset versions, job parameters, output hashes and human GIS sign-off.

## Stage 5: Verification, Issuance and Buffer Controls

Objective: convert verified monitoring results into approved issuance quantities.

Required build:
- Monitoring period workflow.
- Non-conformity and corrective action records.
- Verification opinion records.
- Buffer pool and reversal risk controls.
- Regulator issuance authorization.

Exit gate:
- Credits cannot be issued without verified quantity, regulator approval, buffer decision and audit trail.

## Stage 6: Credit Ledger, Transfers and Retirements

Objective: operate the national account-based credit ledger.

Required build:
- Registry accounts.
- Serialized credit units.
- Transfers.
- Retirements.
- Cancellations.
- Freezes.
- Public retirement certificates.

Exit gate:
- Every credit has one current state and cannot be double-held, double-transferred or double-retired.

## Stage 7: Article 6 and National Climate Accounting

Objective: support Article 6 authorization, ITMO transfer and NDC accounting.

Required build:
- Host-country authorization workflow.
- ITMO first-transfer records.
- Corresponding adjustment ledger.
- NDC sector and inventory mapping.
- BTR and Article 6 reporting exports.

Exit gate:
- No Article 6 unit can transfer without authorization, use purpose, corresponding-adjustment status and national accounting update.

## Stage 8: Marketplace, Surveillance and Public Transparency

Objective: support controlled carbon credit trading and public trust.

Required build:
- Marketplace listings and orders.
- Settlement and custody controls.
- Buyer/seller KYB.
- Trade surveillance.
- Claims controls.
- Public registry and retirement search.

Exit gate:
- Market activity is traceable, compliant, surveilled and reconciled to the national ledger.

## Current Deployment Position

ZAI-CTS is currently suitable for controlled pilot use only. It should not be declared the official national registry until all stage exit gates above are satisfied and independently audited.
