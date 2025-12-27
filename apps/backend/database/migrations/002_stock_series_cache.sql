-- Migration: Stock Series Cache Table
-- Purpose: Cache API responses for 24h to handle rate limits
-- Instead of synthetic fallback data, serve real (but slightly old) data

CREATE TABLE IF NOT EXISTS stock_series_cache (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  period VARCHAR(10) NOT NULL,
  data JSONB NOT NULL,
  fetched_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  UNIQUE(symbol, period)
);

-- Index for fast lookups
CREATE INDEX idx_stock_series_lookup ON stock_series_cache(symbol, period, expires_at);

-- Index for cleanup cron job
CREATE INDEX idx_stock_series_expires ON stock_series_cache(expires_at);

-- Add comment
COMMENT ON TABLE stock_series_cache IS 'Caches stock series data for 24h to handle API rate limits. Serves real (but older) data instead of synthetic fallback.';

