/**
 * Event Type Definitions
 */

// Search-related events
export interface ISearchResult {
  symbol: string;
  name: string;
  _score?: number;
}

export interface ISelectStockEvent {
  symbol: string;
  name: string;
}

export interface ISearchActivatedEvent {
  component: unknown;
}

export interface ISearchDeactivatedEvent {
  component: unknown;
}

export interface IShowSearchResultsEvent {
  results: ISearchResult[];
  selectedIndex: number;
}

export interface IUpdateSearchSelectionEvent {
  selectedIndex: number;
}

export interface INavigateSearchResultsEvent {
  currentIndex: number;
}

export interface IClearSearchResultsEvent {
  // Empty event, just a signal
}
// Chart-related types
export interface ISeriesPoint {
  t: number; // timestamp
  c: number; // close price
  o?: number; // open price
  h?: number; // high price
  l?: number; // low price
  v?: number; // volume
}

export interface ISeriesData {
  symbol: string;
  period: string;
  points: ISeriesPoint[];
  source?: string;
}
