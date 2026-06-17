# ZAI-CTS Verification Workflow Specification

## Module

Carbon Project Verification & Evidence Validation

## Objective

Implement a production-grade verification workflow that validates submitted carbon project evidence before carbon credits can be issued. The workflow must comply with Zimbabwe SI 48 of 2025 and the Paris Agreement Article 6, maintain a complete audit trail, support AI-assisted verification, and require human approval before any credits are minted.

---

# Workflow Overview

```
Project Registered
        │
        ▼
Developer submits Monitoring Report
        │
        ▼
Evidence Package Upload
        │
        ▼
Automatic Validation
        │
        ▼
AI Assessment
        │
        ▼
GIS Verification
        │
        ▼
MRV Review
        │
        ▼
Accredited Verifier Review
        │
        ▼
ZiCMA Regulatory Review
        │
        ▼
Approval
        │
        ▼
Credit Issuance
```

---

# Step 1 – Start Verification

Only projects with status:

* Registered
* Monitoring Due
* Reverification Required

may enter verification.

The system creates a Verification Case.

Example

```
Verification ID

VER-2026-000154

Status

Pending Evidence

Assigned Verifier

Not Assigned

Monitoring Period

01 Jan 2026

to

31 Dec 2026
```

---

# Step 2 – Evidence Package Upload

The user uploads an evidence package.

Required uploads

## Boundary Files

* GeoJSON
* SHP
* KML

## Monitoring Reports

* Monitoring Report (PDF)
* Carbon Calculations
* Biomass Inventory

## GIS

* Satellite imagery
* Boundary files

## Field Evidence

* GPS photographs
* Inspection forms
* Drone imagery

## Verification

* Verifier statement
* Accreditation certificate
* Digital signature

Each uploaded file receives

* SHA256 hash
* Upload timestamp
* Version number
* Uploader identity
* Digital signature

Store all files in immutable storage.

---

# Step 3 – Automatic Validation

Immediately after upload the platform performs:

File integrity

✔ Virus scan

✔ Hash validation

✔ File format validation

✔ Duplicate detection

Metadata extraction

Automatically detect

* CRS
* Coordinates
* Polygon validity
* File size
* Capture dates
* Camera GPS
* Satellite metadata

Reject corrupted or incomplete submissions.

---

# Step 4 – AI Validation

Run AI services automatically.

## Boundary Analysis

Validate polygon

Detect overlaps

Detect duplicate projects

Compare previous submissions

Check protected areas

## Satellite Analysis

Compare latest imagery

Forest cover

Deforestation

Fire scars

Water changes

Illegal clearing

## Carbon Assessment

Validate calculations

Compare historical trends

Estimate expected sequestration

Detect anomalies

## Fraud Detection

Duplicate evidence

Image manipulation

Impossible GPS

Copied reports

Suspicious calculations

Repeated satellite scenes

Generate

Integrity Score

Risk Score

Confidence Score

Explainability Report

---

# Step 5 – GIS Assessment

Automatically display

Interactive map

Layers

Project boundary

Satellite imagery

Forest cover

Fire alerts

Protected areas

Communities

Roads

Water bodies

Carbon density

Verifier can

Zoom

Measure

Compare imagery

Inspect polygon

Approve GIS

Reject GIS

Request corrections

---

# Step 6 – MRV Assessment

Review

Monitoring report

Emission calculations

Sampling methodology

Baseline

Leakage

Additionality

Permanence

Generate

MRV Status

PASS

WARNING

FAIL

---

# Step 7 – Accredited Verifier Review

Verifier reviews all evidence.

Checklist

Boundary

Satellite

Drone

Photos

MRV

Carbon calculations

Community consultation

Methodology compliance

Verifier chooses

Approve

Reject

Request More Information

Every decision requires comments.

Digital signature mandatory.

---

# Step 8 – ZiCMA Review

Government regulator reviews

Verifier recommendation

AI assessment

GIS assessment

MRV assessment

Risk score

Audit history

Decision

Approve

Reject

Return for revision

Generate

Letter of Approval

Letter of Rejection

Request for Clarification

Digitally sign decision.

---

# Step 9 – Registry Update

If approved

Project status becomes

Verified

Registry updated

Audit written

Blockchain event generated

Ready for Credit Issuance

If rejected

Project status

Verification Failed

Reasons recorded

Appeal enabled

---

# Step 10 – Audit Trail

Every action records

Timestamp

User

Role

IP address

GPS (mobile)

Device

Action

Previous value

New value

Digital signature

AI recommendation

Human decision

Nothing may be deleted.

---

# Verification Dashboard

Display

Verification Progress

Evidence completeness

AI integrity score

GIS status

MRV status

Risk score

Verifier status

ZiCMA approval

Outstanding actions

Audit history

---

# AI Decision Panel

Show

Integrity Score

Risk Score

Confidence

Leakage probability

Additionality confidence

Fire detection

Deforestation trend

Carbon estimate

Anomaly alerts

Explain every AI recommendation.

---

# Notifications

Notify

Developer

Verifier

ZiCMA

Community (if required)

Email

SMS

System notifications

---

# Final Outputs

Approved Verification Certificate

Verification Report

GIS Assessment Report

AI Assessment Report

Audit Report

Registry Update

Blockchain Transaction

Credit Issuance Trigger

---

# Status Lifecycle

Pending Evidence

↓

Evidence Uploaded

↓

Automatic Validation

↓

AI Review

↓

GIS Review

↓

MRV Review

↓

Verifier Review

↓

ZiCMA Review

↓

Approved

↓

Credit Issued

or

Rejected

or

Revision Requested

---

# Production Rules

No verification can bypass AI validation.

No credit may be issued without human approval.

Every uploaded file must be hashed.

Every decision must be auditable.

All approvals require digital signatures.

Every AI recommendation must be explainable.

Every verification generates a permanent immutable audit trail.

The verification workflow is complete only when the project is either approved for credit issuance or formally rejected with documented reasons and an appeal path.
