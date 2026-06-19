# ZAI-CTS Start-to-Finish Operating Workflow

This guide describes how an operator uses ZAI-CTS from system startup through project registration, verification, issuance, transfer, retirement, and national reporting.

## 1. Start the System

From the project root:

```powershell
docker compose -f infrastructure\docker\docker-compose.yml up -d postgres redis rabbitmq ai-verification-service carbon-registry-service api-gateway web-portal
```

Open the portal:

```text
http://127.0.0.1:3000
```

Core services:

- Web portal: `http://127.0.0.1:3000`
- API gateway: `http://127.0.0.1:8082`
- Carbon registry service: `http://127.0.0.1:8101`
- RabbitMQ console: `http://127.0.0.1:15673`

## 2. Establish Enterprise Identity and Organization Controls

Open `Identity & Users`.

Run the available IAM controls for:

- User registration
- Login/session management
- MFA
- Email verification
- Account approval/suspension
- Invitations
- Profile and digital signatures
- API keys
- Configurable RBAC permissions

Open `Organizations`.

Run the organization controls for:

- Organization registration
- KYB/KYC
- Organization documents
- Organization approval
- Registry account creation
- Accreditation status
- Users and administrators within the organization

## 3. Establish National Registry Controls

Open the `National Stages` tab.

Run these controls first:

1. `Adopt Registry Rulebook`
2. `Publish Public Disclosure`
3. `Open Appeal Case`
4. `Open Registry Account`
5. `Approve Methodology`
6. `Grant Accreditation`
7. `Record GIS Lineage`
8. `Open Non-Conformance`
9. `Allocate Buffer Pool`

Each action records an immutable audit event. After an action is completed, the button is locked to prevent duplicate operation.

Use the stage cards to record stage decisions after the required controls for that stage have been reviewed.

## 4. Register a Carbon Project

Open the `Carbon Registry` tab.

Enter project details:

- Project code
- Title
- Description
- Methodology
- District
- Province
- Estimated annual tCO2e
- Start date
- Crediting period

Submit the project. The project appears in the registry list and becomes selectable across the portal.

## 5. Move Project Through the Required Lifecycle

Open `Project Lifecycle`.

The system lifecycle is:

1. Organization Registration
2. Organization Approval
3. Registry Account Creation
4. Project Registration
5. Project Validation
6. Project Approval
7. Project Implementation
8. Monitoring Period
9. Monitoring Report Submission
10. Verification Case
11. Evidence Package Upload
12. Automatic Validation
13. AI Assessment
14. GIS Review
15. MRV Review
16. Verifier Decision
17. ZiCMA Review
18. Credit Issuance
19. Credit Registry
20. Marketplace Listing
21. Trading
22. Settlement
23. Ownership Transfer
24. Retirement
25. Article 6 Authorization, if applicable
26. Corresponding Adjustment
27. National Reporting
28. Long-Term Monitoring

## 6. Validate the Project Before Implementation

Open `Validation`.

Complete:

- Methodology review
- Additionality assessment
- Financial feasibility
- Environmental safeguards
- Social safeguards
- Stakeholder consultation
- Land ownership validation
- Project design review
- Validation report
- Validator approval

Only validated projects should proceed to implementation.

## 7. Configure Monitoring

Open `Monitoring`.

Record:

- Monitoring schedule
- Field inspections
- IoT data
- Drone data
- Satellite monitoring
- Forest change detection
- Carbon measurements
- Monitoring report submission

## 8. Move Project Through Registry Workflow

In the `Dashboard` or `Registry` workflow controls:

1. Submit project for verification.
2. Start verification.
3. Approve or reject after verification results.
4. Issue credits only after ZiCMA approval.

The platform blocks issuance if required verification approvals are missing.

## 9. Submit Evidence Package

Open the `Verification` tab.

Start the case, then upload a ZIP or multiple evidence files. The package should contain:

- Boundary evidence
- Monitoring report
- Carbon calculation
- Biomass inventory
- Satellite imagery metadata
- Field photo/GPS evidence
- Inspection forms
- Drone imagery or flight logs
- Verifier statement
- Accreditation certificate
- Digital signature

The system categorizes files, calculates SHA256 hashes, validates formats, extracts metadata, and updates the evidence checklist.

Test packages are available in:

```text
test-evidence-packages
```

## 10. Run Verification Review

In the `Verification` tab, run:

1. Automatic validation
2. AI assessment
3. GIS decision
4. MRV decision
5. Verifier decision
6. ZiCMA approval

Every step is role-based and auditable. Buttons lock after completion.

## 11. Run GIS Validation

Open the `GIS` tab.

Run GIS assessment and review:

- Project boundary
- Satellite imagery
- Forest cover
- Fire alerts
- Carbon density
- MRV plots
- Evidence readiness

Use GIS evidence submission and validation controls before final approval.

## 12. Run AI Review

Open the `AI Review` tab.

Run AI review for the selected project. The AI service checks:

- Methodology consistency
- Project risk
- Crediting period risk
- Evidence completeness
- Document ownership signals
- Required human verification controls

AI output is decision support only. A regulator must validate or reject the AI review.

## 13. Issue Credits

After verification and ZiCMA approval, issue credits from the registry workflow.

The registry creates:

- Credit batch
- Serial prefix
- Issuance audit event
- Blockchain transaction reference placeholder

## 14. Operate Credit Registry, Marketplace, Finance, and Article 6 Controls

Open `Credit Registry`, `Marketplace`, `Reporting`, and `Article 6 Ops`.

Run the controls in sequence:

1. `Authorize Article 6 Transfer`
2. `Create Market Listing Control`
3. `Record Market Settlement`
4. `Transfer Credits`
5. `Retire Credits`
6. `Freeze Credits`, if regulatory hold is required
7. `Lock Accounting Snapshot`

After retirement, click `Verify Certificate` to check the public retirement certificate endpoint.

Open `Marketplace` to complete:

- Registry wallet
- Portfolio
- Spot/OTC/auction controls
- Settlement
- Invoices
- Payments
- Fees
- Transaction history
- Market analytics

Open `Reporting` for:

- Financial reports
- Registry reports
- National climate reports
- Article 6 and UN reporting preparation

## 15. Regulator Oversight, Appeals, and Reversals

Open `Compliance` and `Appeals`.

Use it to monitor:

- Enforcement cases
- Verifier accreditations
- Registry rules
- Appeals
- Market conduct alerts
- Public disclosures
- GIS processing jobs
- Non-conformances
- Buffer allocations
- National audit timeline

Open a compliance case when fraud, duplicate claims, boundary overlap, inflated issuance, verifier conflict, or market misconduct is suspected.

Use Compliance for reversal management:

- Forest fires
- Illegal logging
- Flood damage
- Carbon reversal
- Buffer pool
- Replacement credits
- Registry corrections

Use Appeals for:

- Appeal submission
- Appeal review
- Independent panel
- Decision
- Final resolution

## 16. National Reporting

Use accounting snapshots to reconcile:

- Issued credits
- Retired credits
- Article 6 authorized volumes
- ITMO volumes
- Net national position
- NDC sector allocation

These records support national climate reporting and Article 6 reporting preparation.

## 17. End-to-End Completion Checklist

The system workflow is complete when:

- Registry rulebook is adopted.
- IAM users, roles, permissions, sessions and signatures are configured.
- Organization is registered, KYB-reviewed, approved and linked to a registry account.
- Project developer account is opened.
- Methodology is approved.
- Validation is completed before implementation.
- Monitoring period and monitoring report are recorded.
- Verifier accreditation is active.
- Project is registered.
- Evidence package is uploaded and validated.
- GIS, MRV, verifier, and ZiCMA approvals are complete.
- Credits are issued.
- Marketplace controls are recorded.
- Ledger transfer is recorded.
- Retirement is recorded with public certificate.
- Accounting snapshot is locked.
- Public disclosure is published.
- Audit timeline contains every action.

## 18. Production Caveats

The implemented workflow is now functional for controlled pilot operation. Before official national production deployment, ZAI-CTS still requires:

- Formal legal adoption of registry operating rules.
- Real identity/KYB integrations.
- Dedicated database migrations for all national operation tables.
- Real PostGIS/STAC/raster processing infrastructure.
- External settlement and custody integration.
- Article 6 registry reconciliation with official reporting systems.
- Independent penetration testing and security accreditation.
- Disaster recovery testing.
- Operating procedures for sanctions, reversals, appeals, and public corrections.
