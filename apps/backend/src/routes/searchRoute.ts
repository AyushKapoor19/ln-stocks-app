/**
 * Search Route Handler
 *
 * Handles /v1/search endpoint for stock symbol search
 */

import type { FastifyRequest, FastifyReply } from "fastify";
import { finnhubService } from "../services/finnhubService";
import { validateSearchQuery } from "../utils/validation";
import { FINNHUB_KEY } from "../constants/config";
import type { ISearchResponse } from "../types/search";
import type { IQueryParams } from "../types/api";

export async function searchRoute(
  request: FastifyRequest<{ Querystring: IQueryParams }>,
  reply: FastifyReply
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
    console.log(`💥 Search error:`, error);
    reply.code(500);
    return { error: "Internal server error" } as unknown as ISearchResponse;
  }
}
