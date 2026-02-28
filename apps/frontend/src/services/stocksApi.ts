import { BaseApiService } from "./baseApi";
import type { ISeriesData } from "../types/events";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://ln-stocks-backend.onrender.com";

interface QuoteResponse {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  time: number;
  dayHigh?: number;
  dayLow?: number;
  open?: number;
  previousClose?: number;
  currency?: string;
}

interface MetricsResponse {
  symbol: string;
  volume?: number;
  marketCap?: number;
  week52High?: number;
  week52Low?: number;
  source: string;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type?: string;
  exchange?: string;
  currency?: string;
}

interface ApiResponse<T> {
  [key: string]: T;
}

class StocksApiService extends BaseApiService {
  constructor() {
    super(API_BASE_URL);
  }

  async getQuote(symbol: string): Promise<QuoteResponse | null> {
    const data = await this.get<ApiResponse<QuoteResponse>>(
      `/v1/quotes?symbols=${encodeURIComponent(symbol)}`,
    );
    return data?.[symbol] || null;
  }

  async getSeries(
    symbol: string,
    period: string,
  ): Promise<ISeriesData | null> {
    const data = await this.get<ApiResponse<ISeriesData>>(
      `/v1/series?symbols=${encodeURIComponent(symbol)}&period=${encodeURIComponent(period)}`,
    );
    return data?.[symbol] || null;
  }

  async getVooData(
    period: string,
  ): Promise<{ quote: QuoteResponse | null; series: ISeriesData | null }> {
    const [quote, series] = await Promise.all([
      this.getQuote("VOO"),
      this.getSeries("VOO", period),
    ]);
    return { quote, series };
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }

  formatChange(change: number, changePct: number): string {
    const changeStr = change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
    const pctStr =
      changePct >= 0
        ? `+${(changePct * 100).toFixed(2)}%`
        : `${(changePct * 100).toFixed(2)}%`;
    return `${changeStr} (${pctStr})`;
  }

  formatSeriesForChart(series: ISeriesData | null): number[] {
    if (!series?.points?.length) {
      return [];
    }
    return series.points.sort((a, b) => a.t - b.t).map((point) => point.c);
  }

  async searchStocks(query: string): Promise<SearchResult[]> {
    const data = await this.get<{ results: SearchResult[] }>(
      `/v1/search?q=${encodeURIComponent(query)}`,
    );
    return data?.results || [];
  }

  async getMetrics(symbol: string): Promise<MetricsResponse | null> {
    const data = await this.get<ApiResponse<MetricsResponse>>(
      `/v1/metrics?symbols=${encodeURIComponent(symbol)}`,
    );
    return data?.[symbol] || null;
  }

  private searchCache = new Map<
    string,
    { results: SearchResult[]; timestamp: number }
  >();
  private readonly CACHE_TTL = 5 * 60 * 1000;

  async search(query: string): Promise<SearchResult[]> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return [];
    }

    const cacheKey = trimmedQuery.toLowerCase();
    const cached = this.searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.results;
    }

    const data = await this.get<{ results: SearchResult[] }>(
      `/v1/search/enhanced?q=${encodeURIComponent(trimmedQuery)}&limit=50`,
    );
    
    const results = data?.results || [];
    if (results.length > 0) {
      this.searchCache.set(cacheKey, {
        results,
        timestamp: Date.now(),
      });
    }

    this._cleanCache();
    return results;
  }

  private _cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.searchCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.searchCache.delete(key);
      }
    }
  }
}

export const stocksApi = new StocksApiService();
export type { QuoteResponse, MetricsResponse };
