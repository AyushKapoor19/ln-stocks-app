interface QuoteResponse {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  time: number;
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
    this.baseUrl = "http://localhost:8787";
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
}

// Export singleton instance
export const stocksApi = new StocksApiService();
export type { QuoteResponse, SeriesResponse, SeriesPoint };
