You are the Chief Enterprise Architect reviewing the Zimbabwe AI-Enhanced Carbon Trading System (ZAI-CTS).

Perform a complete architectural refactor of the application to align it with how a national carbon registry operates under Zimbabwe SI 48 of 2025 and the Paris Agreement Article 6.

Do NOT simply improve the UI. Review the entire business workflow, navigation, database, permissions, services, and user experience.

The following issues MUST be addressed.

=====================================================================
1. IMPLEMENT A COMPLETE USER MANAGEMENT MODULE
=====================================================================

The system currently assumes users already exist.

Implement a full Identity and Access Management (IAM) module.

Features:

• User Registration
• Organization Registration
• Project Developer Registration
• Verifier Registration
• Government Officer Registration
• Community Representative Registration
• Buyer Registration
• Seller Registration
• Administrator Registration

Support:

• Login
• Logout
• Forgot Password
• Password Reset
• MFA
• Email Verification
• Account Approval
• Account Suspension
• User Invitations
• User Profile
• Digital Signatures
• API Keys
• Session Management

Implement Role Based Access Control (RBAC).

Roles should include:

• Super Administrator
• ZiCMA Administrator
• Registry Officer
• Registry Manager
• Project Developer
• Accredited Validator
• Accredited Verifier
• GIS Analyst
• MRV Officer
• AI Review Officer
• Compliance Officer
• Legal Officer
• Marketplace Operator
• Finance Officer
• Community Officer
• Buyer
• Seller
• Auditor
• Public User

Each role must have configurable permissions.

Implement permission management instead of hardcoding access.

=====================================================================
2. ORGANIZATION MANAGEMENT
=====================================================================

Before projects exist there must be organizations.

Implement:

• Organization Registration
• KYC/KYB
• Organization Approval
• Registry Account Creation
• Organization Dashboard
• Users within Organization
• Multiple Administrators
• Organization Documents
• Accreditation Status

Examples:

Government

NGO

Private Company

Community Trust

Forestry Company

Carbon Developer

International Buyer

Verification Company

=====================================================================
3. RESTRUCTURE THE ENTIRE PLATFORM INTO OPERATIONAL DOMAINS
=====================================================================

Replace the current tab structure.

Implement major modules:

A. Dashboard

B. Identity & User Management

C. Organizations

D. Carbon Registry

E. Project Lifecycle

F. Validation

G. Monitoring

H. Verification

I. Credit Registry

J. Marketplace

K. Article 6 Operations

L. GIS Intelligence

M. AI Intelligence

N. MRV

O. Compliance

P. Appeals

Q. Reporting

R. Administration

=====================================================================
4. CORRECT THE PROJECT LIFECYCLE
=====================================================================

Implement this workflow exactly.

Organization Registration

↓

Organization Approval

↓

Registry Account Creation

↓

Project Registration

↓

Project Validation

↓

Project Approval

↓

Project Implementation

↓

Monitoring Period

↓

Monitoring Report Submission

↓

Verification Case

↓

Evidence Package Upload

↓

Automatic Validation

↓

AI Assessment

↓

GIS Review

↓

MRV Review

↓

Verifier Decision

↓

ZiCMA Review

↓

Credit Issuance

↓

Credit Registry

↓

Marketplace Listing

↓

Trading

↓

Settlement

↓

Ownership Transfer

↓

Retirement

↓

Article 6 Authorization (if applicable)

↓

Corresponding Adjustment

↓

National Reporting

↓

Long-Term Monitoring

=====================================================================
5. IMPLEMENT PROJECT VALIDATION
=====================================================================

Validation is NOT Verification.

Create a separate Validation module.

Validation includes:

• Methodology review

• Additionality assessment

• Financial feasibility

• Environmental safeguards

• Social safeguards

• Stakeholder consultation

• Land ownership validation

• Project design review

• Validation report

• Validator approval

Only validated projects may proceed to implementation.

=====================================================================
6. IMPLEMENT MONITORING
=====================================================================

Projects require monitoring periods.

Implement:

Monitoring Schedule

Monitoring Reports

Field Inspections

IoT Data

Drone Data

Satellite Monitoring

Forest Change Detection

Carbon Measurements

Monitoring History

=====================================================================
7. REDESIGN VERIFICATION
=====================================================================

Verification should become a Case Management system.

Features:

Verification Dashboard

Evidence Package

Automatic Validation

AI Review

GIS Review

MRV Review

Verifier Review

ZiCMA Review

Audit Timeline

Digital Signatures

Evidence Versioning

Evidence Hashing

Workflow Status

=====================================================================
8. IMPLEMENT CREDIT REGISTRY
=====================================================================

Separate Project Registry from Credit Registry.

Credit Registry stores:

Credit Batch

Serial Numbers

Vintage

Methodology

Owner

Status

Transfer History

Retirement

Blockchain Reference

=====================================================================
9. REDESIGN MARKETPLACE
=====================================================================

Marketplace should include:

Registry Wallet

Portfolio

Listings

Spot Market

OTC Market

Auctions

Settlement

Invoices

Payments

Fees

Transaction History

Market Analytics

=====================================================================
10. ARTICLE 6
=====================================================================

Move Article 6 into Credit Operations.

Support:

Authorization

Corresponding Adjustments

ITMOs

Export Approval

Import Approval

National Accounting

UN Reporting

=====================================================================
11. IMPLEMENT APPEALS
=====================================================================

Every regulatory decision must be appealable.

Implement:

Appeal Submission

Appeal Review

Independent Panel

Decision

Final Resolution

Audit Trail

=====================================================================
12. IMPLEMENT REVERSAL MANAGEMENT
=====================================================================

Support:

Forest Fires

Illegal Logging

Flood Damage

Carbon Reversal

Buffer Pool

Replacement Credits

Registry Corrections

=====================================================================
13. IMPLEMENT FINANCE
=====================================================================

Add financial operations.

Invoices

Receipts

Registry Fees

Marketplace Fees

Taxes

Payment Status

Refunds

Financial Reports

=====================================================================
14. GIS
=====================================================================

Replace text-based GIS inputs.

Implement interactive maps.

Support:

Boundary Drawing

GeoJSON Upload

Shapefile Upload

Satellite Layers

Fire Layers

Forest Cover

Communities

Roads

Water

Carbon Density

Historical Comparison

=====================================================================
15. AI
=====================================================================

AI must be decision support.

Implement:

PDD Assistant

Fraud Detection

Leakage Detection

Additionality Assessment

Document Analysis

Satellite Analysis

Risk Assessment

Price Forecasting

Executive Copilot

Every AI recommendation must include:

Confidence

Explanation

Evidence

Human Override

=====================================================================
16. DASHBOARDS
=====================================================================

Build enterprise dashboards.

Executive Dashboard

Registry Dashboard

Verifier Dashboard

Marketplace Dashboard

Compliance Dashboard

GIS Dashboard

AI Dashboard

National Climate Dashboard

Community Dashboard

=====================================================================
17. AUDIT
=====================================================================

Every action must generate immutable audit records.

Store:

Timestamp

User

Role

Organization

Old Value

New Value

Digital Signature

IP Address

Device

Workflow Step

=====================================================================
18. REVIEW THE ENTIRE CODEBASE
=====================================================================

Review every module.

Identify architectural issues.

Refactor where necessary.

Ensure:

Clean Architecture

DDD

SOLID

Repository Pattern

CQRS where appropriate

Production-ready code

=====================================================================
19. DELIVERABLES
=====================================================================

Update:

Database schema

Backend services

Frontend

Navigation

Permissions

API documentation

Entity relationships

Workflows

UI

Documentation

Migration scripts

Test cases

The final result must resemble an enterprise-grade national carbon registry comparable to Verra, Gold Standard, Markit Environmental Registry, the UK Emissions Registry, and the Australian National Registry while incorporating Zimbabwe-specific regulatory requirements and modern AI, GIS, and blockchain capabilities.