CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS registry;
CREATE SCHEMA IF NOT EXISTS gis;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS market;
CREATE SCHEMA IF NOT EXISTS compliance;
CREATE SCHEMA IF NOT EXISTS article6;
CREATE SCHEMA IF NOT EXISTS reporting;

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

CREATE TABLE IF NOT EXISTS registry.methodologies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    standard VARCHAR(80) NOT NULL,
    methodology_code VARCHAR(80) NOT NULL,
    methodology_name VARCHAR(255) NOT NULL,
    version VARCHAR(40) NOT NULL,
    sector VARCHAR(120) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'active',
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_at TIMESTAMPTZ NULL,
    UNIQUE (standard, methodology_code, version)
);

CREATE TABLE IF NOT EXISTS registry.registry_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES identity.organizations(id),
    account_number VARCHAR(80) NOT NULL UNIQUE,
    account_type VARCHAR(60) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'pending_approval',
    kyc_status VARCHAR(40) NOT NULL DEFAULT 'not_started',
    country_code CHAR(2) NOT NULL DEFAULT 'ZW',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS registry.carbon_credit_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES registry.carbon_credit_batches(id),
    account_id UUID NULL REFERENCES registry.registry_accounts(id),
    serial_number VARCHAR(140) NOT NULL UNIQUE,
    vintage_year INTEGER NOT NULL,
    quantity_tco2e NUMERIC(18, 4) NOT NULL DEFAULT 1 CHECK (quantity_tco2e > 0),
    unit_status VARCHAR(60) NOT NULL DEFAULT 'issued',
    article6_authorized BOOLEAN NOT NULL DEFAULT FALSE,
    corresponding_adjustment_status VARCHAR(60) NOT NULL DEFAULT 'not_applicable',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS registry.credit_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_account_id UUID NOT NULL REFERENCES registry.registry_accounts(id),
    to_account_id UUID NOT NULL REFERENCES registry.registry_accounts(id),
    transfer_type VARCHAR(60) NOT NULL,
    status VARCHAR(60) NOT NULL DEFAULT 'pending_counterparty_acceptance',
    quantity_tco2e NUMERIC(18, 4) NOT NULL CHECK (quantity_tco2e > 0),
    settlement_reference VARCHAR(160) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS registry.credit_retirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES registry.registry_accounts(id),
    beneficiary_name VARCHAR(255) NOT NULL,
    retirement_purpose VARCHAR(255) NOT NULL,
    claim_type VARCHAR(80) NOT NULL,
    quantity_tco2e NUMERIC(18, 4) NOT NULL CHECK (quantity_tco2e > 0),
    certificate_number VARCHAR(120) NOT NULL UNIQUE,
    public_certificate_hash VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS compliance.verifier_accreditations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES identity.organizations(id),
    accreditation_number VARCHAR(120) NOT NULL UNIQUE,
    scope VARCHAR(255) NOT NULL,
    status VARCHAR(60) NOT NULL DEFAULT 'active',
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    sanctions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS compliance.regulatory_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number VARCHAR(120) NOT NULL UNIQUE,
    case_type VARCHAR(80) NOT NULL,
    resource_type VARCHAR(120) NOT NULL,
    resource_id UUID NULL,
    severity VARCHAR(40) NOT NULL DEFAULT 'medium',
    status VARCHAR(60) NOT NULL DEFAULT 'open',
    findings JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS article6.authorizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES registry.carbon_projects(id),
    authorization_number VARCHAR(120) NOT NULL UNIQUE,
    authorization_type VARCHAR(80) NOT NULL,
    use_purpose VARCHAR(120) NOT NULL,
    ndc_sector VARCHAR(120) NOT NULL,
    corresponding_adjustment_required BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(60) NOT NULL DEFAULT 'draft',
    authorized_quantity_tco2e NUMERIC(18, 4) NULL,
    first_transfer_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS market.marketplace_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_account_id UUID NOT NULL REFERENCES registry.registry_accounts(id),
    project_id UUID NOT NULL REFERENCES registry.carbon_projects(id),
    vintage_year INTEGER NOT NULL,
    quantity_tco2e NUMERIC(18, 4) NOT NULL CHECK (quantity_tco2e > 0),
    price_per_tco2e NUMERIC(18, 4) NOT NULL CHECK (price_per_tco2e >= 0),
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(60) NOT NULL DEFAULT 'open',
    eligibility_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS market.marketplace_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES market.marketplace_listings(id),
    buyer_account_id UUID NOT NULL REFERENCES registry.registry_accounts(id),
    quantity_tco2e NUMERIC(18, 4) NOT NULL CHECK (quantity_tco2e > 0),
    status VARCHAR(60) NOT NULL DEFAULT 'pending_compliance_review',
    settlement_status VARCHAR(60) NOT NULL DEFAULT 'not_started',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS reporting.national_accounting_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporting_year INTEGER NOT NULL,
    ndc_sector VARCHAR(120) NOT NULL,
    issued_tco2e NUMERIC(18, 4) NOT NULL DEFAULT 0,
    retired_tco2e NUMERIC(18, 4) NOT NULL DEFAULT 0,
    authorized_itmo_tco2e NUMERIC(18, 4) NOT NULL DEFAULT 0,
    corresponding_adjustment_tco2e NUMERIC(18, 4) NOT NULL DEFAULT 0,
    data_hash VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_at TIMESTAMPTZ NULL,
    UNIQUE (reporting_year, ndc_sector)
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
    device VARCHAR(255) NULL,
    workflow_step VARCHAR(160) NULL,
    digital_signature VARCHAR(255) NULL,
    old_value JSONB NULL,
    new_value JSONB NULL,
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

INSERT INTO identity.organizations (
    id,
    legal_name,
    registration_number,
    organization_type,
    status
) VALUES (
    '11111111-1111-4111-8111-111111111111',
    'Zimbabwe Climate Authority',
    'ZCA-BOOTSTRAP-001',
    'regulator',
    'active'
) ON CONFLICT (registration_number) DO NOTHING;

CREATE TABLE IF NOT EXISTS registry.anchor_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_name VARCHAR(120) NOT NULL,
    from_record_id UUID NULL,
    to_record_id UUID NULL,
    entry_count INTEGER NOT NULL DEFAULT 0,
    merkle_root VARCHAR(64) NOT NULL,
    previous_anchor_id UUID NULL REFERENCES registry.anchor_batches(id),
    previous_anchor_hash VARCHAR(64) NULL,
    fabric_tx_id VARCHAR(128) NULL,
    fabric_block_number INTEGER NULL,
    anchored_at TIMESTAMPTZ NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anchor_batches_status
    ON registry.anchor_batches(status);

CREATE TABLE IF NOT EXISTS registry.carbon_credit_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES registry.carbon_credit_batches(id),
    serial_number VARCHAR(80) NOT NULL UNIQUE,
    vintage_year INTEGER NOT NULL CHECK (vintage_year >= 2000),
    quantity_tco2e NUMERIC(18, 4) NOT NULL CHECK (quantity_tco2e > 0),
    entry_hash VARCHAR(64) NOT NULL,
    anchor_batch_id UUID NULL REFERENCES registry.anchor_batches(id),
    status VARCHAR(40) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_entries_anchor
    ON registry.carbon_credit_entries(anchor_batch_id);

CREATE INDEX IF NOT EXISTS idx_credit_entries_batch
    ON registry.carbon_credit_entries(batch_id);

ALTER TABLE registry.anchor_batches
    ADD CONSTRAINT fk_from_record FOREIGN KEY (from_record_id) REFERENCES registry.carbon_credit_entries(id) DEFERRABLE INITIALLY DEFERRED,
    ADD CONSTRAINT fk_to_record FOREIGN KEY (to_record_id) REFERENCES registry.carbon_credit_entries(id) DEFERRABLE INITIALLY DEFERRED;
