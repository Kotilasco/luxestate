/**
 * AI Validation Service API Client
 * Module A: AI-Powered Project Validation & MRV
 */

import { authenticatedFetch as fetch, getGatewayBaseUrl } from "../lib/apiClient";

const AI_API_BASE_URL = getGatewayBaseUrl();

// ===== Types =====

export interface ProjectLocation {
  district: string;
  province: string;
  coordinates?: [number, number];
}

export interface PDDDrafSection {
  title: string;
  content: string;
  si48_compliance_score: number;
  missing_elements: string[];
}

export interface MethodologyMatch {
  methodology_id: string;
  name: string;
  relevance_score: number;
  applicability_conditions: string[];
}

export interface AIResultMetadata {
  confidence_score: number;
  explanation: string;
  evidence_references: string[];
  model_version: string;
  prompt_version: string;
  audit_event_id: string;
}

export interface PDDDrafResponse {
  draft_id: string;
  project_id: string;
  structured_sections: Record<string, PDDDrafSection>;
  methodology_suggestions: MethodologyMatch[];
  compliance_score: number;
  missing_fields: string[];
  suggested_improvements: string[];
  metadata: AIResultMetadata;
}

export interface AdditionalityResponse {
  assessment_id: string;
  project_id: string;
  overall_score: number;
  conclusion: "additional" | "not_additional" | "inconclusive";
  confidence: number;
  reasoning_summary: string;
  metadata: AIResultMetadata;
}

export interface RemoteSensingJob {
  analysis_id: string;
  project_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  estimated_completion?: string;
  message?: string;
}

export interface RemoteSensingResults {
  analysis_id: string;
  project_area_km2: number;
  forest_cover_percent: number;
  carbon_stock_tco2e: number;
  biomass_density_mg_per_ha: number;
  historical_readings: {
    date: string;
    forest_cover_percent: number;
    carbon_stock_tco2e: number;
    biomass_density_mg_per_ha: number;
    data_quality_score: number;
  }[];
  anomalies: {
    anomaly_id: string;
    anomaly_type: string;
    severity: "critical" | "high" | "medium" | "low";
    detected_date: string;
    area_affected_ha: number;
    confidence: number;
    description: string;
  }[];
  satellite_sources_used: string[];
  metadata: AIResultMetadata;
}

// ===== PDD Co-Pilot API =====

export async function generatePDDDraft(
  projectId: string,
  description: string,
  projectType: string,
  location?: ProjectLocation
): Promise<PDDDrafResponse> {
  const response = await fetch(`${AI_API_BASE_URL}/api/v1/ai/pdd/draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project_id: projectId,
      description,
      project_type: projectType,
      location,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to generate PDD draft");
  }

  return response.json();
}

export async function suggestMethodologies(
  projectType: string,
  description: string,
  location?: ProjectLocation
): Promise<{ suggestions: MethodologyMatch[]; metadata: AIResultMetadata }> {
  const response = await fetch(`${AI_API_BASE_URL}/api/v1/ai/pdd/suggest-method`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project_type: projectType,
      description,
      location,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to suggest methodologies");
  }

  return response.json();
}

export async function getPDDTemplates(): Promise<{ templates: any[] }> {
  const response = await fetch(`${AI_API_BASE_URL}/api/v1/ai/pdd/templates`);
  return response.json();
}

// ===== Additionality Checker API =====

export async function analyzeAdditionality(
  projectId: string,
  projectDescription: string,
  projectType: string,
  location?: ProjectLocation,
  barriers?: string[]
): Promise<AdditionalityResponse> {
  const response = await fetch(`${AI_API_BASE_URL}/api/v1/ai/additionality/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project_id: projectId,
      project_description: projectDescription,
      project_type: projectType,
      location,
      barriers,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to analyze additionality");
  }

  return response.json();
}

// ===== Remote Sensing API =====

export async function startRemoteSensingAnalysis(
  projectId: string,
  boundaryGeoJSON: any,
  analysisTypes: string[]
): Promise<RemoteSensingJob> {
  const response = await fetch(`${AI_API_BASE_URL}/api/v1/ai/remote-sensing/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project_id: projectId,
      boundary_geojson: boundaryGeoJSON,
      analysis_types: analysisTypes,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to start analysis");
  }

  return response.json();
}

export async function getRemoteSensingStatus(
  analysisId: string
): Promise<RemoteSensingJob | RemoteSensingResults> {
  const response = await fetch(
    `${AI_API_BASE_URL}/api/v1/ai/remote-sensing/status/${analysisId}`
  );
  return response.json();
}

export async function getCarbonForecast(
  analysisId: string,
  years: number = 5
): Promise<any> {
  const response = await fetch(
    `${AI_API_BASE_URL}/api/v1/ai/remote-sensing/forecast/${analysisId}?years=${years}`
  );
  return response.json();
}

// ===== Health Check =====

export async function checkAIHealth(): Promise<{ status: string; service: string }> {
  const response = await fetch(`${AI_API_BASE_URL}/api/v1/ai/health`, { cache: "no-store" });
  return response.json();
}
