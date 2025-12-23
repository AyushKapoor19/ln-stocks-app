/**
 *
 * Uses the in-memory stock index for intelligent, fast search results.
 * Supports exact match, starts-with, contains, and fuzzy matching.
 */

import { FastifyRequest, FastifyReply } from "fastify";
import { stockIndexService } from "../services/stockIndexService.js";

interface SearchQuery {
  q: string;
  limit?: string;
}

export async function enhancedSearchRoute(
  request: FastifyRequest<{ Querystring: SearchQuery }>,
  reply: FastifyReply
): Promise<void> {
  const { q: query, limit } = request.query;

  if (!query || typeof query !== "string") {
    reply.code(400).send({
      error: "Bad Request",
      message: "Query parameter 'q' is required",
    });
    return;
  }

  if (query.trim().length === 0) {
    reply.code(400).send({
      error: "Bad Request",
      message: "Query cannot be empty",
    });
    return;
  }

  try {
    const resultLimit = limit ? parseInt(limit, 10) : 50;

    if (isNaN(resultLimit) || resultLimit < 1 || resultLimit > 100) {
      reply.code(400).send({
        error: "Bad Request",
        message: "Limit must be between 1 and 100",
      });
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
    console.error(`❌ Enhanced search error:`, error);
    reply.code(500).send({
      error: "Internal Server Error",
      message: "Failed to search stocks",
    });
  }
}
