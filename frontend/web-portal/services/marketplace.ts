/**
 * Marketplace Service API Client
 * Module B: Smart Marketplace & Pricing
 */

import { authenticatedFetch as fetch, getGatewayBaseUrl } from "../lib/apiClient";

const MARKETPLACE_API_BASE_URL = getGatewayBaseUrl();

// ===== Types =====

export interface PricePoint {
  credit_type: "authorized" | "non_authorized";
  vintage_year: number;
  project_type: string;
  price_usd: number;
  factors: {
    base_price: number;
    vintage_factor: number;
    demand_factor: number;
    ndc_factor: number;
    authorization_premium: number;
  };
  confidence: number;
}

export interface CreditListing {
  listing_id: string;
  project_id: string;
  project_name: string;
  seller_id: string;
  vintage_year: number;
  quantity_tco2e: number;
  credit_type: "authorized" | "non_authorized";
  project_type: string;
  price_per_tco2e: number;
  authorization_status: string;
  scope: string;
  listed_at: string;
}

export interface MatchResult {
  match_id: string;
  listing_id: string;
  project_name: string;
  host_country: string;
  compatibility_score: number;
  ndc_alignment_score: number;
  scope_match: boolean;
  price_per_tco2e: number;
  quantity_available: number;
  authorization_status: string;
  recommendation: string;
}

export interface TradeResult {
  trade_id: string;
  status: string;
  transaction_hash?: string;
  settlement_date: string;
  total_value: number;
}

// ===== Pricing API =====

export async function getCurrentPricing(
  creditType?: string,
  vintageYear?: number
): Promise<{ timestamp: string; prices: PricePoint[] }> {
  const params = new URLSearchParams();
  if (creditType) params.append("credit_type", creditType);
  if (vintageYear) params.append("vintage_year", vintageYear.toString());

  const response = await fetch(
    `${MARKETPLACE_API_BASE_URL}/api/v1/marketplace/pricing/current?${params}`,
    { cache: "no-store" }
  );
  return response.json();
}

export async function calculatePrice(
  projectId: string,
  quantity: number,
  vintageYear: number,
  creditType: string,
  projectType?: string
): Promise<{
  calculated_price_usd: number;
  price_per_tco2e: number;
  total_value: number;
  factors: any;
  recommended_listing_price: number;
}> {
  const response = await fetch(
    `${MARKETPLACE_API_BASE_URL}/api/v1/marketplace/pricing/calculate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        quantity,
        vintage_year: vintageYear,
        credit_type: creditType,
        project_type: projectType,
      }),
    }
  );
  return response.json();
}

// ===== Listings API =====

export async function getListings(): Promise<{
  listings: CreditListing[];
  total: number;
}> {
  const response = await fetch(
    `${MARKETPLACE_API_BASE_URL}/api/v1/marketplace/listings`,
    { cache: "no-store" }
  );
  return response.json();
}

// ===== Matching API =====

export async function findMatches(
  buyerId: string,
  buyerCountry: string,
  ndcTarget: {
    target_type: "scope_1" | "scope_2" | "scope_3";
    sector?: string;
    quantity_needed?: number;
  },
  budgetRange?: { min: number; max: number },
  authorizationRequired?: boolean
): Promise<{
  matches: MatchResult[];
  total_available: number;
  best_match: MatchResult | null;
}> {
  const response = await fetch(
    `${MARKETPLACE_API_BASE_URL}/api/v1/marketplace/matching/find`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyer_id: buyerId,
        buyer_country: buyerCountry,
        ndc_target: ndcTarget,
        budget_range: budgetRange,
        authorization_required: authorizationRequired,
      }),
    }
  );
  return response.json();
}

// ===== Trading API =====

export async function executeTrade(
  listingId: string,
  buyerId: string,
  quantity: number,
  priceAgreed: number
): Promise<TradeResult> {
  const response = await fetch(
    `${MARKETPLACE_API_BASE_URL}/api/v1/marketplace/trades`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listing_id: listingId,
        buyer_id: buyerId,
        quantity,
        price_agreed: priceAgreed,
      }),
    }
  );
  return response.json();
}

// ===== Health Check =====

export async function checkMarketplaceHealth(): Promise<{
  status: string;
  service: string;
}> {
  const response = await fetch(`${MARKETPLACE_API_BASE_URL}/api/v1/marketplace/health`, {
    cache: "no-store",
  });
  return response.json();
}
