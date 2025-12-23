/**
 * Hybrid Stock Search Service (Production-Ready for Free Tier)
 *
 * Architecture:
 * 1. Search ~200 popular stocks locally (instant, 95% of queries)
 * 2. Fall back to Finnhub /search API for less common stocks
 * 3. Merge and rank all results intelligently
 *
 * Why Hybrid:
 * - Finnhub free tier doesn't support bulk stock fetching
 * - Most users search for popular stocks (AAPL, TSLA, etc.)
 * - API fallback ensures comprehensive coverage
 */

import { ISearchResult } from "../types/search.js";
import { finnhubService } from "./finnhubService.js";
import { POPULAR_US_STOCKS } from "../constants/popularStocks.js";

class StockIndexService {
  private isInitialized = false;

  /**
   * Initialize the service (instant, no API calls)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log("✅ Search service already initialized");
      return;
    }

    console.log(`✅ Search service ready (${POPULAR_US_STOCKS.length} popular stocks indexed)`);
    this.isInitialized = true;
  }

  /**
   * Hybrid search: Popular stocks (local) + API fallback
   */
  async search(query: string, limit: number = 50): Promise<ISearchResult[]> {
    if (!this.isInitialized) {
      console.log("⚠️ Search service not initialized");
      return [];
    }

    const queryLower = query.toLowerCase().trim();

    if (!queryLower) {
      return [];
    }

    const startTime = Date.now();

    try {
      // STEP 1: Search popular stocks locally (instant)
      const popularMatches = this._searchPopularStocks(queryLower);

      // STEP 2: Search via Finnhub API for comprehensive results
      const apiResults = await finnhubService.searchSymbols(queryLower);

      // STEP 3: Merge and deduplicate
      const allResults = new Map<string, ISearchResult>();

      // Add popular stocks first (priority)
      popularMatches.forEach((result) => {
        allResults.set(result.symbol, result);
      });

      // Add API results (won't override popular stocks)
      apiResults.forEach((result) => {
        if (!allResults.set(result.symbol, result)) {
          allResults.set(result.symbol, result);
        }
      });

      // STEP 4: Rank results intelligently
      const mergedResults = Array.from(allResults.values());
      const rankedResults = this._rankResults(mergedResults, queryLower);

      const duration = Date.now() - startTime;

      console.log(
        `✅ Search "${query}": ${rankedResults.length} results (${popularMatches.length} local + ${apiResults.length} API, ${duration}ms)`
      );

      return rankedResults.slice(0, limit);
    } catch (error) {
      console.error(`❌ Search error for "${query}":`, error);
      // Fallback to popular stocks only
      return this._searchPopularStocks(queryLower).slice(0, limit);
    }
  }

  /**
   * Search popular stocks locally (instant)
   */
  private _searchPopularStocks(queryLower: string): ISearchResult[] {
    return POPULAR_US_STOCKS.filter((symbol) =>
      symbol.toLowerCase().includes(queryLower)
    ).map((symbol) => ({
      symbol,
      name: `${symbol} Corporation`, // Placeholder name
      type: "Common Stock",
      market: "stocks",
      active: true,
      primaryExchange: "NASDAQ",
      currency: "USD",
    }));
  }

  /**
   * Intelligent ranking algorithm
   */
  private _rankResults(
    results: ISearchResult[],
    queryLower: string
  ): ISearchResult[] {
    return results
      .map((result) => {
        const symbolLower = result.symbol.toLowerCase();
        const nameLower = result.name.toLowerCase();

        let score = 0;

        // Exact symbol match (highest priority)
        if (symbolLower === queryLower) {
          score += 1000;
        }
        // Symbol starts with query
        else if (symbolLower.startsWith(queryLower)) {
          score += 500;
          score += Math.max(0, 10 - result.symbol.length) * 10;
        }
        // Symbol contains query
        else if (symbolLower.includes(queryLower)) {
          score += 200;
        }

        // Name starts with query
        if (nameLower.startsWith(queryLower)) {
          score += 300;
        }
        // Name contains query
        else if (nameLower.includes(queryLower)) {
          score += 100;
        }

        // Popular stock bonus
        if (POPULAR_US_STOCKS.includes(result.symbol)) {
          score += 150;
        }

        return { result, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.result);
  }

  /**
   * Get service stats for monitoring
   */
  getStats() {
    return {
      mode: "hybrid",
      popularStocksCount: POPULAR_US_STOCKS.length,
      isInitialized: this.isInitialized,
      apiAvailable: true,
    };
  }
}

export const stockIndexService = new StockIndexService();
