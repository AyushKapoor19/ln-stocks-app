/**
 * Series Route Handler
 *
 * Handles /v1/series endpoint for historical candlestick data
 */

import type { FastifyRequest, FastifyReply } from "fastify";
import { cacheService } from "../services/cacheService";
import { polygonService } from "../services/polygonService";
import { generateFallbackSeries } from "../utils/fallbackData";
import { parseSymbols, validatePeriod } from "../utils/validation";
import type { ISeriesResponse } from "../types/series";
import type { IQueryParams } from "../types/api";

export async function seriesRoute(
  request: FastifyRequest<{ Querystring: IQueryParams }>,
  reply: FastifyReply
): Promise<ISeriesResponse> {
  const symbols = parseSymbols(request.query.symbols);
  const period = validatePeriod(request.query.period);

  if (symbols.length === 0) {
    reply.code(400);
    return { error: "symbols required" } as unknown as ISeriesResponse;
  }

  const out: ISeriesResponse = {};

  for (const symbol of symbols) {
    try {
      // Check cache first
      const cached = cacheService.getSeries(symbol, period);
      if (cached) {
        out[symbol] = cached;
        continue;
      }

      // Try Polygon
      const series = await polygonService.fetchSeries(symbol, period);
      if (series) {
        cacheService.setSeries(symbol, period, series);
        out[symbol] = series;
        continue;
      }

      // Get current price from quote cache for better fallback
      const cachedQuote = cacheService.getQuote(symbol);
      const currentPrice = cachedQuote ? cachedQuote.price : undefined;

      if (currentPrice) {
        console.log(`💰 Using real price $${currentPrice} for ${symbol} chart`);
      }

      // Generate fallback
      const fallback = generateFallbackSeries(symbol, period, currentPrice);
      cacheService.setSeries(symbol, period, fallback);
      out[symbol] = fallback;
    } catch (error) {
      console.log(`❌ Error generating series for ${symbol}:`, error);
      out[symbol] = {
        symbol,
        period,
        points: [],
        source: "error",
      };
    }
  }

  return out;
}
