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
  return response.json();
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

function actorHeaders() {
  return {
    "content-type": "application/json",
    "x-actor-id": "11111111-1111-4111-8111-111111111111",
    "x-actor-role": "regulator.approver",
    "x-correlation-id": crypto.randomUUID()
  };
}
