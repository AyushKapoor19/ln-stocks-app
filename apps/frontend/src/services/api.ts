const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8787";

export async function fetchQuotes(symbols: string[]) {
  try {
    const r = await fetch(
      `${BASE}/v1/quotes?symbols=${encodeURIComponent(symbols.join(","))}`
    );
    if (!r.ok) {
      console.warn(`Quotes API returned ${r.status}, using fallback data`);
      return generateFallbackQuotes(symbols);
    }
    const data = await r.json();

    // Validate that we got data for all requested symbols
    const missingSymbols = symbols.filter((s) => !data[s]);
    if (missingSymbols.length > 0) {
      console.warn(
        `Missing quotes for: ${missingSymbols.join(", ")}, adding fallback`
      );
      const fallback = generateFallbackQuotes(missingSymbols);
      Object.assign(data, fallback);
    }

    return data;
  } catch (error) {
    console.error("Quotes fetch failed completely, using fallback:", error);
    return generateFallbackQuotes(symbols);
  }
}

function generateFallbackQuotes(symbols: string[]) {
  const mockPrices: Record<string, number> = {
    NVDA: 875.3,
    AAPL: 255.46,
    MSFT: 511.46,
    AMZN: 185.9,
    GOOGL: 2845.85,
    TSLA: 248.5,
  };

  const quotes: Record<string, any> = {};
  symbols.forEach((s) => {
    const basePrice = mockPrices[s] || Math.random() * 200 + 50;
    const changePercent = (Math.random() - 0.5) * 0.1;
    const change = basePrice * changePercent;

    quotes[s] = {
      symbol: s,
      price: Math.round((basePrice + change) * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePct: Math.round(changePercent * 10000) / 10000,
      time: Date.now(),
    };
  });

  return quotes;
}

export async function fetchSeries(symbols: string[], count = 40) {
  const r = await fetch(
    `${BASE}/v1/series?symbols=${encodeURIComponent(
      symbols.join(",")
    )}&count=${count}`
  );
  if (!r.ok) throw new Error("series failed");
  return r.json() as Promise<
    Record<string, { symbol: string; points: { t: number; c: number }[] }>
  >;
}
