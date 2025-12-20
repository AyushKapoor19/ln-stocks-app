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
      console.log(`📊 Fetching quote from Finnhub for ${symbol}...`);

      const url = `${this.baseUrl}/quote?symbol=${encodeURIComponent(
        symbol
      )}&token=${FINNHUB_KEY}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.log(
          `❌ Finnhub quote failed for ${symbol}: ${response.status} - ${errorText}`
        );
        return null;
      }

      const data = (await response.json()) as IFinnhubQuoteResponse;

      if (data && data.c !== undefined && data.c !== null) {
        const currentPrice = data.c;
        const previousClose = data.pc || data.o || currentPrice;
        const change = currentPrice - previousClose;
        const changePct = previousClose !== 0 ? change / previousClose : 0;

        console.log(`✅ Got quote for ${symbol}: $${currentPrice} (H: ${data.h}, L: ${data.l})`);

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
          previousClose: previousClose ? Math.round(previousClose * 100) / 100 : undefined,
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
      console.log(`🔍 Searching for: ${query}`);

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
        const results = data.result
          .filter((item) => item.type === "Common Stock" || item.type === "ETF")
          .slice(0, 10)
          .map((item) => ({
            symbol: item.symbol,
            name: item.description,
            type: item.type,
            market: "stocks",
            active: true,
            primaryExchange: item.displaySymbol || item.symbol,
          }));

        console.log(`✅ Found ${results.length} stocks for "${query}"`);
        return results;
      }

      return [];
    } catch (error) {
      console.log(`💥 Search error:`, error);
      return [];
    }
  }
}

export const finnhubService = new FinnhubService();
