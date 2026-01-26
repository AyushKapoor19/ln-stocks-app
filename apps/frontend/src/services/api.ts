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

interface SeriesPoint {
  t: number; // timestamp in milliseconds
  c: number; // close price
  o?: number; // open price
  h?: number; // high price
  l?: number; // low price
  v?: number; // volume
}

interface SeriesResponse {
  symbol: string;
  period: string;
  points: SeriesPoint[];
  source: string;
}

interface ApiResponse<T> {
  [key: string]: T;
}

class StocksApiService {
  private baseUrl: string;

  constructor() {
    // Use localhost for development, production URL can be configured via env
    this.baseUrl = "https://ln-stocks-backend.onrender.com";
  }

  // Get real-time quote for VOO
  async getQuote(symbol: string): Promise<QuoteResponse | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/quotes?symbols=${encodeURIComponent(symbol)}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<QuoteResponse> = await response.json();
      return data[symbol] || null;
    } catch (error) {
      return null;
    }
  }

  // Get historical series data for VOO with specific time period
  async getSeries(
    symbol: string,
    period: string,
  ): Promise<SeriesResponse | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/series?symbols=${encodeURIComponent(
          symbol,
        )}&period=${encodeURIComponent(period)}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<SeriesResponse> = await response.json();
      return data[symbol] || null;
    } catch (error) {
      return null;
    }
  }

  // Get both quote and series data for VOO
  async getVooData(
    period: string,
  ): Promise<{ quote: QuoteResponse | null; series: SeriesResponse | null }> {
    try {
      // Fetch both quote and series data in parallel
      const [quote, series] = await Promise.all([
        this.getQuote("VOO"),
        this.getSeries("VOO", period),
      ]);

      return { quote, series };
    } catch (error) {
      return { quote: null, series: null };
    }
  }

  // Format price for display (USD currency)
  formatPrice(price: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }

  // Format change for display
  formatChange(change: number, changePct: number): string {
    const changeStr = change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
    const pctStr =
      changePct >= 0
        ? `+${(changePct * 100).toFixed(2)}%`
        : `${(changePct * 100).toFixed(2)}%`;
    return `${changeStr} (${pctStr})`;
  }

  // Convert series points to chart-compatible format
  formatSeriesForChart(series: SeriesResponse | null): number[] {
    if (!series || !series.points || series.points.length === 0) {
      return [];
    }

    // Return closing prices sorted by timestamp
    return series.points.sort((a, b) => a.t - b.t).map((point) => point.c);
  }

  // Search for stocks by symbol or name
  async searchStocks(
    query: string,
  ): Promise<Array<{ symbol: string; name: string }>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/search?q=${encodeURIComponent(query)}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      return [];
    }
  }

  // Get stock metrics (volume, market cap, 52-week range)
  async getMetrics(symbol: string): Promise<MetricsResponse | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/metrics?symbols=${encodeURIComponent(symbol)}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<MetricsResponse> = await response.json();
      return data[symbol] || null;
    } catch (error) {
      return null;
    }
  }

  private searchCache = new Map<
    string,
    { results: SearchResult[]; timestamp: number }
  >();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

  /**
   * Search using backend search index
   */
  async search(query: string): Promise<SearchResult[]> {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return [];
    }

    const cacheKey = trimmedQuery.toLowerCase();

    try {
      // Check cache first
      const cached = this.searchCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.results;
      }

      // Call backend enhanced search endpoint
      const response = await fetch(
        `${this.baseUrl}/v1/search/enhanced?q=${encodeURIComponent(
          trimmedQuery,
        )}&limit=50`,
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const results: SearchResult[] = data.results || [];

      // Cache successful results
      if (results.length > 0) {
        this.searchCache.set(cacheKey, {
          results,
          timestamp: Date.now(),
        });
      }

      this._cleanCache();

      return results;
    } catch (error) {
      return [];
    }
  }

  // Clean cache entries older than TTL
  private _cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.searchCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.searchCache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const stocksApi = new StocksApiService();
export type { QuoteResponse, SeriesResponse, SeriesPoint, MetricsResponse };
