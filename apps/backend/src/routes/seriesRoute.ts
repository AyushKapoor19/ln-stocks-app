/**
 * Series Route Handler
 *
 * Handles /v1/series endpoint for historical candlestick data
 *
 * Multi-tier caching strategy:
 * 1. In-Memory (15 min) - Ultra fast
 * 2. PostgreSQL (24h) - Real data, handles rate limits
 * 3. Polygon API - Fresh data
 * 4. Synthetic fallback - Last resort
 */

import type { FastifyRequest, FastifyReply } from "fastify";
import { cacheService } from "../services/cacheService.js";
import { dbCacheService } from "../services/dbCacheService.js";
import { polygonService } from "../services/polygonService.js";
import { generateFallbackSeries } from "../utils/fallbackData.js";
import { validatePeriod } from "../utils/validation.js";
import { validateSymbols } from "../utils/requestValidation.js";
import type { ISeriesResponse } from "../types/series.js";
import type { IQueryParams } from "../types/api.js";

export async function seriesRoute(
  request: FastifyRequest<{ Querystring: IQueryParams }>,
  reply: FastifyReply,
): Promise<void> {
  const symbols = validateSymbols(request.query.symbols, reply);
  if (!symbols) {
    return;
  }

  const period = validatePeriod(request.query.period);

  const out: ISeriesResponse = {};

  for (const symbol of symbols) {
    try {
      // 1. Check in-memory cache (15 min) - Ultra fast
      const cached = cacheService.getSeries(symbol, period);
      if (cached) {
        out[symbol] = cached;
        continue;
      }

      // 2. Check PostgreSQL cache (24h) - Real data, slightly older
      const dbCached = await dbCacheService.getSeries(symbol, period);
      if (dbCached) {
        // Also set in-memory cache for next 15 min
        cacheService.setSeries(symbol, period, dbCached);
        out[symbol] = dbCached;
        continue;
      }

      // 3. Try Polygon API - Fresh data (respects rate limits)
      const series = await polygonService.fetchSeries(symbol, period);
      if (series) {
        // Cache in both in-memory and PostgreSQL
        cacheService.setSeries(symbol, period, series);
        await dbCacheService.setSeries(symbol, period, series);
        out[symbol] = series;
        continue;
      }

      // 4. Get current price from quote cache for better fallback
      const cachedQuote = cacheService.getQuote(symbol);
      const currentPrice = cachedQuote ? cachedQuote.price : undefined;

      // 5. Generate synthetic fallback (last resort)
      const fallback = generateFallbackSeries(symbol, period, currentPrice);
      cacheService.setSeries(symbol, period, fallback);
      out[symbol] = fallback;
    } catch (error) {
      out[symbol] = {
        symbol,
        period,
        points: [],
        source: "error",
      };
    }
  }

  reply.send(out);
}
