/**
 * Search Types
 * 
 * Interfaces for stock symbol search functionality
 */

export interface ISearchResult {
  symbol: string;
  name: string;
  type: string;
  market: string;
  active: boolean;
  primaryExchange: string;
}

export interface IFinnhubSearchItem {
  symbol: string;
  description: string;
  displaySymbol: string;
  type: string;
}

export interface IFinnhubSearchResponse {
  count: number;
  result: IFinnhubSearchItem[];
}

export interface ISearchResponse {
  query: string;
  results: ISearchResult[];
  count: number;
}



