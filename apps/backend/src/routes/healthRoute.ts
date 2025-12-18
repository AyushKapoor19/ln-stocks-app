/**
 * Health Check Route Handler
 *
 * Handles root / endpoint for API info and health check
 */

import type { FastifyRequest, FastifyReply } from "fastify";
import { FINNHUB_KEY } from "../constants/config.js";
import type { IHealthResponse } from "../types/api.js";

export async function healthRoute(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<IHealthResponse> {
  return {
    name: "LN Stocks API",
    version: "1.0.0",
    status: "running",
    finnhub: FINNHUB_KEY ? "connected" : "no_key",
    cache: "enabled",
    endpoints: {
      quotes: "/v1/quotes?symbols=VOO,AAPL,TSLA",
      series: "/v1/series?symbols=VOO&period=1W",
    },
  };
}
