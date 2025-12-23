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
        `${this.baseUrl}/v1/quotes?symbols=${encodeURIComponent(symbol)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<QuoteResponse> = await response.json();
      return data[symbol] || null;
    } catch (error) {
      console.error(`Failed to fetch quote for ${symbol}:`, error);
      return null;
    }
  }

  // Get historical series data for VOO with specific time period
  async getSeries(
    symbol: string,
    period: string
  ): Promise<SeriesResponse | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/series?symbols=${encodeURIComponent(
          symbol
        )}&period=${encodeURIComponent(period)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<SeriesResponse> = await response.json();
      return data[symbol] || null;
    } catch (error) {
      console.error(`Failed to fetch series for ${symbol} (${period}):`, error);
      return null;
    }
  }

  // Get both quote and series data for VOO
  async getVooData(
    period: string
  ): Promise<{ quote: QuoteResponse | null; series: SeriesResponse | null }> {
    try {
      // Fetch both quote and series data in parallel
      const [quote, series] = await Promise.all([
        this.getQuote("VOO"),
        this.getSeries("VOO", period),
      ]);

      return { quote, series };
    } catch (error) {
      console.error(`Failed to fetch VOO data for period ${period}:`, error);
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
    query: string
  ): Promise<Array<{ symbol: string; name: string }>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/search?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error(`Failed to search for "${query}":`, error);
      return [];
    }
  }

  // Get stock metrics (volume, market cap, 52-week range)
  async getMetrics(symbol: string): Promise<MetricsResponse | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/metrics?symbols=${encodeURIComponent(symbol)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<MetricsResponse> = await response.json();
      return data[symbol] || null;
    } catch (error) {
      console.error(`Failed to fetch metrics for ${symbol}:`, error);
      return null;
    }
  }

  // In-memory cache for search results (production-grade optimization)
  private searchCache = new Map<
    string,
    { results: SearchResult[]; timestamp: number }
  >();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

  // Production-grade search engine with intelligent caching and ranking
  async search(query: string): Promise<SearchResult[]> {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return [];
    }

    const cacheKey = trimmedQuery.toLowerCase();

    try {
      // Check cache first for performance optimization
      const cached = this.searchCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log(
          `✅ Cache hit for "${trimmedQuery}": ${cached.results.length} results`
        );
        return cached.results;
      }

      console.log(`✅ Searching API for: "${trimmedQuery}"`);

      // Fetch from backend API
      const response = await fetch(
        `${this.baseUrl}/v1/search?q=${encodeURIComponent(trimmedQuery)}`
      );

      if (!response.ok) {
        console.error(`❌ Search API error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      let results: SearchResult[] = data.results || [];

      // Filter for USD stocks only (proper currency-based filtering)
      results = results.filter((result) => result.currency === "USD");
      console.log(`✅ Found ${results.length} USD stocks from API`);

      // Apply intelligent ranking algorithm
      const ranked = this._rankSearchResults(results, trimmedQuery);

      // Cache the results for performance
      this.searchCache.set(cacheKey, {
        results: ranked,
        timestamp: Date.now(),
      });

      // Clean old cache entries (keep cache size manageable)
      this._cleanCache();

      console.log(
        `✅ Top 5 results:`,
        ranked.slice(0, 5).map((r) => `${r.symbol} (${r.name})`)
      );

      return ranked;
    } catch (error) {
      console.error(`Failed to search for "${trimmedQuery}":`, error);
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

  private _rankSearchResults(
    results: SearchResult[],
    query: string
  ): SearchResult[] {
    const queryLower = query.toLowerCase().trim();

    // Score each result based on multiple relevance factors
    const scoredResults = results.map((result) => {
      const symbolLower = result.symbol.toLowerCase();
      const nameLower = result.name.toLowerCase();

      let score = 0;

      // === SYMBOL MATCHING (Primary Signal) ===

      // Exact match - Perfect result
      if (symbolLower === queryLower) {
        score += 10000;
      }
      // Starts with query - Very relevant (e.g., "AA" → "AAPL")
      else if (symbolLower.startsWith(queryLower)) {
        score += 5000;

        // Coverage ratio: How much of the symbol is matched
        const coverage = queryLower.length / symbolLower.length;
        score += coverage * 2000; // Up to +2000 for high coverage
      }
      // Contains query - Moderate relevance
      else if (symbolLower.includes(queryLower)) {
        score += 1000;

        // Position bonus: Earlier is better
        const position = symbolLower.indexOf(queryLower);
        score += (10 - position) * 50; // Earlier positions score higher
      }

      // === COMPANY NAME MATCHING (Secondary Signal) ===

      // Exact company name match
      if (nameLower === queryLower) {
        score += 8000;
      }
      // Name starts with query
      else if (nameLower.startsWith(queryLower)) {
        score += 3000;
      }
      // Word boundary match (e.g., "micro" → "Microsoft Corporation")
      else {
        const words = nameLower.split(" ");
        for (const word of words) {
          if (word.startsWith(queryLower)) {
            score += 2000;
            break;
          }
          // Partial word match
          if (word.includes(queryLower)) {
            score += 500;
          }
        }
      }

      // Fuzzy match bonus for name contains query
      if (nameLower.includes(queryLower)) {
        score += 400;
      }

      // === QUALITY SIGNALS ===

      // Symbol length - Shorter symbols often indicate established companies
      if (result.symbol.length <= 3) {
        score += 300; // Very short (V, MA, BA)
      } else if (result.symbol.length === 4) {
        score += 200; // Short (AAPL, MSFT)
      } else if (result.symbol.length === 5) {
        score += 100; // Medium (GOOGL, TSLA)
      }

      // Avoid complex symbols (usually derivatives/exotic instruments)
      if (result.symbol.includes("-") || result.symbol.includes(".")) {
        score -= 500;
      }

      // === RELEVANCE BOOSTING ===

      // Multi-word query handling: Check if all query words match
      const queryWords = queryLower.split(" ");
      if (queryWords.length > 1) {
        const allWordsMatch = queryWords.every(
          (qWord) => symbolLower.includes(qWord) || nameLower.includes(qWord)
        );
        if (allWordsMatch) {
          score += 1000; // Boost for matching all words
        }
      }

      return { result, score };
    });

    // Sort by score (highest first) and return results
    return scoredResults
      .sort((a, b) => b.score - a.score)
      .map((item) => item.result);
  }
}

// Export singleton instance
export const stocksApi = new StocksApiService();
export type { QuoteResponse, SeriesResponse, SeriesPoint, MetricsResponse };
