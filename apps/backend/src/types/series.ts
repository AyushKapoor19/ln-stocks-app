/**
 * Series Data Types
 *
 * Interfaces for historical price data (candlestick charts)
 */

export interface ISeriesPoint {
  t: number; // Timestamp in milliseconds
  c: number; // Close price
  o: number; // Open price
  h: number; // High price
  l: number; // Low price
  v: number; // Volume
}

export interface ISeriesData {
  symbol: string;
  period: string;
  points: ISeriesPoint[];
  source: "polygon_real_data" | "professional_series" | "error";
}

export interface IPolygonCandle {
  t: number; // Timestamp
  c: number; // Close
  o: number; // Open
  h: number; // High
  l: number; // Low
  v: number; // Volume
}

export interface IPolygonResponse {
  status: string;
  results?: IPolygonCandle[];
  queryCount?: number;
  resultsCount?: number;
}

export interface ISeriesCache {
  data: ISeriesData;
  timestamp: number;
}

export interface ISeriesResponse {
  [symbol: string]: ISeriesData;
}

export type Period = "1D" | "1W" | "1M" | "3M" | "1Y";

export interface IPeriodSettings {
  points: number;
  interval: number;
  volatility: number;
}
