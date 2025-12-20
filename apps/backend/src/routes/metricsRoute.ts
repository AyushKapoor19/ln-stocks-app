/**
 * Metrics Route Handler
 *
 * Handles /v1/metrics endpoint for stock metrics (volume, market cap, 52-week range)
 */

import type { FastifyRequest, FastifyReply } from "fastify";
import { metricsService } from "../services/metricsService.js";
import { parseSymbols } from "../utils/validation.js";
import type { IMetricsResponse } from "../types/metrics.js";
import type { IQueryParams } from "../types/api.js";

export async function metricsRoute(
  request: FastifyRequest<{ Querystring: IQueryParams }>,
  reply: FastifyReply
): Promise<IMetricsResponse> {
  const symbols = parseSymbols(request.query.symbols);

  if (symbols.length === 0) {
    reply.code(400);
    return { error: "symbols required" } as unknown as IMetricsResponse;
  }

  const out: IMetricsResponse = {};

  // Fetch metrics for all requested symbols in parallel
  const metricsPromises = symbols.map(async (symbol) => {
    try {
      const metrics = await metricsService.fetchMetrics(symbol);
      out[symbol] = metrics;
    } catch (error) {
      console.log(`💥 Error processing metrics for ${symbol}:`, error);
      out[symbol] = {
        symbol,
        source: "estimated",
      };
    }
  });

  await Promise.all(metricsPromises);

  return out;
}

