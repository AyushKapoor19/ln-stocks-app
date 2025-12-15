/**
 * Application Configuration
 *
 * Centralized configuration and constants
 */

import type { IPeriodSettings, Period } from "../types/series";

// API Keys
export const FINNHUB_KEY = process.env.FINNHUB_KEY || "";
export const POLYGON_KEY = process.env.POLYGON_KEY || "";

// Server Configuration
export const PORT = Number(process.env.PORT || 8787);
export const HOST = "0.0.0.0";

// Authentication Configuration
export const JWT_SECRET =
  process.env.JWT_SECRET || "change-this-secret-in-production";
export const JWT_EXPIRES_IN = "7d";

// Device Code Configuration (for TV authentication)
export const DEVICE_CODE_LENGTH = 7;
export const DEVICE_CODE_EXPIRES_IN = 15 * 60 * 1000; // 15 minutes
export const DEVICE_CODE_POLL_INTERVAL = 3000; // 3 seconds

// Cache Configuration
export const CACHE_DURATION = 30000; // 30 seconds

// API Limits
export const MAX_SYMBOLS_PER_REQUEST = 30;
export const MAX_SEARCH_RESULTS = 10;

// Period Settings for Chart Data
export const PERIOD_SETTINGS: Record<Period, IPeriodSettings> = {
  "1D": { points: 78, interval: 5 * 60 * 1000, volatility: 0.002 },
  "1W": { points: 100, interval: 15 * 60 * 1000, volatility: 0.005 },
  "1M": { points: 120, interval: 60 * 60 * 1000, volatility: 0.015 },
  "3M": { points: 90, interval: 24 * 60 * 60 * 1000, volatility: 0.035 },
  "1Y": { points: 252, interval: 24 * 60 * 60 * 1000, volatility: 0.1 },
};

// Log API key status
export function logApiKeysStatus(): void {
  console.log(
    "🔑 FINNHUB_KEY loaded:",
    FINNHUB_KEY ? "✅ EXISTS" : "❌ MISSING"
  );
  console.log(
    "🔑 POLYGON_KEY loaded:",
    POLYGON_KEY ? "✅ EXISTS (for historical candles)" : "❌ MISSING"
  );
  console.log(
    "🔑 JWT_SECRET loaded:",
    JWT_SECRET !== "change-this-secret-in-production"
      ? "✅ CUSTOM"
      : "⚠️  DEFAULT (change in production)"
  );
  console.log(
    "🔑 DATABASE_URL loaded:",
    process.env.DATABASE_URL ? "✅ EXISTS" : "❌ MISSING"
  );
}
