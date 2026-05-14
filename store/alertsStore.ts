import { create } from "zustand";
import { Alert, Market, NotifyBefore, Timeframe } from "../types";
import { loadAlerts, saveAlerts, clearAlerts } from "../lib/storage";
import { cancelAlert, cancelAll, scheduleAlert } from "../lib/notifications";

interface AlertsState {
  alerts: Alert[];
  hydrated: boolean;

  hydrate: () => Promise<void>;
  addAlert: (input: {
    market: Market;
    timeframe: Timeframe;
    notifyBefore: NotifyBefore[];
  }) => Promise<{ ok: true; alert: Alert } | { ok: false; reason: "duplicate" }>;
  updateAlert: (
    id: string,
    input: { market: Market; timeframe: Timeframe; notifyBefore: NotifyBefore[] }
  ) => Promise<{ ok: true } | { ok: false; reason: "duplicate" | "not_found" }>;
  toggleAlert: (id: string, enabled: boolean) => Promise<void>;
  removeAlert: (id: string) => Promise<void>;
  removeAll: () => Promise<void>;
  rescheduleAll: () => Promise<void>;
}

function makeId(): string {
  // crypto.randomUUID is available in modern browsers and Hermes' newer builds.
  if (typeof globalThis !== "undefined" && (globalThis as any).crypto?.randomUUID) {
    return (globalThis as any).crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function persist(alerts: Alert[]) {
  await saveAlerts(alerts);
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts: [],
  hydrated: false,

  hydrate: async () => {
    const alerts = await loadAlerts();
    set({ alerts, hydrated: true });
  },

  addAlert: async ({ market, timeframe, notifyBefore }) => {
    const existing = get().alerts.find(
      (a) => a.market === market && a.timeframe === timeframe
    );
    if (existing) return { ok: false, reason: "duplicate" };

    const alert: Alert = {
      id: makeId(),
      market,
      timeframe,
      notifyBefore: [...notifyBefore].sort((a, b) => a - b),
      enabled: true,
      createdAt: Date.now(),
    };

    const next = [...get().alerts, alert];
    set({ alerts: next });
    await persist(next);
    await scheduleAlert(alert);
    return { ok: true, alert };
  },

  updateAlert: async (id, { market, timeframe, notifyBefore }) => {
    const current = get().alerts.find((a) => a.id === id);
    if (!current) return { ok: false, reason: "not_found" };

    const duplicate = get().alerts.find(
      (a) => a.id !== id && a.market === market && a.timeframe === timeframe
    );
    if (duplicate) return { ok: false, reason: "duplicate" };

    const sorted = [...notifyBefore].sort((a, b) => a - b);
    const next = get().alerts.map((a) =>
      a.id === id ? { ...a, market, timeframe, notifyBefore: sorted } : a
    );
    set({ alerts: next });
    await persist(next);

    // Re-arm: anything previously scheduled is now stale because timeframe
    // and/or notifyBefore values could have changed.
    await cancelAlert(id);
    const updated = next.find((a) => a.id === id);
    if (updated && updated.enabled) {
      await scheduleAlert(updated);
    }
    return { ok: true };
  },

  toggleAlert: async (id, enabled) => {
    const next = get().alerts.map((a) => (a.id === id ? { ...a, enabled } : a));
    set({ alerts: next });
    await persist(next);
    const target = next.find((a) => a.id === id);
    if (!target) return;
    if (enabled) {
      await scheduleAlert(target);
    } else {
      await cancelAlert(id);
    }
  },

  removeAlert: async (id) => {
    const next = get().alerts.filter((a) => a.id !== id);
    set({ alerts: next });
    await persist(next);
    await cancelAlert(id);
  },

  removeAll: async () => {
    set({ alerts: [] });
    await clearAlerts();
    await cancelAll();
  },

  rescheduleAll: async () => {
    const { alerts } = get();
    await cancelAll();
    await Promise.all(alerts.filter((a) => a.enabled).map((a) => scheduleAlert(a)));
  },
}));
