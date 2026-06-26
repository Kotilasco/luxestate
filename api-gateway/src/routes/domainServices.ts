import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { request } from "undici";

import { config } from "../config.js";

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function forwardedHeaders(incoming: FastifyRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const name of ["authorization", "content-type", "x-correlation-id"]) {
    const value = headerValue(incoming.headers[name]);
    if (value) headers[name] = value;
  }
  return headers;
}

async function requireValidSession(incoming: FastifyRequest, reply: FastifyReply): Promise<boolean> {
  const authorization = headerValue(incoming.headers.authorization);
  if (!authorization) {
    reply.code(401).send({ detail: "Authentication required" });
    return false;
  }

  const validation = await request(new URL("/api/v1/auth/me", config.CARBON_REGISTRY_URL), {
    method: "GET",
    headers: { authorization }
  });
  if (validation.statusCode !== 200) {
    reply.code(401).send({ detail: "Session is invalid or expired" });
    return false;
  }
  await validation.body.text();
  return true;
}

async function proxy(
  incoming: FastifyRequest,
  reply: FastifyReply,
  baseUrl: string,
  upstreamPath: string
) {
  if (!(await requireValidSession(incoming, reply))) return;

  const url = new URL(upstreamPath, baseUrl);
  const query = incoming.query as Record<string, string>;
  for (const [key, value] of Object.entries(query ?? {})) url.searchParams.set(key, String(value));

  const contentType = headerValue(incoming.headers["content-type"]);
  const body = ["GET", "HEAD"].includes(incoming.method)
    ? undefined
    : contentType?.startsWith("multipart/form-data")
      ? (incoming.body as Buffer)
      : JSON.stringify(incoming.body ?? {});

  const upstream = await request(url, {
    method: incoming.method,
    headers: forwardedHeaders(incoming),
    body
  });
  reply.code(upstream.statusCode);
  reply.headers(upstream.headers);
  return upstream.body.json();
}

export async function domainServiceRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/v1/ai/health", (incoming, reply) =>
    proxy(incoming, reply, config.AI_VALIDATION_URL, "/health")
  );
  app.get("/api/v1/gis/health", (incoming, reply) =>
    proxy(incoming, reply, config.GIS_SERVICE_URL, "/health")
  );
  app.get("/api/v1/marketplace/health", (incoming, reply) =>
    proxy(incoming, reply, config.MARKETPLACE_URL, "/health")
  );
  app.get("/api/v1/compliance/health", (incoming, reply) =>
    proxy(incoming, reply, config.COMPLIANCE_URL, "/health")
  );

  app.all("/api/v1/ai/*", async (incoming, reply) => {
    const params = incoming.params as { "*": string };
    return proxy(incoming, reply, config.AI_VALIDATION_URL, `/api/v1/ai/${params["*"]}`);
  });

  app.all("/api/v1/gis/*", async (incoming, reply) => {
    const params = incoming.params as { "*": string };
    return proxy(incoming, reply, config.GIS_SERVICE_URL, `/${params["*"]}`);
  });

  app.all("/api/v1/marketplace/*", async (incoming, reply) => {
    const params = incoming.params as { "*": string };
    return proxy(incoming, reply, config.MARKETPLACE_URL, `/api/v1/marketplace/${params["*"]}`);
  });

  app.all("/api/v1/compliance/*", async (incoming, reply) => {
    const params = incoming.params as { "*": string };
    return proxy(incoming, reply, config.COMPLIANCE_URL, `/api/v1/compliance/${params["*"]}`);
  });
}
