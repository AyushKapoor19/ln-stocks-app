/**
 * Finnhub API Service
 *
 * Client for fetching real-time quote data and search from Finnhub
 */

import fetch from "node-fetch";
import { FINNHUB_KEY } from "../constants/config.js";
import { roundTo, hasApiKey } from "../utils/serviceHelpers.js";
import type { IQuoteData, IFinnhubQuoteResponse } from "../types/quote.js";
import type { IFinnhubSearchResponse, ISearchResult } from "../types/search.js";

class FinnhubService {
  private baseUrl = "https://finnhub.io/api/v1";

  async fetchQuote(symbol: string): Promise<IQuoteData | null> {
    if (!hasApiKey(FINNHUB_KEY)) {
      return null;
    }

    try {
      // Fetch quote and currency in parallel
      const [quoteResponse, profileResponse] = await Promise.all([
        fetch(
          `${this.baseUrl}/quote?symbol=${encodeURIComponent(
            symbol,
          )}&token=${FINNHUB_KEY}`,
        ),
        fetch(
          `${this.baseUrl}/stock/profile2?symbol=${encodeURIComponent(
            symbol,
          )}&token=${FINNHUB_KEY}`,
        ),
      ]);

      if (!quoteResponse.ok) {
        return null;
      }

      const data = (await quoteResponse.json()) as IFinnhubQuoteResponse;
      let currency = "USD"; // Default to USD

      // Extract currency from profile if available
      if (profileResponse.ok) {
        const profile = (await profileResponse.json()) as {
          currency?: string;
        };
        if (profile.currency) {
          currency = profile.currency;
        }
      }

      if (data && data.c !== undefined && data.c !== null) {
        const currentPrice = data.c;
        const previousClose = data.pc || data.o || currentPrice;
        const change = currentPrice - previousClose;
        const changePct = previousClose !== 0 ? change / previousClose : 0;

        return {
          symbol: symbol,
          price: roundTo(currentPrice, 2),
          change: roundTo(change, 2),
          changePct: roundTo(changePct, 4),
          time: data.t * 1000,
          source: "finnhub_quote",
          dayHigh: data.h ? roundTo(data.h, 2) : undefined,
          dayLow: data.l ? roundTo(data.l, 2) : undefined,
          open: data.o ? roundTo(data.o, 2) : undefined,
          previousClose: previousClose ? roundTo(previousClose, 2) : undefined,
          currency: currency,
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async searchSymbols(query: string): Promise<ISearchResult[]> {
    if (!hasApiKey(FINNHUB_KEY)) {
      throw new Error("No FINNHUB_KEY configured");
    }

    try {
      const url = `${this.baseUrl}/search?q=${encodeURIComponent(
        query,
      )}&token=${FINNHUB_KEY}`;
      const response = await fetch(url);

      if (!response.ok) {
        return [];
      }

      const data = (await response.json()) as IFinnhubSearchResponse;

      if (data && data.result && data.result.length > 0) {
        // Filter for Common Stock or ETF only
        const filteredResults = data.result.filter(
          (item) => item.type === "Common Stock" || item.type === "ETF",
        );

        // Fetch currency for each stock in parallel (limit to 30 for performance)
        const resultsWithCurrency = await Promise.all(
          filteredResults.slice(0, 30).map(async (item) => {
            try {
              // Fetch company profile to get currency
              const profileUrl = `${
                this.baseUrl
              }/stock/profile2?symbol=${encodeURIComponent(
                item.symbol,
              )}&token=${FINNHUB_KEY}`;
              const profileResponse = await fetch(profileUrl);

              if (profileResponse.ok) {
                const profile = (await profileResponse.json()) as {
                  currency?: string;
                };
                return Object.assign({}, item, {
                  currency: profile.currency || "UNKNOWN",
                });
              }

              return Object.assign({}, item, { currency: "UNKNOWN" });
            } catch (error) {
              return Object.assign({}, item, { currency: "UNKNOWN" });
            }
          }),
        );

        // Filter for USD only and exclude international exchange symbols
        const results = resultsWithCurrency
          .filter((item) => {
            // Only USD stocks
            if (item.currency !== "USD") return false;

            // Exclude international exchange suffixes
            // Examples: AAPL.RO (Romania), AAPL.L (London), TSLA.SW (Switzerland)
            // US share classes (BRK.A, BRK.B, BRK.C) are kept - only A/B/C are valid
            const symbol = item.symbol;
            if (symbol.includes(".")) {
              const suffix = symbol.split(".")[1];

              // International exchange suffixes (never used for US share classes):
              // L=London, RO=Romania, SW=Switzerland, TO=Toronto, AX=Australia,
              // HK=Hong Kong, PA=Paris, MI=Milan, F=Frankfurt, BE=Berlin
              const intlSuffixes = [
                "L",
                "RO",
                "SW",
                "TO",
                "AX",
                "HK",
                "PA",
                "MI",
                "F",
                "BE",
                "AS",
                "OL",
              ];

              if (intlSuffixes.includes(suffix)) {
                return false;
              }
            }

            return true;
          })
          .slice(0, 20)
          .map((item) => ({
            symbol: item.symbol,
            name: item.description,
            type: item.type,
            market: "stocks",
            active: true,
            primaryExchange: item.displaySymbol || item.symbol,
            currency: item.currency,
          }));

        return results;
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Fetch all stock symbols from a specific exchange
   * Used for building the search index
   */
  async fetchStocksByExchange(exchange: string): Promise<ISearchResult[]> {
    if (!hasApiKey(FINNHUB_KEY)) {
      throw new Error("No FINNHUB_KEY configured");
    }

    try {
      const url = `${this.baseUrl}/stock/symbol?exchange=${encodeURIComponent(
        exchange,
      )}&token=${FINNHUB_KEY}`;
      const response = await fetch(url);

      if (!response.ok) {
        return [];
      }

      const data = (await response.json()) as Array<{
        description: string;
        displaySymbol: string;
        symbol: string;
        type: string;
        currency?: string;
      }>;

      if (!data || !Array.isArray(data)) {
        return [];
      }

      // Map to ISearchResult format
      const results: ISearchResult[] = data
        .filter(
          (item) =>
            item.type === "Common Stock" ||
            item.type === "ETF" ||
            item.type === "ETP",
        )
        .map((item) => ({
          symbol: item.symbol,
          name: item.description,
          type: item.type,
          market: "stocks",
          active: true,
          primaryExchange: exchange,
          currency: item.currency || "USD", // Default to USD for US exchanges
        }));

      return results;
    } catch (error) {
      return [];
    }
  }
  /**
   * Fetch company name for a given symbol (for exact matches)
   */
  async fetchCompanyName(symbol: string): Promise<string | null> {
    if (!hasApiKey(FINNHUB_KEY)) {
      return null;
    }

    try {
      const url = `${this.baseUrl}/stock/profile2?symbol=${encodeURIComponent(
        symbol,
      )}&token=${FINNHUB_KEY}`;
      const response = await fetch(url);

      if (response.ok) {
        const profile = (await response.json()) as { name?: string };
        return profile.name || null;
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}

export const finnhubService = new FinnhubService();
