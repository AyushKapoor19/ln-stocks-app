/**
 * Enhanced Search Route Handler
 *
 * Uses the in-memory stock index for intelligent, fast search results.
 * Supports exact match, starts-with, contains, and fuzzy matching.
 */

import type { FastifyRequest, FastifyReply } from "fastify";
import { stockIndexService } from "../services/stockIndexService.js";
import { sendBadRequest, sendInternalError } from "../utils/errorHandler.js";

interface SearchQuery {
  q: string;
  limit?: string;
}

export async function enhancedSearchRoute(
  request: FastifyRequest<{ Querystring: SearchQuery }>,
  reply: FastifyReply,
): Promise<void> {
  const { q: query, limit } = request.query;

  if (!query || typeof query !== "string") {
    sendBadRequest(reply, "Query parameter 'q' is required");
    return;
  }

  if (query.trim().length === 0) {
    sendBadRequest(reply, "Query cannot be empty");
    return;
  }

  try {
    const resultLimit = limit ? parseInt(limit, 10) : 50;

    if (isNaN(resultLimit) || resultLimit < 1 || resultLimit > 100) {
      sendBadRequest(reply, "Limit must be between 1 and 100");
      return;
    }

    // Search using hybrid approach (local + API)
    const results = await stockIndexService.search(query, resultLimit);

    reply.code(200).send({
      query,
      count: results.length,
      results,
    });
  } catch (error) {
    sendInternalError(reply, "Failed to search stocks");
  }
}
