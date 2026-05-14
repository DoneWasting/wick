import { Alert, NotifyBefore } from "../types";
import { getNextCandleClose } from "./candleMath";

export interface NextFireInfo {
  fireAt: number;
  notifyBefore: NotifyBefore;
  candleCloseAt: number;
}

/**
 * Returns the next future notification fire for an alert. If every
 * scheduled fire for the current candle has already passed, it advances
 * to the next candle close and returns the earliest fire from that one.
 */
export function getNextFire(alert: Alert, nowMs: number = Date.now()): NextFireInfo {
  const tryCandle = (closeMs: number): NextFireInfo | null => {
    let earliest: NextFireInfo | null = null;
    for (const nb of alert.notifyBefore) {
      const fireAt = closeMs - nb * 60_000;
      if (fireAt > nowMs && (earliest === null || fireAt < earliest.fireAt)) {
        earliest = { fireAt, notifyBefore: nb, candleCloseAt: closeMs };
      }
    }
    return earliest;
  };

  let close = getNextCandleClose(alert.timeframe, new Date(nowMs)).getTime();
  let info = tryCandle(close);
  if (info) return info;

  // All fires for this candle already fired — roll to the next one.
  close = getNextCandleClose(alert.timeframe, new Date(close)).getTime();
  return tryCandle(close) ?? { fireAt: close, notifyBefore: 0, candleCloseAt: close };
}

/**
 * Formats a positive millisecond duration as a compact countdown.
 *   >= 1h     -> "2h 15m"
 *   >= 1m     -> "5m 23s"
 *   < 1m      -> "23s"
 *   <= 0      -> "now"
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return "now";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** "12:34:56" local 24h clock. */
export function formatClock(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** "12:34:56" UTC 24h clock. */
export function formatUtcClock(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}
