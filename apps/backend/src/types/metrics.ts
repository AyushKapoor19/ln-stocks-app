/**
 * Stock Metrics Types
 *
 * Interfaces for extended stock metrics and fundamentals
 */

export interface IStockMetrics {
  symbol: string;
  volume?: number;
  marketCap?: number;
  week52High?: number;
  week52Low?: number;
  source: "polygon_calculated" | "finnhub_metrics" | "estimated";
}

export interface IMetricsResponse {
  [symbol: string]: IStockMetrics;
}

export interface IFinnhubMetricsResponse {
  metric?: {
    "52WeekHigh"?: number;
    "52WeekLow"?: number;
    marketCapitalization?: number;
  };
  series?: {
    annual?: {
      currentRatio?: number[];
      salesPerShare?: number[];
      netMargin?: number[];
    };
  };
}
