import { useCallback, useEffect, useRef, useState } from "react";
import { Market, Timeframe, TIMEFRAME_MINUTES } from "../types";

interface MarketSnapshot {
  symbol: string;
  price: number;
  changePct: number;
  demo: boolean;
  fetchedAt: number;
}

interface CacheEntry {
  snapshot: MarketSnapshot;
  expiresAt: number;
}

const CACHE_MS = 30_000;
const cache: Map<string, CacheEntry> = new Map();

function timeframeToBinanceInterval(tf: Timeframe): string {
  return tf; // Binance uses identical short codes (1m, 5m, 15m, 30m, 1h, 4h).
}

function timeframeToTwelveDataInterval(tf: Timeframe): string {
  switch (tf) {
    case "1m":
      return "1min";
    case "5m":
      return "5min";
    case "15m":
      return "15min";
    case "30m":
      return "30min";
    case "1h":
      return "1h";
    case "4h":
      return "4h";
  }
}

async function fetchCrypto(timeframe: Timeframe): Promise<MarketSnapshot> {
  const symbol = "BTCUSDT";
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframeToBinanceInterval(
    timeframe
  )}&limit=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance error ${res.status}`);
  const json = (await res.json()) as Array<Array<string | number>>;
  if (!Array.isArray(json) || json.length === 0) throw new Error("Empty kline");
  const k = json[0];
  const open = Number(k[1]);
  const close = Number(k[4]);
  const price = close;
  const changePct = open === 0 ? 0 : ((close - open) / open) * 100;
  return {
    symbol: "BTC/USDT",
    price,
    changePct,
    demo: false,
    fetchedAt: Date.now(),
  };
}

async function fetchForex(timeframe: Timeframe): Promise<MarketSnapshot> {
  const key = process.env.EXPO_PUBLIC_TWELVEDATA_KEY;
  const symbol = "EUR/USD";
  if (!key || key === "your_key_here") {
    return demoSnapshot(symbol);
  }
  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(
    symbol
  )}&interval=${timeframeToTwelveDataInterval(timeframe)}&outputsize=1&apikey=${key}`;
  const res = await fetch(url);
  if (!res.ok) return demoSnapshot(symbol);
  const json = await res.json();
  if (json.status === "error" || !json.values?.length) return demoSnapshot(symbol);
  const v = json.values[0];
  const open = Number(v.open);
  const close = Number(v.close);
  const price = close;
  const changePct = open === 0 ? 0 : ((close - open) / open) * 100;
  return {
    symbol,
    price,
    changePct,
    demo: false,
    fetchedAt: Date.now(),
  };
}

function demoSnapshot(symbol: string): MarketSnapshot {
  // Deterministic-ish demo so it doesn't jitter wildly between refreshes.
  const seed = (Date.now() / 60_000) | 0;
  const price = 1.085 + ((seed % 17) - 8) * 0.0007;
  const changePct = ((seed % 7) - 3) * 0.03;
  return {
    symbol,
    price,
    changePct,
    demo: true,
    fetchedAt: Date.now(),
  };
}

export function useMarketData(market: Market, timeframe: Timeframe) {
  const cacheKey = `${market}:${timeframe}`;
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(() => {
    const c = cache.get(cacheKey);
    return c && c.expiresAt > Date.now() ? c.snapshot : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snap =
        market === "crypto" ? await fetchCrypto(timeframe) : await fetchForex(timeframe);
      cache.set(cacheKey, { snapshot: snap, expiresAt: Date.now() + CACHE_MS });
      if (mounted.current) setSnapshot(snap);
    } catch (e: any) {
      const fallback = demoSnapshot(market === "crypto" ? "BTC/USDT" : "EUR/USD");
      cache.set(cacheKey, { snapshot: fallback, expiresAt: Date.now() + CACHE_MS });
      if (mounted.current) {
        setSnapshot(fallback);
        setError(e?.message ?? "Failed to fetch");
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [market, timeframe, cacheKey]);

  useEffect(() => {
    mounted.current = true;
    const c = cache.get(cacheKey);
    if (!c || c.expiresAt <= Date.now()) {
      void refresh();
    } else {
      setSnapshot(c.snapshot);
    }
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  return { snapshot, loading, error, refresh };
}

export type { MarketSnapshot };
// Silence unused import warning if TIMEFRAME_MINUTES is reintroduced later.
void TIMEFRAME_MINUTES;
