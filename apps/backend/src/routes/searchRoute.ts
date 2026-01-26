/**
 * Search Route Handler
 *
 * Handles /v1/search endpoint for stock symbol search
 */

import type { FastifyRequest, FastifyReply } from "fastify";
import { finnhubService } from "../services/finnhubService.js";
import { validateSearchQuery } from "../utils/validation.js";
import { FINNHUB_KEY } from "../constants/config.js";
import type { ISearchResponse } from "../types/search.js";
import type { IQueryParams } from "../types/api.js";

export async function searchRoute(
  request: FastifyRequest<{ Querystring: IQueryParams }>,
  reply: FastifyReply,
): Promise<ISearchResponse> {
  const query = validateSearchQuery(request.query.q);

  if (!query || query.length < 1) {
    reply.code(400);
    return { error: "query required" } as unknown as ISearchResponse;
  }

  if (!FINNHUB_KEY) {
    reply.code(503);
    return { error: "No FINNHUB_KEY configured" } as unknown as ISearchResponse;
  }

  try {
    const results = await finnhubService.searchSymbols(query);
    return {
      query,
      results,
      count: results.length,
    };
  } catch (error) {
    reply.code(500);
    return { error: "Internal server error" } as unknown as ISearchResponse;
  }
}
