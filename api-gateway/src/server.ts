import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";

import { config } from "./config.js";
import { registerCorrelation } from "./middleware/correlation.js";
import { carbonRegistryRoutes } from "./routes/carbonRegistry.js";
import { healthRoutes } from "./routes/health.js";

export async function buildServer() {
  const app = Fastify({
    logger: true,
    bodyLimit: 1048576
  });

  await app.register(helmet);
  await app.register(cors, { origin: true, credentials: true });
  await app.register(rateLimit, { max: 300, timeWindow: "1 minute" });
  await app.register(registerCorrelation);
  await app.register(healthRoutes);
  await app.register(carbonRegistryRoutes);

  return app;
}

const app = await buildServer();
await app.listen({ port: config.PORT, host: "0.0.0.0" });
