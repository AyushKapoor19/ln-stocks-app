/**
 * Metrics Service
 *
 * Fetches and calculates stock metrics from Polygon and Finnhub APIs
 */

import { polygonService } from "./polygonService.js";
import { finnhubService } from "./finnhubService.js";
import { cacheService } from "./cacheService.js";
import { dbCacheService } from "./dbCacheService.js";
import { FINNHUB_KEY } from "../constants/config.js";
import { hasApiKey } from "../utils/serviceHelpers.js";
import type {
  IStockMetrics,
  IFinnhubMetricsResponse,
} from "../types/metrics.js";
import fetch from "node-fetch";

class MetricsService {
  private finnhubBaseUrl = "https://finnhub.io/api/v1";

  /**
   * Fetches comprehensive stock metrics including:
   * - Volume (from today's Polygon data)
   * - 52-week high/low (from 1Y Polygon data or Finnhub metrics)
   * - Market cap (from Finnhub company profile)
   */
  async fetchMetrics(symbol: string): Promise<IStockMetrics> {
    try {
      // Fetch data from multiple sources in parallel
      const [polygonMetrics, finnhubMetrics] = await Promise.all([
        this._getPolygonMetrics(symbol),
        this._getFinnhubMetrics(symbol),
      ]);

      // Merge data, preferring Finnhub for market cap and 52-week range
      const metrics: IStockMetrics = {
        symbol,
        volume: polygonMetrics.volume || undefined,
        marketCap: finnhubMetrics.marketCap || undefined,
        week52High:
          finnhubMetrics.week52High || polygonMetrics.week52High || undefined,
        week52Low:
          finnhubMetrics.week52Low || polygonMetrics.week52Low || undefined,
        source: finnhubMetrics.marketCap
          ? "finnhub_metrics"
          : "polygon_calculated",
      };

      return metrics;
    } catch (error) {
      return {
        symbol,
        source: "estimated",
      };
    }
  }

  /**
   * Get metrics from Polygon historical data
   * - Volume: from latest 1D candle
   * - 52-week range: from 1Y historical data
   *
   * Uses caching layer to avoid redundant API calls
   */
  private async _getPolygonMetrics(
    symbol: string,
  ): Promise<Partial<IStockMetrics>> {
    try {
      // Check cache first (in-memory → PostgreSQL)
      let yearData = cacheService.getSeries(symbol, "1Y");

      if (!yearData) {
        yearData = await dbCacheService.getSeries(symbol, "1Y");
      }

      // Only hit API if not cached
      if (!yearData) {
        yearData = await polygonService.fetchSeries(symbol, "1Y");

        // Cache the result for future use
        if (yearData) {
          cacheService.setSeries(symbol, "1Y", yearData);
          await dbCacheService.setSeries(symbol, "1Y", yearData);
        }
      }

      if (!yearData || !yearData.points || yearData.points.length === 0) {
        return {};
      }

      // Calculate 52-week high/low from all points
      const highs = yearData.points.map((p) => p.h || p.c);
      const lows = yearData.points.map((p) => p.l || p.c);

      const week52High = Math.max(...highs);
      const week52Low = Math.min(...lows);

      // Get volume from the most recent candle
      const latestCandle = yearData.points[yearData.points.length - 1];
      const volume = latestCandle.v || 0;

      return {
        volume: volume > 0 ? volume : undefined,
        week52High: week52High > 0 ? week52High : undefined,
        week52Low: week52Low > 0 ? week52Low : undefined,
      };
    } catch (error) {
      return {};
    }
  }

  /**
   * Get metrics from Finnhub API
   * - Market cap from /stock/profile2
   * - 52-week range from /stock/metric
   */
  private async _getFinnhubMetrics(
    symbol: string,
  ): Promise<Partial<IStockMetrics>> {
    if (!hasApiKey(FINNHUB_KEY)) {
      return {};
    }

    try {
      // Fetch company profile for market cap
      const profileUrl = `${
        this.finnhubBaseUrl
      }/stock/profile2?symbol=${encodeURIComponent(
        symbol,
      )}&token=${FINNHUB_KEY}`;

      const profileResponse = await fetch(profileUrl);

      if (!profileResponse.ok) {
        return {};
      }

      const profileData = (await profileResponse.json()) as {
        marketCapitalization?: number;
        shareOutstanding?: number;
      };

      // Finnhub returns market cap in millions
      const marketCap = profileData.marketCapitalization
        ? profileData.marketCapitalization * 1000000
        : undefined;

      // Try to get 52-week range from basic metrics endpoint
      const metricsUrl = `${
        this.finnhubBaseUrl
      }/stock/metric?symbol=${encodeURIComponent(
        symbol,
      )}&metric=all&token=${FINNHUB_KEY}`;

      const metricsResponse = await fetch(metricsUrl);
      let week52High: number | undefined;
      let week52Low: number | undefined;

      if (metricsResponse.ok) {
        const metricsData =
          (await metricsResponse.json()) as IFinnhubMetricsResponse;
        week52High = metricsData.metric?.["52WeekHigh"];
        week52Low = metricsData.metric?.["52WeekLow"];
      }

      return {
        marketCap,
        week52High,
        week52Low,
      };
    } catch (error) {
      return {};
    }
  }
}

export const metricsService = new MetricsService();
