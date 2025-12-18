/**
 * Request Validation Utilities
 *
 * Validates and sanitizes API request parameters
 */

import { MAX_SYMBOLS_PER_REQUEST } from "../constants/config.js";
import type { Period } from "../types/series.js";

export function parseSymbols(symbolsParam: unknown): string[] {
  const symbolsString = String(symbolsParam || "");
  return symbolsString
    .split(",")
    .filter(Boolean)
    .map((s) => s.trim().toUpperCase())
    .slice(0, MAX_SYMBOLS_PER_REQUEST);
}

export function validatePeriod(periodParam: unknown): Period {
  const period = String(periodParam || "1W");
  const validPeriods: Period[] = ["1D", "1W", "1M", "3M", "1Y"];

  if (validPeriods.includes(period as Period)) {
    return period as Period;
  }

  return "1W";
}

export function validateSearchQuery(queryParam: unknown): string {
  return String(queryParam || "").trim();
}
