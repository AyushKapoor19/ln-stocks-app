const BASE = process.env.API_URL ?? "http://localhost:8787";

export async function fetchQuotes(symbols: string[]) {
  const url = `${BASE}/v1/quotes?symbols=${encodeURIComponent(
    symbols.join(",")
  )}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("quotes failed");
  return r.json() as Promise<
    Record<
      string,
      {
        symbol: string;
        price: number;
        change: number;
        changePct: number;
        time: number;
      }
    >
  >;
}

export async function fetchSeries(symbols: string[], count = 40) {
  const url = `${BASE}/v1/series?symbols=${encodeURIComponent(
    symbols.join(",")
  )}&count=${count}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("series failed");
  return r.json() as Promise<
    Record<string, { symbol: string; points: { t: number; c: number }[] }>
  >;
}
