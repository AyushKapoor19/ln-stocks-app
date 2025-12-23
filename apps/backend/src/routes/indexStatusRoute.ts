/**
 * Stock Index Status Route
 * Returns the current status of the stock search index
 */

import { FastifyRequest, FastifyReply } from "fastify";
import { stockIndexService } from "../services/stockIndexService.js";

export async function indexStatusRoute(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const stats = stockIndexService.getStats();

    reply.code(200).send({
      status: stats.isInitialized ? "ready" : "initializing",
      stats,
    });
  } catch (error) {
    console.error("❌ Index status error:", error);
    reply.code(500).send({
      status: "error",
      message: "Failed to get index status",
    });
  }
}
