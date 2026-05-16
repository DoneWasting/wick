export type Market = "forex" | "crypto";

export type Timeframe = "1m" | "5m" | "15m" | "30m" | "1h" | "4h";

// Values are minutes before candle close. 0.5 = 30 seconds.
export type NotifyBefore = 0 | 0.5 | 1 | 2 | 3 | 5 | 10;

export interface Alert {
  id: string;
  market: Market;
  timeframe: Timeframe;
  notifyBefore: NotifyBefore[];
  enabled: boolean;
  createdAt: number;
}

export const TIMEFRAME_MINUTES: Record<Timeframe, number> = {
  "1m": 1,
  "5m": 5,
  "15m": 15,
  "30m": 30,
  "1h": 60,
  "4h": 240,
};

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  "1m": "1 minute",
  "5m": "5 minutes",
  "15m": "15 minutes",
  "30m": "30 minutes",
  "1h": "1 hour",
  "4h": "4 hours",
};

export const TIMEFRAME_CARD_LABELS: Record<Timeframe, string> = {
  "1m": "1 minute candle",
  "5m": "5 minutes candle",
  "15m": "15 minutes candle",
  "30m": "30 minutes candle",
  "1h": "1 hour candle",
  "4h": "4 hours candle",
};

export const NOTIFY_BEFORE_LABELS: Record<NotifyBefore, string> = {
  0: "At closing time",
  0.5: "30 seconds before",
  1: "1 minute before",
  2: "2 minutes before",
  3: "3 minutes before",
  5: "5 minutes before",
  10: "10 minutes before",
};

export const ALL_TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "30m", "1h", "4h"];
export const ALL_NOTIFY_BEFORE: NotifyBefore[] = [0, 0.5, 1, 2, 3, 5, 10];
