/**
 * Quotes Route Handler
 *
 * Handles /v1/quotes endpoint for real-time stock quotes
 */

import type { FastifyRequest, FastifyReply } from "fastify";
import { cacheService } from "../services/cacheService.js";
import { finnhubService } from "../services/finnhubService.js";
import { generateFallbackQuote } from "../utils/fallbackData.js";
import { parseSymbols } from "../utils/validation.js";
import type { IQuotesResponse, IQuoteData } from "../types/quote.js";
import type { IQueryParams } from "../types/api.js";

export async function quotesRoute(
  request: FastifyRequest<{ Querystring: IQueryParams }>,
  reply: FastifyReply,
): Promise<IQuotesResponse> {
  const symbols = parseSymbols(request.query.symbols);

  if (symbols.length === 0) {
    reply.code(400);
    return { error: "symbols required" } as unknown as IQuotesResponse;
  }

  const out: IQuotesResponse = {};

  for (const symbol of symbols) {
    try {
      // Check cache first
      const cached = cacheService.getQuote(symbol);
      if (cached) {
        out[symbol] = cached;
        continue;
      }

      // Try Finnhub
      const quote = await finnhubService.fetchQuote(symbol);
      if (quote) {
        cacheService.setQuote(symbol, quote);
        out[symbol] = quote;
        continue;
      }

      // Fallback
      const fallback = generateFallbackQuote(symbol);
      cacheService.setQuote(symbol, fallback);
      out[symbol] = fallback;
    } catch (error) {
      out[symbol] = {
        symbol: symbol,
        price: 100,
        change: 0,
        changePct: 0,
        time: Date.now(),
        source: "error",
      };
    }
  }

  return out;
}
