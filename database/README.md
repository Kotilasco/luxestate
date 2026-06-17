# Database Design

ZAI-CTS uses PostgreSQL with PostGIS as the relational and geospatial system of record.

## Standards

Every table includes:

- UUID primary key
- `created_at`
- `updated_at`
- `created_by`
- `updated_by`
- immutable audit linkage through `audit.audit_events`
- soft-delete field where appropriate

## Baseline Schemas

| Schema | Purpose |
| --- | --- |
| `identity` | Organizations, users, roles, ABAC attributes |
| `registry` | Carbon projects and credit batches |
| `gis` | Project boundaries and spatial intelligence |
| `audit` | Immutable audit events |

## Migration Rule

Use forward-only migrations. Destructive changes require a new additive migration plus a documented data-retention decision.
