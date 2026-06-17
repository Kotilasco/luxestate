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
    headers: {
      "content-type": "application/json",
      "x-actor-id": crypto.randomUUID(),
      "x-actor-role": "regulator.approver",
      "x-correlation-id": crypto.randomUUID()
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Project registration failed with ${response.status}`);
  }

  return response.json();
}
