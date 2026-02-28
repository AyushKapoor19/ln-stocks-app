/**
 * Search Route Handler
 *
 * Handles /v1/search endpoint for stock symbol search
 */

import type { FastifyRequest, FastifyReply } from "fastify";
import { finnhubService } from "../services/finnhubService.js";
import { FINNHUB_KEY } from "../constants/config.js";
import {
  sendBadRequest,
  sendServiceUnavailable,
  sendInternalError,
} from "../utils/errorHandler.js";
import { validateQuery } from "../utils/requestValidation.js";
import type { ISearchResponse } from "../types/search.js";
import type { IQueryParams } from "../types/api.js";

export async function searchRoute(
  request: FastifyRequest<{ Querystring: IQueryParams }>,
  reply: FastifyReply,
): Promise<void> {
  const query = validateQuery(request.query.q, reply, 1);
  if (!query) {
    return;
  }

  if (!FINNHUB_KEY) {
    sendServiceUnavailable(reply, "No FINNHUB_KEY configured");
    return;
  }

  try {
    const results = await finnhubService.searchSymbols(query);
    reply.send({
      query,
      results,
      count: results.length,
    });
  } catch (error) {
    sendInternalError(reply);
  }
}
