/**
 * Cache Service
 *
 * Simple in-memory cache to avoid rate limiting
 */

import { CACHE_DURATION } from "../constants/config.js";
import type { IQuoteCache, IQuoteData } from "../types/quote.js";
import type { ISeriesCache, ISeriesData } from "../types/series.js";

class CacheService {
  private quoteCache = new Map<string, IQuoteCache>();
  private seriesCache = new Map<string, ISeriesCache>();

  private getCacheKey(type: "quote" | "series", symbol: string, period?: string): string {
    return period ? `${type}_${symbol}_${period}` : `${type}_${symbol}`;
  }

  private isCacheValid<T extends { timestamp: number }>(cached: T | undefined): boolean {
    return !!(cached && Date.now() - cached.timestamp < CACHE_DURATION);
  }

  getQuote(symbol: string): IQuoteData | null {
    const cached = this.quoteCache.get(this.getCacheKey("quote", symbol));
    return this.isCacheValid(cached) ? cached!.data : null;
  }

  setQuote(symbol: string, data: IQuoteData): void {
    this.quoteCache.set(this.getCacheKey("quote", symbol), {
      data,
      timestamp: Date.now(),
    });
  }

  getSeries(symbol: string, period: string): ISeriesData | null {
    const cached = this.seriesCache.get(this.getCacheKey("series", symbol, period));
    return this.isCacheValid(cached) ? cached!.data : null;
  }

  setSeries(symbol: string, period: string, data: ISeriesData): void {
    this.seriesCache.set(this.getCacheKey("series", symbol, period), {
      data,
      timestamp: Date.now(),
    });
  }

  clearAll(): void {
    this.quoteCache.clear();
    this.seriesCache.clear();
  }
}

export const cacheService = new CacheService();
