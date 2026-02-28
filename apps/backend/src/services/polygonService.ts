/**
 * Polygon.io API Service
 *
 * Client for fetching historical candlestick data from Polygon.io
 */

import fetch from "node-fetch";
import { POLYGON_KEY } from "../constants/config.js";
import { roundTo, hasApiKey } from "../utils/serviceHelpers.js";
import type { ISeriesData, IPolygonResponse, Period } from "../types/series.js";

class PolygonService {
  private baseUrl = "https://api.polygon.io/v2";

  private getPeriodParams(period: Period): {
    multiplier: number;
    timespan: string;
    from: string;
  } {
    const now = new Date();
    const toDate = now.toISOString().split("T")[0];

    const periodMap: Record<
      Period,
      { multiplier: number; timespan: string; daysBack: number }
    > = {
      "1D": { multiplier: 1, timespan: "minute", daysBack: 1 },
      "1W": { multiplier: 1, timespan: "day", daysBack: 7 },
      "1M": { multiplier: 1, timespan: "day", daysBack: 30 },
      "3M": { multiplier: 1, timespan: "day", daysBack: 90 },
      "1Y": { multiplier: 1, timespan: "day", daysBack: 365 },
    };

    const config = periodMap[period];
    const fromDate = new Date(now.getTime() - config.daysBack * 86400000)
      .toISOString()
      .split("T")[0];

    return {
      multiplier: config.multiplier,
      timespan: config.timespan,
      from: fromDate,
    };
  }

  async fetchSeries(
    symbol: string,
    period: Period,
  ): Promise<ISeriesData | null> {
    if (!hasApiKey(POLYGON_KEY)) {
      return null;
    }

    try {
      const params = this.getPeriodParams(period);
      const toDate = new Date().toISOString().split("T")[0];

      const url = `${this.baseUrl}/aggs/ticker/${encodeURIComponent(
        symbol,
      )}/range/${params.multiplier}/${params.timespan}/${params.from}/${
        toDate
      }?adjusted=true&sort=asc&apiKey=${POLYGON_KEY}`;

      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as IPolygonResponse;

      if (
        data &&
        (data.status === "OK" || data.status === "DELAYED") &&
        data.results &&
        data.results.length > 0
      ) {
        const points = data.results.map((candle) => ({
          t: candle.t,
          c: roundTo(candle.c, 2),
          o: roundTo(candle.o, 2),
          h: roundTo(candle.h, 2),
          l: roundTo(candle.l, 2),
          v: candle.v || 0,
        }));

        return {
          symbol,
          period,
          points,
          source: "polygon_real_data",
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}

export const polygonService = new PolygonService();
