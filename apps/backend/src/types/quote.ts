/**
 * Quote Data Types
 *
 * Interfaces for stock quote data from various sources
 */

export interface IQuoteData {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  time: number;
  source: "finnhub_quote" | "calculated_fallback" | "error";
}

export interface IFinnhubQuoteResponse {
  c: number; // Current price
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

export interface IQuoteCache {
  data: IQuoteData;
  timestamp: number;
}

export interface IQuotesResponse {
  [symbol: string]: IQuoteData;
}
