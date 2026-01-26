/**
 * Fallback Data Generation
 *
 * Generates professional-quality mock data when APIs are unavailable
 */

import { PERIOD_SETTINGS } from "../constants/config.js";
import type { IQuoteData } from "../types/quote.js";
import type { ISeriesData, Period } from "../types/series.js";

export function generateFallbackQuote(symbol: string): IQuoteData {
  const basePrice = 50 + ((symbol.charCodeAt(0) * 7) % 800);
  const change = basePrice * ((Math.random() - 0.5) * 0.01);

  return {
    symbol: symbol,
    price: Math.round((basePrice + change) * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePct: Math.round((change / basePrice) * 10000) / 10000,
    time: Date.now(),
    source: "calculated_fallback",
  };
}

export function generateFallbackSeries(
  symbol: string,
  period: Period,
  currentPrice?: number,
): ISeriesData {
  const basePrice = currentPrice || 50 + ((symbol.charCodeAt(0) * 7) % 800);
  const settings = PERIOD_SETTINGS[period] || PERIOD_SETTINGS["1W"];

  const isETF =
    symbol.includes("VOO") || symbol.includes("SPY") || symbol.includes("QQQ");
  const isVolatile =
    symbol.includes("TSLA") ||
    symbol.includes("NVDA") ||
    symbol.includes("GME");

  const points = [];
  const currentTime = Date.now();

  // Deterministic random for smooth, consistent data
  const seed = symbol.charCodeAt(0) + period.charCodeAt(0);
  let seededRandom = seed;
  const deterministicRandom = () => {
    seededRandom = (seededRandom * 9301 + 49297) % 233280;
    return seededRandom / 233280;
  };

  // Generate smooth chart data
  for (let i = 0; i < settings.points; i++) {
    const timestamp =
      currentTime - (settings.points - 1 - i) * settings.interval;
    const timeProgress = i / settings.points;

    const trendDirection =
      period === "1Y" ? 1 : deterministicRandom() > 0.5 ? 1 : -1;
    const overallTrend =
      trendDirection * settings.volatility * timeProgress * 0.4;

    const wave1 =
      Math.sin(timeProgress * Math.PI * 1.5) * settings.volatility * 0.35;
    const wave2 =
      Math.sin(timeProgress * Math.PI * 4.2) * settings.volatility * 0.15;
    const smoothNoise =
      (deterministicRandom() - 0.5) * settings.volatility * 0.25;

    let price = basePrice * (1 + overallTrend + wave1 + wave2 + smoothNoise);

    // Keep in realistic bounds
    const boundsMultiplier = isETF
      ? settings.volatility * 2
      : settings.volatility * 3;
    const minPrice = Math.max(10, basePrice * (1 - boundsMultiplier));
    const maxPrice = basePrice * (1 + boundsMultiplier);
    price = Math.max(minPrice, Math.min(maxPrice, price));

    points.push({
      t: timestamp,
      c: Math.round(price * 100) / 100,
      o:
        Math.round(price * (1 + (deterministicRandom() - 0.5) * 0.0005) * 100) /
        100,
      h: Math.round(price * (1 + deterministicRandom() * 0.001) * 100) / 100,
      l: Math.round(price * (1 - deterministicRandom() * 0.001) * 100) / 100,
      v: Math.floor((isETF ? 2000000 : 1000000) * (1 + deterministicRandom())),
    });
  }

  // Make the last point match the current real price
  if (points.length > 0) {
    points[points.length - 1].c = basePrice;
    points[points.length - 1].t = currentTime;
  }

  return {
    symbol,
    period,
    points,
    source: "professional_series",
  };
}
