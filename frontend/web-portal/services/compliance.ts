/**
 * Compliance Service API Client
 * Module C: Regulatory Compliance & Double Counting Prevention
 */

import { authenticatedFetch as fetch, getGatewayBaseUrl } from "../lib/apiClient";

const COMPLIANCE_API_BASE_URL = getGatewayBaseUrl();

// ===== Types =====

export interface SerializationResponse {
  serial_numbers: string[];
  blockchain_tx_hash: string;
}

export interface RetirementResponse {
  retirement_id: string;
  status: string;
  blockchain_confirmation: string;
  zcr_retirement_id: string;
  un_file_url: string;
}

export interface RetirementStatus {
  serial_number: string;
  status: "active" | "retired" | "transferred";
  retirement_date?: string;
  owner?: string;
  blockchain_proof?: string;
}

export interface UNReportingFile {
  transaction_id: string;
  file_format: string;
  download_url: string;
  file_content: {
    reporting_entity: string;
    transaction_type: string;
    serial_numbers: string[];
    total_quantity_tco2e: number;
    corresponding_adjustment: boolean;
    buyer_country: string;
    transaction_date: string;
    authorization_status: string;
  };
}

export interface AuthorizationApplicationResponse {
  application_id: string;
  status: string;
  submitted_at: string;
  estimated_review_days: number;
}

export interface AuthorizationStatus {
  application_id: string;
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "transferred";
  loa_issued: boolean;
  loa_issue_date?: string;
  authorized_quantity: number;
  paris_registry_id?: string;
  expiry_date?: string;
}

export interface LOADocument {
  application_id: string;
  loa_number: string;
  document_url: string;
  issued_by: string;
  issued_date: string;
  valid_until: string;
}

// ===== Serialization & Retirement API =====

export async function serializeCredits(
  projectId: string,
  quantity: number,
  vintageYear: number
): Promise<SerializationResponse> {
  const response = await fetch(
    `${COMPLIANCE_API_BASE_URL}/api/v1/compliance/retirement/serialize`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        quantity,
        vintage_year: vintageYear,
      }),
    }
  );
  return response.json();
}

export async function retireCredits(
  serialNumbers: string[],
  buyerId: string,
  purpose: "ndc_compliance" | "voluntary" | "corsia",
  correspondingAdjustment: boolean = true
): Promise<RetirementResponse> {
  const response = await fetch(
    `${COMPLIANCE_API_BASE_URL}/api/v1/compliance/retirement/retire`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serial_numbers: serialNumbers,
        buyer_id: buyerId,
        purpose,
        corresponding_adjustment: correspondingAdjustment,
      }),
    }
  );
  return response.json();
}

export async function getRetirementStatus(serialNumber: string): Promise<RetirementStatus> {
  const response = await fetch(
    `${COMPLIANCE_API_BASE_URL}/api/v1/compliance/retirement/status/${serialNumber}`,
    { cache: "no-store" }
  );
  return response.json();
}

export async function getUNFile(transactionId: string): Promise<UNReportingFile> {
  const response = await fetch(
    `${COMPLIANCE_API_BASE_URL}/api/v1/compliance/retirement/un-file/${transactionId}`,
    { cache: "no-store" }
  );
  return response.json();
}

// ===== Authorization Workflow API =====

export async function applyForAuthorization(
  projectId: string,
  applicantId: string,
  quantityRequested: number,
  intendedBuyerCountry: string,
  authorizationPurpose: string,
  supportingDocuments: string[] = []
): Promise<AuthorizationApplicationResponse> {
  const response = await fetch(
    `${COMPLIANCE_API_BASE_URL}/api/v1/compliance/authorization/apply`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        applicant_id: applicantId,
        quantity_requested: quantityRequested,
        intended_buyer_country: intendedBuyerCountry,
        authorization_purpose: authorizationPurpose,
        supporting_documents: supportingDocuments,
      }),
    }
  );
  return response.json();
}

export async function getAuthorizationStatus(applicationId: string): Promise<AuthorizationStatus> {
  const response = await fetch(
    `${COMPLIANCE_API_BASE_URL}/api/v1/compliance/authorization/status/${applicationId}`,
    { cache: "no-store" }
  );
  return response.json();
}

export async function getLOADocument(applicationId: string): Promise<LOADocument> {
  const response = await fetch(
    `${COMPLIANCE_API_BASE_URL}/api/v1/compliance/authorization/loa/${applicationId}`,
    { cache: "no-store" }
  );
  return response.json();
}

export async function zicmaApproveApplication(
  applicationId: string,
  decision: "approve" | "reject" | "request_info",
  authorizedQuantity: number,
  conditions: string[],
  reviewerNotes: string
): Promise<AuthorizationStatus> {
  const response = await fetch(
    `${COMPLIANCE_API_BASE_URL}/api/v1/compliance/authorization/zicma/approve`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        application_id: applicationId,
        decision,
        authorized_quantity: authorizedQuantity,
        conditions,
        reviewer_notes: reviewerNotes,
      }),
    }
  );
  return response.json();
}

export async function parisSync(): Promise<{
  last_sync: string;
  paris_registry_status: string;
  itmos_issued: number;
  itmos_transferred: number;
  sync_status: string;
}> {
  const response = await fetch(
    `${COMPLIANCE_API_BASE_URL}/api/v1/compliance/authorization/paris-sync`,
    { cache: "no-store" }
  );
  return response.json();
}

// ===== Health Check =====

export async function checkComplianceHealth(): Promise<{
  status: string;
  service: string;
}> {
  const response = await fetch(`${COMPLIANCE_API_BASE_URL}/api/v1/compliance/health`, {
    cache: "no-store",
  });
  return response.json();
}
