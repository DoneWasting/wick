import { Timeframe, TIMEFRAME_MINUTES } from "../types";

/**
 * Given a timeframe and a "now" timestamp, returns the timestamp of the
 * NEXT candle close aligned to UTC.
 *
 * Examples:
 *   - "1h"  @ 14:23 UTC -> 15:00 UTC
 *   - "4h"  @ 14:23 UTC -> 16:00 UTC (4h candles align to 00, 04, 08, 12, 16, 20)
 *   - "15m" @ 14:23 UTC -> 14:30 UTC
 *   - "1m"  @ 14:23:45 UTC -> 14:24:00 UTC
 *
 * The strict-greater-than guarantee ensures we never return "right now",
 * which would race with the candle itself.
 */
export function getNextCandleClose(timeframe: Timeframe, now: Date): Date {
  const minutesPerCandle = TIMEFRAME_MINUTES[timeframe];
  const msPerCandle = minutesPerCandle * 60_000;

  // Anchor: start of the current UTC day. UTC alignment is critical because
  // market data providers use UTC-aligned candle boundaries.
  const dayStart = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0,
    0,
    0,
    0
  );

  const msSinceDayStart = now.getTime() - dayStart;
  const candlesSinceDayStart = Math.floor(msSinceDayStart / msPerCandle);
  let nextCloseMs = dayStart + (candlesSinceDayStart + 1) * msPerCandle;

  // If "now" is exactly on a boundary, push forward one full candle.
  if (nextCloseMs <= now.getTime()) {
    nextCloseMs += msPerCandle;
  }

  return new Date(nextCloseMs);
}

export function getNotificationTime(
  candleClose: Date,
  notifyBeforeMinutes: number
): Date {
  return new Date(candleClose.getTime() - notifyBeforeMinutes * 60_000);
}

/**
 * Returns up to `limit` upcoming UTC-aligned candle closes within `horizonMs`
 * of `from`. Used to pre-schedule many future fires so the app doesn't have
 * to be alive to re-arm after each one.
 */
export function getUpcomingCandleCloses(
  timeframe: Timeframe,
  from: Date,
  horizonMs: number,
  limit: number
): Date[] {
  const out: Date[] = [];
  const endMs = from.getTime() + horizonMs;
  let cursor = from;
  while (out.length < limit) {
    const next = getNextCandleClose(timeframe, cursor);
    if (next.getTime() > endMs) break;
    out.push(next);
    cursor = next;
  }
  return out;
}
