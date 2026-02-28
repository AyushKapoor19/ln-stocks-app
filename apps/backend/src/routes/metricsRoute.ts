/**
 * Metrics Route Handler
 *
 * Handles /v1/metrics endpoint for stock metrics (volume, market cap, 52-week range)
 */

import type { FastifyRequest, FastifyReply } from "fastify";
import { metricsService } from "../services/metricsService.js";
import { validateSymbols } from "../utils/requestValidation.js";
import type { IMetricsResponse } from "../types/metrics.js";
import type { IQueryParams } from "../types/api.js";

export async function metricsRoute(
  request: FastifyRequest<{ Querystring: IQueryParams }>,
  reply: FastifyReply,
): Promise<void> {
  const symbols = validateSymbols(request.query.symbols, reply);
  if (!symbols) {
    return;
  }

  const out: IMetricsResponse = {};

  // Fetch metrics for all requested symbols in parallel
  const metricsPromises = symbols.map(async (symbol) => {
    try {
      const metrics = await metricsService.fetchMetrics(symbol);
      out[symbol] = metrics;
    } catch (error) {
      out[symbol] = {
        symbol,
        source: "estimated",
      };
    }
  });

  await Promise.all(metricsPromises);

  reply.send(out);
}
