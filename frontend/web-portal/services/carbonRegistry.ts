export type CarbonProject = {
  id: string;
  project_code: string;
  title: string;
  description: string;
  methodology: string;
  proponent_organization_id: string;
  district: string;
  province: string;
  status: string;
  estimated_annual_tco2e: string;
  start_date: string;
  crediting_period_years: number;
  created_at: string;
  updated_at: string;
};

export type CreditBatch = {
  id: string;
  project_id: string;
  vintage_year: number;
  quantity_tco2e: string;
  serial_prefix: string;
  status: string;
  blockchain_tx_id: string | null;
  issued_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AuditEvent = {
  id: string;
  event_type: string;
  actor_id: string | null;
  actor_role: string | null;
  resource_type: string;
  resource_id: string | null;
  action: string;
  outcome: string;
  correlation_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

type RawAuditEvent = AuditEvent & {
  metadata_?: Record<string, unknown>;
};

export type GisLayer = {
  name: string;
  status: string;
  summary: string;
};

export type GisAssessment = {
  project_id: string;
  district: string;
  province: string;
  centroid_latitude: string;
  centroid_longitude: string;
  estimated_area_hectares: string;
  forest_cover_percent: string;
  carbon_density_tco2e_per_hectare: string;
  fire_risk_level: string;
  boundary_validation_status: string;
  layers: GisLayer[];
  evidence_sources: string[];
  findings: string[];
  recommendation: string;
  generated_at: string;
};

export type AiReview = {
  project_id: string;
  review_type: string;
  model_version: string;
  prompt_version: string;
  confidence_score: string;
  risk_level: string;
  findings: string[];
  required_actions: string[];
  recommendation: string;
  generated_at: string;
};

export type GisEvidencePayload = {
  boundary_geojson: string;
  satellite_scene_id: string;
  land_cover_source: string;
  fire_alert_source: string;
  field_mrv_reference: string;
  verifier_notes: string;
};

export type EvidenceRecord = {
  id: string;
  evidence_type: string;
  status: string;
  submitted_by: string | null;
  submitted_role: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ValidationDecision = {
  project_id: string;
  validation_type: string;
  status: string;
  notes: string;
  validated_by: string | null;
  generated_at: string;
};

export type VerificationCase = {
  verification_id: string;
  project_id: string;
  status: string;
  assigned_verifier: string;
  monitoring_period_start: string;
  monitoring_period_end: string;
  evidence_complete: boolean;
  automatic_validation_status: string;
  ai_status: string;
  gis_status: string;
  mrv_status: string;
  verifier_status: string;
  zicma_status: string;
  integrity_score: string | null;
  risk_score: string | null;
  confidence_score: string | null;
  outstanding_actions: string[];
  created_at: string;
  updated_at: string;
};

export type VerificationFile = {
  file_name: string;
  category:
    | "boundary"
    | "monitoring_report"
    | "carbon_calculation"
    | "biomass_inventory"
    | "satellite_imagery"
    | "field_photo"
    | "inspection_form"
    | "drone_imagery"
    | "verifier_statement"
    | "accreditation_certificate"
    | "digital_signature";
  mime_type: string;
  file_size_bytes: number;
  capture_date?: string;
  digital_signature: string;
};

export type VerificationAssessment = {
  verification_id: string;
  stage: string;
  status: string;
  integrity_score: string | null;
  risk_score: string | null;
  confidence_score: string | null;
  findings: string[];
  required_actions: string[];
  generated_at: string;
};

export type VerificationDecisionResult = {
  verification_id: string;
  stage: string;
  status: string;
  comments: string;
  digital_signature: string;
  generated_at: string;
};

export type VerificationUploadFile = {
  file: File;
  category: VerificationFile["category"];
  digital_signature: string;
};

export type VerificationCaseAction =
  | "save_draft"
  | "request_more_information"
  | "export_verification_report"
  | "digitally_sign";

export type RegisterCarbonProjectPayload = {
  project_code: string;
  title: string;
  description: string;
  methodology: string;
  proponent_organization_id: string;
  district: string;
  province: string;
  estimated_annual_tco2e: string;
  start_date: string;
  crediting_period_years: number;
};

export type WorkflowAction = "submit_for_verification" | "start_verification" | "approve" | "reject" | "suspend";

export type NationalStage = {
  stage: number;
  name: string;
  status: string;
  maturity_score: number;
  objective: string;
  required_capabilities: string[];
  current_gaps: string[];
  next_controls: string[];
};

export type NationalReadiness = {
  platform: string;
  jurisdiction: string;
  maturity_score: number;
  deployment_position: string;
  generated_at: string;
  stages: NationalStage[];
};

export type NationalOperationRecord = {
  id: string;
  operation_type: string;
  status: string;
  title: string;
  stage: number;
  owner: string;
  controls: string[];
  metadata: Record<string, unknown>;
  created_at: string;
};

export type NationalOperations = {
  generated_at: string;
  stage_completion: Array<{
    stage: number;
    name: string;
    required_controls: string[];
    completed_controls: number;
    completion_percent: number;
    status: string;
  }>;
  registry_accounts: NationalOperationRecord[];
  methodologies: NationalOperationRecord[];
  accreditations: NationalOperationRecord[];
  article6_authorizations: NationalOperationRecord[];
  marketplace_controls: NationalOperationRecord[];
  compliance_cases: NationalOperationRecord[];
  accounting_snapshots: NationalOperationRecord[];
  stage_decisions: NationalOperationRecord[];
  audit_timeline: NationalOperationRecord[];
};

export type NationalActionResult = {
  id: string;
  status: string;
  message: string;
  generated_at: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8082";

export async function fetchGatewayHealth(): Promise<{ status: string; service: string }> {
  const response = await fetch(`${apiBaseUrl}/health`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Gateway health check failed with ${response.status}`);
  }
  return response.json();
}

export async function listCarbonProjects(): Promise<CarbonProject[]> {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Project list failed with ${response.status}`);
  }
  return response.json();
}

export async function getNationalReadiness(): Promise<NationalReadiness> {
  const response = await fetch(`${apiBaseUrl}/api/v1/national-readiness`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`National readiness load failed with ${response.status}`);
  }
  return response.json();
}

export async function getNationalOperations(): Promise<NationalOperations> {
  const response = await fetch(`${apiBaseUrl}/api/v1/national-operations`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`National operations load failed with ${response.status}`);
  }
  return response.json();
}

async function postNationalOperation(path: string, payload: Record<string, unknown>): Promise<NationalActionResult> {
  const response = await fetch(`${apiBaseUrl}/api/v1/national-operations${path}`, {
    method: "POST",
    headers: actorHeaders(),
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `National operation failed with ${response.status}`);
  }
  return response.json();
}

export function openRegistryAccount() {
  return postNationalOperation("/accounts/open", {
    organization_name: "Kariba Forest Carbon Programme Ltd",
    account_type: "project_developer",
    kyb_reference: "ZIM-KYB-2026-0001",
    beneficial_owner_checked: true
  });
}

export function approveNationalMethodology() {
  return postNationalOperation("/methodologies/approve", {
    code: "ZAI-ARR-001",
    name: "Zimbabwe Afforestation, Reforestation and Revegetation",
    standard: "National Carbon Standard aligned to Verra VM0047",
    version: "1.0",
    eligibility_rules: ["Zimbabwe land tenure evidence required", "No overlap with protected areas", "MRV plots required"]
  });
}

export function grantVerifierAccreditation() {
  return postNationalOperation("/accreditations/grant", {
    verifier_name: "Zimbabwe Accredited Verification Pool",
    scope: "AFOLU, ARR, REDD+ and improved forest management",
    valid_until: "2027-12-31",
    conflict_screening_reference: "COI-SCREEN-2026-001"
  });
}

export function authorizeArticle6Transfer(projectCode: string) {
  return postNationalOperation("/article6/authorize", {
    project_code: projectCode,
    buyer_country: "Singapore",
    ndc_sector: "AFOLU",
    authorized_volume_tco2e: 25000,
    corresponding_adjustment_required: true
  });
}

export function createMarketplaceListingControl(projectCode: string) {
  return postNationalOperation("/marketplace/list", {
    project_code: projectCode,
    vintage_year: 2026,
    volume_tco2e: 10000,
    floor_price_usd: 8.5,
    claims_control: "Buyer claims limited to retired units with public certificate"
  });
}

export function openComplianceCase() {
  return postNationalOperation("/compliance/cases", {
    subject: "Duplicate boundary and inflated yield surveillance case",
    risk_type: "fraud_screening",
    severity: "high",
    allegation: "Automated controls flagged possible overlap and inconsistent estimated annual tCO2e."
  });
}

export function createAccountingSnapshot() {
  return postNationalOperation("/reporting/snapshots", {
    reporting_period: "2026",
    ndc_sector: "AFOLU",
    issued_tco2e: 50000,
    retired_tco2e: 12500,
    authorized_itmo_tco2e: 25000
  });
}

export function recordStageDecision(stage: number) {
  return postNationalOperation("/stages/decision", {
    stage,
    decision: "control_passed",
    notes: `Stage ${stage} minimum operating controls reviewed and marked ready for controlled pilot progression.`
  });
}

export async function registerCarbonProject(payload: RegisterCarbonProjectPayload): Promise<CarbonProject> {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects`, {
    method: "POST",
    headers: actorHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Project registration failed with ${response.status}`);
  }

  return response.json();
}

export async function advanceProjectWorkflow(
  projectId: string,
  action: WorkflowAction,
  reason: string
): Promise<CarbonProject> {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/workflow`, {
    method: "PATCH",
    headers: actorHeaders(),
    body: JSON.stringify({ action, reason })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Workflow action failed with ${response.status}`);
  }

  return response.json();
}

export async function issueCreditBatch(
  projectId: string,
  payload: { vintage_year: number; quantity_tco2e: string }
): Promise<CreditBatch> {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/credits`, {
    method: "POST",
    headers: actorHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Credit issuance failed with ${response.status}`);
  }

  return response.json();
}

export async function listCreditBatches(projectId: string): Promise<CreditBatch[]> {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/credits`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Credit batch list failed with ${response.status}`);
  }
  return response.json();
}

export async function listAuditEvents(projectId: string): Promise<AuditEvent[]> {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/audit-events`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Audit event list failed with ${response.status}`);
  }
  const events = (await response.json()) as RawAuditEvent[];
  return events.map((event) => ({
    ...event,
    metadata: event.metadata ?? event.metadata_ ?? {}
  }));
}

export async function runGisAssessment(projectId: string): Promise<GisAssessment> {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/gis-assessment`, {
    method: "POST",
    headers: actorHeaders(),
    body: "{}"
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `GIS assessment failed with ${response.status}`);
  }

  return response.json();
}

export async function runAiReview(projectId: string): Promise<AiReview> {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/ai-review`, {
    method: "POST",
    headers: actorHeaders(),
    body: "{}"
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `AI review failed with ${response.status}`);
  }

  return response.json();
}

export async function submitGisEvidence(projectId: string, payload: GisEvidencePayload): Promise<EvidenceRecord> {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/gis-evidence`, {
    method: "POST",
    headers: actorHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `GIS evidence submission failed with ${response.status}`);
  }

  return response.json();
}

export async function listEvidence(projectId: string): Promise<EvidenceRecord[]> {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/evidence`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Evidence list failed with ${response.status}`);
  }
  return response.json();
}

export async function validateGisEvidence(
  projectId: string,
  payload: { decision: "valid" | "invalid" | "requires_revision"; notes: string }
): Promise<ValidationDecision> {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/gis-validation`, {
    method: "POST",
    headers: actorHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `GIS validation failed with ${response.status}`);
  }

  return response.json();
}

export async function validateAiReview(
  projectId: string,
  payload: { decision: "valid" | "invalid" | "requires_revision"; notes: string }
): Promise<ValidationDecision> {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/ai-validation`, {
    method: "POST",
    headers: actorHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `AI validation failed with ${response.status}`);
  }

  return response.json();
}

export async function getVerificationCase(projectId: string): Promise<VerificationCase | null> {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/verification`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Verification case load failed with ${response.status}`);
  }
  return response.json();
}

export async function startVerificationCase(projectId: string): Promise<VerificationCase> {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/verification/start`, {
    method: "POST",
    headers: actorHeaders(),
    body: JSON.stringify({
      monitoring_period_start: "2026-01-01",
      monitoring_period_end: "2026-12-31",
      assigned_verifier: "Zimbabwe Accredited Verifier Pool"
    })
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Verification start failed with ${response.status}`);
  }
  return response.json();
}

export async function uploadVerificationEvidencePackage(projectId: string, files: VerificationFile[]) {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/verification/evidence-package`, {
    method: "POST",
    headers: actorHeaders(),
    body: JSON.stringify({
      files,
      package_notes: "Complete verification evidence package submitted through the ZAI-CTS portal."
    })
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Verification evidence upload failed with ${response.status}`);
  }
  return response.json();
}

export async function uploadVerificationEvidenceFiles(projectId: string, uploads: VerificationUploadFile[]) {
  const formData = new FormData();
  formData.append("package_notes", "Complete verification evidence package uploaded through the ZAI-CTS portal.");
  for (const upload of uploads) {
    formData.append("files", upload.file);
    formData.append("categories", upload.category);
    formData.append("digital_signatures", upload.digital_signature);
  }

  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/verification/evidence-files`, {
    method: "POST",
    headers: actorIdentityHeaders(),
    body: formData
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Verification file upload failed with ${response.status}`);
  }
  return response.json();
}

export async function runAutomaticVerification(projectId: string): Promise<VerificationAssessment> {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/verification/automatic-validation`, {
    method: "POST",
    headers: actorHeaders(),
    body: "{}"
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Automatic validation failed with ${response.status}`);
  }
  return response.json();
}

export async function runVerificationAiAssessment(projectId: string): Promise<VerificationAssessment> {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/verification/ai-assessment`, {
    method: "POST",
    headers: actorHeaders(),
    body: "{}"
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Verification AI assessment failed with ${response.status}`);
  }
  return response.json();
}

export async function decideVerificationStage(
  projectId: string,
  stage: "gis" | "mrv" | "verifier" | "zicma",
  decision: "pass" | "warning" | "fail" | "approve" | "reject" | "request_more_information" | "return_for_revision",
  comments: string
): Promise<VerificationDecisionResult> {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/verification/${stage}-decision`, {
    method: "POST",
    headers: actorHeaders(),
    body: JSON.stringify({
      decision,
      comments,
      digital_signature: `SIG-${stage.toUpperCase()}-${crypto.randomUUID()}`
    })
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Verification ${stage} decision failed with ${response.status}`);
  }
  return response.json();
}

export async function recordVerificationCaseAction(projectId: string, action: VerificationCaseAction, notes: string) {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/verification/actions`, {
    method: "POST",
    headers: actorHeaders(),
    body: JSON.stringify({ action, notes })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Verification case action failed with ${response.status}`);
  }

  return response.json();
}

function actorHeaders() {
  return {
    "content-type": "application/json",
    ...actorIdentityHeaders()
  };
}

function actorIdentityHeaders() {
  return {
    "x-actor-id": "11111111-1111-4111-8111-111111111111",
    "x-actor-role": "regulator.approver",
    "x-correlation-id": crypto.randomUUID()
  };
}
