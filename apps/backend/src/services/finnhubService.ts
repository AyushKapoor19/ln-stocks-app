/**
 * Finnhub API Service
 *
 * Client for fetching real-time quote data and search from Finnhub
 */

import fetch from "node-fetch";
import { FINNHUB_KEY } from "../constants/config.js";
import type { IQuoteData, IFinnhubQuoteResponse } from "../types/quote.js";
import type { IFinnhubSearchResponse, ISearchResult } from "../types/search.js";

class FinnhubService {
  private baseUrl = "https://finnhub.io/api/v1";

  async fetchQuote(symbol: string): Promise<IQuoteData | null> {
    if (!FINNHUB_KEY) {
      console.log(`🔑 No FINNHUB_KEY set for ${symbol}`);
      return null;
    }

    try {
      console.log(`Fetching quote from Finnhub for ${symbol}...`);

      // Fetch quote and currency in parallel
      const [quoteResponse, profileResponse] = await Promise.all([
        fetch(
          `${this.baseUrl}/quote?symbol=${encodeURIComponent(
            symbol
          )}&token=${FINNHUB_KEY}`
        ),
        fetch(
          `${this.baseUrl}/stock/profile2?symbol=${encodeURIComponent(
            symbol
          )}&token=${FINNHUB_KEY}`
        ),
      ]);

      if (!quoteResponse.ok) {
        const errorText = await quoteResponse.text();
        console.log(
          `❌ Finnhub quote failed for ${symbol}: ${quoteResponse.status} - ${errorText}`
        );
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

        console.log(
          `✅ Got quote for ${symbol}: $${currentPrice} (${currency}) (H: ${data.h}, L: ${data.l})`
        );

        return {
          symbol: symbol,
          price: Math.round(currentPrice * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePct: Math.round(changePct * 10000) / 10000,
          time: data.t * 1000,
          source: "finnhub_quote",
          dayHigh: data.h ? Math.round(data.h * 100) / 100 : undefined,
          dayLow: data.l ? Math.round(data.l * 100) / 100 : undefined,
          open: data.o ? Math.round(data.o * 100) / 100 : undefined,
          previousClose: previousClose
            ? Math.round(previousClose * 100) / 100
            : undefined,
          currency: currency,
        };
      }

      console.log(
        `⚠️ Finnhub returned no quote data for ${symbol}: ${JSON.stringify(
          data
        )}`
      );
      return null;
    } catch (error) {
      console.log(`💥 Error fetching quote for ${symbol}:`, error);
      return null;
    }
  }

  async searchSymbols(query: string): Promise<ISearchResult[]> {
    if (!FINNHUB_KEY) {
      throw new Error("No FINNHUB_KEY configured");
    }

    try {
      console.log(`Searching for: ${query}`);

      const url = `${this.baseUrl}/search?q=${encodeURIComponent(
        query
      )}&token=${FINNHUB_KEY}`;
      const response = await fetch(url);

      if (!response.ok) {
        console.log(`❌ Finnhub search failed: ${response.status}`);
        return [];
      }

      const data = (await response.json()) as IFinnhubSearchResponse;

      if (data && data.result && data.result.length > 0) {
        // Filter for Common Stock or ETF only
        const filteredResults = data.result.filter(
          (item) => item.type === "Common Stock" || item.type === "ETF"
        );

        // Fetch currency for each stock in parallel (limit to 30 for performance)
        const resultsWithCurrency = await Promise.all(
          filteredResults.slice(0, 30).map(async (item) => {
            try {
              // Fetch company profile to get currency
              const profileUrl = `${
                this.baseUrl
              }/stock/profile2?symbol=${encodeURIComponent(
                item.symbol
              )}&token=${FINNHUB_KEY}`;
              const profileResponse = await fetch(profileUrl);

              if (profileResponse.ok) {
                const profile = (await profileResponse.json()) as {
                  currency?: string;
                };
                return {
                  ...item,
                  currency: profile.currency || "UNKNOWN",
                };
              }

              return { ...item, currency: "UNKNOWN" };
            } catch (error) {
              return { ...item, currency: "UNKNOWN" };
            }
          })
        );

        // Filter for USD only
        const results = resultsWithCurrency
          .filter((item) => item.currency === "USD")
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

        console.log(`✅ Found ${results.length} USD stocks for "${query}"`);
        return results;
      }

      return [];
    } catch (error) {
      console.log(`💥 Search error:`, error);
      return [];
    }
  }

  /**
   * Fetch all stock symbols from a specific exchange
   * Used for building the search index
   */
  async fetchStocksByExchange(exchange: string): Promise<ISearchResult[]> {
    if (!FINNHUB_KEY) {
      throw new Error("No FINNHUB_KEY configured");
    }

    try {
      console.log(`  Fetching stocks from ${exchange}...`);

      const url = `${this.baseUrl}/stock/symbol?exchange=${encodeURIComponent(
        exchange
      )}&token=${FINNHUB_KEY}`;
      const response = await fetch(url);

      if (!response.ok) {
        console.log(
          `  ❌ Finnhub fetch failed for ${exchange}: ${response.status}`
        );
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
        console.log(`  ❌ Invalid response from Finnhub for ${exchange}`);
        return [];
      }

      // Map to ISearchResult format
      const results: ISearchResult[] = data
        .filter(
          (item) =>
            item.type === "Common Stock" ||
            item.type === "ETF" ||
            item.type === "ETP"
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

      console.log(`  ✅ ${exchange}: ${results.length} stocks`);
      return results;
    } catch (error) {
      console.log(`  💥 Error fetching from ${exchange}:`, error);
      return [];
    }
  }
}

export const finnhubService = new FinnhubService();
