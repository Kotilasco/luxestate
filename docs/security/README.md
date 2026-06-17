# ZAI-CTS Security Architecture

ZAI-CTS uses Zero Trust controls for all identities, APIs, workloads, and data flows.

## Security Controls

| Control | Implementation Rule |
| --- | --- |
| Authentication | OAuth2/OIDC with JWT access tokens and refresh-token rotation |
| Authorization | RBAC for roles, ABAC for resource, district, organization, assurance level, and project status |
| MFA | Mandatory for regulators, auditors, administrators, and approvers |
| Transport | TLS externally and mTLS between internal services |
| Data Protection | AES-256 at rest, field-level encryption for sensitive evidence |
| Audit | Immutable append-only audit events for every sensitive action |
| API Protection | Gateway rate limits, schema validation, request IDs, WAF-ready headers |
| Secrets | Kubernetes Secret or external Secrets Manager integration |
| SIEM | Structured security event stream from Audit Service |

## Standard Roles

- `platform.super_admin`
- `regulator.approver`
- `regulator.auditor`
- `verifier.lead`
- `project_developer.owner`
- `market.trader`
- `community.viewer`
- `gis.analyst`
- `ai.governance_officer`

