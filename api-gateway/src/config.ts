import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(8082),
  CARBON_REGISTRY_URL: z.string().url().default("http://127.0.0.1:8102"),
  AI_VALIDATION_URL: z.string().url().default("http://127.0.0.1:8103"),
  GIS_SERVICE_URL: z.string().url().default("http://127.0.0.1:8104"),
  MARKETPLACE_URL: z.string().url().default("http://127.0.0.1:8106"),
  COMPLIANCE_URL: z.string().url().default("http://127.0.0.1:8107")
});

export const config = schema.parse(process.env);
