/**
 * Stock Index Status Route
 * Returns the current status of the stock search index
 */

import type { FastifyRequest, FastifyReply } from "fastify";
import { stockIndexService } from "../services/stockIndexService.js";
import { sendInternalError } from "../utils/errorHandler.js";

export async function indexStatusRoute(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const stats = stockIndexService.getStats();

    reply.code(200).send({
      status: stats.isInitialized ? "ready" : "initializing",
      stats,
    });
  } catch (error) {
    sendInternalError(reply, "Failed to get index status");
  }
}
