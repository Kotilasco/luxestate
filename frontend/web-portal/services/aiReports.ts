import axios from "axios";
import { getGatewayBaseUrl } from "../lib/apiClient";

const API_BASE_URL = getGatewayBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("zai-cts-session");
    if (stored) {
      const session = JSON.parse(stored) as { access_token?: string };
      if (session.access_token) config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  }
  return config;
});

// Natural Language Report Generation
export interface GenerateReportRequest {
  report_type: string;
  data: Record<string, any>;
  audience?: string;
  language?: string;
}

export interface GenerateReportResponse {
  report: string;
  report_type: string;
  audience: string;
  generated_at: string;
  word_count: number;
  mock?: boolean;
}

export async function generateNaturalLanguageReport(
  request: GenerateReportRequest
): Promise<GenerateReportResponse> {
  const response = await api.post("/api/v1/ai/reports/generate", request);
  return response.data;
}

// Marketing Analysis
export interface MarketingAnalysisRequest {
  project_data: Record<string, any>;
  target_market: string;
  competitor_analysis?: boolean;
}

export interface MarketingAnalysisResponse {
  analysis: string;
  project_id?: string;
  target_market: string;
  generated_at: string;
  mock?: boolean;
}

export async function generateMarketingAnalysis(
  request: MarketingAnalysisRequest
): Promise<MarketingAnalysisResponse> {
  const response = await api.post("/api/v1/ai/reports/marketing-analysis", request);
  return response.data;
}

// Buyer Sentiment Analysis
export interface BuyerSentimentRequest {
  market_data: Record<string, any>;
  buyer_feedback: string[];
}

export interface BuyerSentimentResponse {
  sentiment_analysis: string;
  feedback_count: number;
  generated_at: string;
  mock?: boolean;
}

export async function analyzeBuyerSentiment(
  request: BuyerSentimentRequest
): Promise<BuyerSentimentResponse> {
  const response = await api.post("/api/v1/ai/reports/sentiment-analysis", request);
  return response.data;
}

// Project Story Generation
export interface ProjectStoryRequest {
  project_data: Record<string, any>;
  story_type?: string;
  format?: string;
}

export interface ProjectStoryResponse {
  story: string;
  project_id?: string;
  story_type: string;
  format: string;
  generated_at: string;
  mock?: boolean;
}

export async function generateProjectStory(
  request: ProjectStoryRequest
): Promise<ProjectStoryResponse> {
  const response = await api.post("/api/v1/ai/reports/project-story", request);
  return response.data;
}

// Natural Language Query
export interface NaturalLanguageQueryRequest {
  query: string;
  context?: Record<string, any>;
  user_role?: string;
}

export interface NaturalLanguageQueryResponse {
  answer: string;
  query: string;
  user_role: string;
  generated_at: string;
  mock?: boolean;
}

export async function answerNaturalLanguageQuery(
  request: NaturalLanguageQueryRequest
): Promise<NaturalLanguageQueryResponse> {
  const response = await api.post("/api/v1/ai/reports/query", request);
  return response.data;
}

// Health Check
export async function getAIReportsHealth() {
  const response = await api.get("/api/v1/ai/reports/health");
  return response.data;
}

export default {
  generateNaturalLanguageReport,
  generateMarketingAnalysis,
  analyzeBuyerSentiment,
  generateProjectStory,
  answerNaturalLanguageQuery,
  getAIReportsHealth,
};
