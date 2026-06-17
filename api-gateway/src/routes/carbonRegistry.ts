import type { FastifyInstance } from "fastify";
import { request } from "undici";

import { config } from "../config.js";

function forwardHeaders(incomingHeaders: Record<string, string | string[] | undefined>) {
  const headers: Record<string, string> = {};
  for (const name of ["x-correlation-id", "x-actor-id", "x-actor-role"]) {
    const value = incomingHeaders[name];
    const normalized = Array.isArray(value) ? value[0] : value;
    if (normalized && normalized.trim().length > 0) {
      headers[name] = normalized;
    }
  }
  return headers;
}

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
        ...forwardHeaders(incoming.headers)
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
      headers: forwardHeaders(incoming.headers)
    });

    reply.statusCode = upstream.statusCode;
    reply.headers(upstream.headers);
    return upstream.body.json();
  });
}
