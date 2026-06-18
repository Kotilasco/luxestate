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

## 2. Establish National Registry Controls

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

## 3. Register a Carbon Project

Open the `Registry` tab.

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

## 4. Move Project Through Registry Workflow

In the `Dashboard` or `Registry` workflow controls:

1. Submit project for verification.
2. Start verification.
3. Approve or reject after verification results.
4. Issue credits only after ZiCMA approval.

The platform blocks issuance if required verification approvals are missing.

## 5. Submit Evidence Package

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

## 6. Run Verification Review

In the `Verification` tab, run:

1. Automatic validation
2. AI assessment
3. GIS decision
4. MRV decision
5. Verifier decision
6. ZiCMA approval

Every step is role-based and auditable. Buttons lock after completion.

## 7. Run GIS Validation

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

## 8. Run AI Review

Open the `AI Review` tab.

Run AI review for the selected project. The AI service checks:

- Methodology consistency
- Project risk
- Crediting period risk
- Evidence completeness
- Document ownership signals
- Required human verification controls

AI output is decision support only. A regulator must validate or reject the AI review.

## 9. Issue Credits

After verification and ZiCMA approval, issue credits from the registry workflow.

The registry creates:

- Credit batch
- Serial prefix
- Issuance audit event
- Blockchain transaction reference placeholder

## 10. Operate Ledger, Marketplace, and Article 6 Controls

Open the `Article 6` tab.

Run the controls in sequence:

1. `Authorize Article 6 Transfer`
2. `Create Market Listing Control`
3. `Record Market Settlement`
4. `Transfer Credits`
5. `Retire Credits`
6. `Freeze Credits`, if regulatory hold is required
7. `Lock Accounting Snapshot`

After retirement, click `Verify Certificate` to check the public retirement certificate endpoint.

## 11. Regulator Oversight

Open the `Oversight` tab.

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

## 12. National Reporting

Use accounting snapshots to reconcile:

- Issued credits
- Retired credits
- Article 6 authorized volumes
- ITMO volumes
- Net national position
- NDC sector allocation

These records support national climate reporting and Article 6 reporting preparation.

## 13. End-to-End Completion Checklist

The system workflow is complete when:

- Registry rulebook is adopted.
- Project developer account is opened.
- Methodology is approved.
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

## 14. Production Caveats

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
