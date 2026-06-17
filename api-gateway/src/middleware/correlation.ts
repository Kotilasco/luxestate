import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";

export async function registerCorrelation(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", async (request, reply) => {
    const correlationId = request.headers["x-correlation-id"]?.toString() ?? randomUUID();
    request.headers["x-correlation-id"] = correlationId;
    reply.header("x-correlation-id", correlationId);
  });
}
