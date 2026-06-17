import type { FastifyInstance } from "fastify";
import { request } from "undici";

import { config } from "../config.js";

export async function carbonRegistryRoutes(app: FastifyInstance): Promise<void> {
  app.all("/api/v1/projects", async (incoming, reply) => {
    const url = new URL("/api/v1/projects", config.CARBON_REGISTRY_URL);
    if (incoming.query && Object.keys(incoming.query as object).length > 0) {
      for (const [key, value] of Object.entries(incoming.query as Record<string, string>)) {
        url.searchParams.set(key, value);
      }
    }

    const upstream = await request(url, {
      method: incoming.method,
      headers: {
        "content-type": "application/json",
        "x-correlation-id": incoming.headers["x-correlation-id"]?.toString() ?? "",
        "x-actor-id": incoming.headers["x-actor-id"]?.toString() ?? "",
        "x-actor-role": incoming.headers["x-actor-role"]?.toString() ?? ""
      },
      body: incoming.body ? JSON.stringify(incoming.body) : undefined
    });

    reply.statusCode = upstream.statusCode;
    reply.headers(upstream.headers);
    return upstream.body.json();
  });

  app.get("/api/v1/projects/:projectId", async (incoming, reply) => {
    const params = incoming.params as { projectId: string };
    const url = new URL(`/api/v1/projects/${params.projectId}`, config.CARBON_REGISTRY_URL);

    const upstream = await request(url, {
      method: "GET",
      headers: {
        "x-correlation-id": incoming.headers["x-correlation-id"]?.toString() ?? "",
        "x-actor-id": incoming.headers["x-actor-id"]?.toString() ?? "",
        "x-actor-role": incoming.headers["x-actor-role"]?.toString() ?? ""
      }
    });

    reply.statusCode = upstream.statusCode;
    reply.headers(upstream.headers);
    return upstream.body.json();
  });
}
