/**
 * Cache Service
 *
 * Simple in-memory cache to avoid rate limiting
 */

import { CACHE_DURATION } from "../constants/config";
import type { IQuoteCache, IQuoteData } from "../types/quote";
import type { ISeriesCache, ISeriesData } from "../types/series";

class CacheService {
  private quoteCache = new Map<string, IQuoteCache>();
  private seriesCache = new Map<string, ISeriesCache>();

  getQuote(symbol: string): IQuoteData | null {
    const cacheKey = `quote_${symbol}`;
    const cached = this.quoteCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`💾 Using cached quote for ${symbol}`);
      return cached.data;
    }

    return null;
  }

  setQuote(symbol: string, data: IQuoteData): void {
    const cacheKey = `quote_${symbol}`;
    this.quoteCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }

  getSeries(symbol: string, period: string): ISeriesData | null {
    const cacheKey = `series_${symbol}_${period}`;
    const cached = this.seriesCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`💾 Using cached series for ${symbol} (${period})`);
      return cached.data;
    }

    return null;
  }

  setSeries(symbol: string, period: string, data: ISeriesData): void {
    const cacheKey = `series_${symbol}_${period}`;
    this.seriesCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }

  clearAll(): void {
    this.quoteCache.clear();
    this.seriesCache.clear();
    console.log("🗑️  Cache cleared");
  }
}

export const cacheService = new CacheService();
