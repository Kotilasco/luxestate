CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS registry;
CREATE SCHEMA IF NOT EXISTS gis;
CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE IF NOT EXISTS identity.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legal_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) NOT NULL UNIQUE,
    organization_type VARCHAR(60) NOT NULL,
    country_code CHAR(2) NOT NULL DEFAULT 'ZW',
    status VARCHAR(40) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS registry.carbon_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_code VARCHAR(40) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    methodology VARCHAR(120) NOT NULL,
    proponent_organization_id UUID NOT NULL REFERENCES identity.organizations(id),
    district VARCHAR(120) NOT NULL,
    province VARCHAR(120) NOT NULL,
    status VARCHAR(60) NOT NULL DEFAULT 'draft',
    estimated_annual_tco2e NUMERIC(18, 4) NOT NULL CHECK (estimated_annual_tco2e >= 0),
    start_date DATE NOT NULL,
    crediting_period_years INTEGER NOT NULL CHECK (crediting_period_years > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS gis.project_boundaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES registry.carbon_projects(id),
    boundary GEOMETRY(MULTIPOLYGON, 4326) NOT NULL,
    validation_status VARCHAR(60) NOT NULL DEFAULT 'pending',
    area_hectares NUMERIC(18, 4) GENERATED ALWAYS AS (ST_Area(boundary::geography) / 10000) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_project_boundaries_boundary
    ON gis.project_boundaries USING GIST (boundary);

CREATE TABLE IF NOT EXISTS registry.carbon_credit_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES registry.carbon_projects(id),
    vintage_year INTEGER NOT NULL CHECK (vintage_year >= 2000),
    quantity_tco2e NUMERIC(18, 4) NOT NULL CHECK (quantity_tco2e > 0),
    serial_prefix VARCHAR(80) NOT NULL UNIQUE,
    status VARCHAR(60) NOT NULL DEFAULT 'pending_issuance',
    blockchain_tx_id VARCHAR(128) NULL,
    issued_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS audit.audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(120) NOT NULL,
    actor_id UUID NULL,
    actor_role VARCHAR(120) NULL,
    organization_id UUID NULL,
    resource_type VARCHAR(120) NOT NULL,
    resource_id UUID NULL,
    action VARCHAR(120) NOT NULL,
    outcome VARCHAR(40) NOT NULL,
    ip_address INET NULL,
    correlation_id UUID NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_events_resource
    ON audit.audit_events (resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_audit_events_correlation
    ON audit.audit_events (correlation_id);
