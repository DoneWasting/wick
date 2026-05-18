import AsyncStorage from "@react-native-async-storage/async-storage";
import { ALL_TIMEFRAMES, Timeframe } from "../types";

const LAST_TIMEFRAME_KEY = "@candle-alerts/last-timeframe";
const FALLBACK_TIMEFRAME: Timeframe = "15m";

// In-memory cache so create.tsx can read sync. Hydrated once at app start
// via loadLastTimeframe(); writes update both AsyncStorage and the cache.
let cached: Timeframe | null = null;

function isValidTimeframe(v: unknown): v is Timeframe {
  return typeof v === "string" && (ALL_TIMEFRAMES as readonly string[]).includes(v);
}

/**
 * Returns the most recently used timeframe (or the fallback if storage hasn't
 * loaded yet). Synchronous by design so the create screen can use it as an
 * initial state value without flashing a default.
 */
export function getLastTimeframeSync(): Timeframe {
  return cached ?? FALLBACK_TIMEFRAME;
}

/**
 * Hydrate the in-memory cache from AsyncStorage. Idempotent. Call once at
 * app start (from _layout) so subsequent reads are sync.
 */
export async function loadLastTimeframe(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(LAST_TIMEFRAME_KEY);
    if (isValidTimeframe(raw)) cached = raw;
  } catch {
    // Ignore — we'll fall back to the default until a write succeeds.
  }
}

export async function setLastTimeframe(tf: Timeframe): Promise<void> {
  cached = tf;
  try {
    await AsyncStorage.setItem(LAST_TIMEFRAME_KEY, tf);
  } catch {
    // Best-effort: the in-memory cache still serves this session.
  }
}
