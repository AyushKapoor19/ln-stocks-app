/**
 * API Request/Response Types
 *
 * Common interfaces for API endpoints
 */

export interface IApiError {
  error: string;
  code?: string;
  details?: string;
}

export interface IHealthResponse {
  name: string;
  version: string;
  status: string;
  finnhub: string;
  cache: string;
  endpoints: {
    quotes: string;
    series: string;
  };
}

export interface IQueryParams {
  symbols?: string;
  period?: string;
  q?: string;
}
