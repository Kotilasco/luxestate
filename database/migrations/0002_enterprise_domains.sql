BEGIN;

CREATE SCHEMA IF NOT EXISTS iam;
CREATE SCHEMA IF NOT EXISTS organizations;
CREATE SCHEMA IF NOT EXISTS validation;
CREATE SCHEMA IF NOT EXISTS monitoring;
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS reversals;

ALTER TABLE audit.audit_events ADD COLUMN IF NOT EXISTS device VARCHAR(255) NULL;
ALTER TABLE audit.audit_events ADD COLUMN IF NOT EXISTS workflow_step VARCHAR(160) NULL;
ALTER TABLE audit.audit_events ADD COLUMN IF NOT EXISTS digital_signature VARCHAR(255) NULL;
ALTER TABLE audit.audit_events ADD COLUMN IF NOT EXISTS old_value JSONB NULL;
ALTER TABLE audit.audit_events ADD COLUMN IF NOT EXISTS new_value JSONB NULL;

CREATE TABLE IF NOT EXISTS iam.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) NOT NULL UNIQUE,
    category VARCHAR(80) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    configurable BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS iam.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(180) NOT NULL,
    role_id UUID REFERENCES iam.roles(id),
    status VARCHAR(60) NOT NULL DEFAULT 'pending_approval',
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified_at TIMESTAMPTZ NULL,
    suspended_at TIMESTAMPTZ NULL,
    last_login_at TIMESTAMPTZ NULL,
    digital_signature_public_key TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS iam.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES iam.users(id),
    key_fingerprint VARCHAR(160) NOT NULL UNIQUE,
    scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
    expires_at TIMESTAMPTZ NULL,
    revoked_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS iam.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES iam.users(id),
    ip_address VARCHAR(80) NULL,
    device_fingerprint VARCHAR(180) NULL,
    revoked_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organizations.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(220) NOT NULL,
    organization_type VARCHAR(80) NOT NULL,
    kyb_status VARCHAR(60) NOT NULL DEFAULT 'pending',
    registry_account_status VARCHAR(60) NOT NULL DEFAULT 'not_created',
    accreditation_status VARCHAR(60) NOT NULL DEFAULT 'not_applicable',
    approval_status VARCHAR(60) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organizations.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations.organizations(id),
    document_type VARCHAR(120) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    verification_status VARCHAR(60) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS validation.validation_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    validator_user_id UUID NULL,
    status VARCHAR(60) NOT NULL DEFAULT 'open',
    methodology_status VARCHAR(60) NOT NULL DEFAULT 'pending',
    additionality_status VARCHAR(60) NOT NULL DEFAULT 'pending',
    financial_status VARCHAR(60) NOT NULL DEFAULT 'pending',
    environmental_safeguards_status VARCHAR(60) NOT NULL DEFAULT 'pending',
    social_safeguards_status VARCHAR(60) NOT NULL DEFAULT 'pending',
    land_ownership_status VARCHAR(60) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS monitoring.monitoring_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status VARCHAR(60) NOT NULL DEFAULT 'scheduled',
    report_due_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS monitoring.monitoring_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    monitoring_period_id UUID NOT NULL REFERENCES monitoring.monitoring_periods(id),
    report_type VARCHAR(80) NOT NULL,
    data_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    carbon_measurements JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(60) NOT NULL DEFAULT 'submitted',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finance.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NULL,
    invoice_number VARCHAR(80) NOT NULL UNIQUE,
    fee_type VARCHAR(80) NOT NULL,
    amount_usd NUMERIC(18, 2) NOT NULL,
    tax_usd NUMERIC(18, 2) NOT NULL DEFAULT 0,
    status VARCHAR(60) NOT NULL DEFAULT 'issued',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finance.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES finance.invoices(id),
    receipt_number VARCHAR(80) NOT NULL UNIQUE,
    amount_usd NUMERIC(18, 2) NOT NULL,
    payment_status VARCHAR(60) NOT NULL DEFAULT 'received',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reversals.reversal_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    reversal_type VARCHAR(80) NOT NULL,
    estimated_tco2e NUMERIC(18, 4) NOT NULL,
    buffer_pool_drawdown_tco2e NUMERIC(18, 4) NOT NULL DEFAULT 0,
    replacement_credit_status VARCHAR(60) NOT NULL DEFAULT 'pending',
    registry_correction_status VARCHAR(60) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS registry.enterprise_domain_controls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain VARCHAR(80) NOT NULL,
    control VARCHAR(120) NOT NULL,
    status VARCHAR(60) NOT NULL,
    owner VARCHAR(120) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;
