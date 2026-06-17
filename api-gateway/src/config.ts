import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(8080),
  CARBON_REGISTRY_URL: z.string().url().default("http://localhost:8101")
});

export const config = schema.parse(process.env);
