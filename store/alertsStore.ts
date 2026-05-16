import { create } from "zustand";
import { Alert, Market, NotifyBefore, Timeframe, TIMEFRAME_MINUTES } from "../types";
import {
  loadAlerts,
  saveAlerts,
  saveManuallyOrdered,
  clearAlerts,
} from "../lib/storage";
import { cancelAlert, cancelAll, scheduleAlert } from "../lib/notifications";

interface AlertsState {
  alerts: Alert[];
  manuallyOrdered: boolean;
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
  toggleAll: (enabled: boolean) => Promise<void>;
  removeAlert: (id: string) => Promise<void>;
  removeAll: () => Promise<void>;
  reorderAlerts: (alerts: Alert[]) => Promise<void>;
  rescheduleAll: () => Promise<void>;
}

function makeId(): string {
  // crypto.randomUUID is available in modern browsers and Hermes' newer builds.
  if (typeof globalThis !== "undefined" && (globalThis as any).crypto?.randomUUID) {
    return (globalThis as any).crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function sortByTimeframe(alerts: Alert[]): Alert[] {
  return [...alerts].sort(
    (a, b) => TIMEFRAME_MINUTES[a.timeframe] - TIMEFRAME_MINUTES[b.timeframe]
  );
}

async function persist(alerts: Alert[]) {
  await saveAlerts(alerts);
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts: [],
  manuallyOrdered: false,
  hydrated: false,

  hydrate: async () => {
    const { alerts, manuallyOrdered } = await loadAlerts();
    // Default view is time-ascending. Manual order takes precedence once the
    // user has dragged at least once — we leave the persisted order untouched
    // in that case.
    const ordered = manuallyOrdered ? alerts : sortByTimeframe(alerts);
    set({ alerts: ordered, manuallyOrdered, hydrated: true });
    if (!manuallyOrdered && ordered.length > 0) {
      // Persist the sorted view so the next launch is consistent even before
      // any further mutations.
      await persist(ordered);
    }
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

    const current = get().alerts;
    // Even when the user has a manual order, new alerts are placed in their
    // natural time-sorted slot rather than appended to the end. The user's
    // existing relative ordering of the other items is preserved by using a
    // stable sort and only inserting the new alert.
    const next = get().manuallyOrdered
      ? insertByTimeframe(current, alert)
      : sortByTimeframe([...current, alert]);
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
    // Order is intentionally untouched here so toggling never re-sorts the
    // list and never disrupts the user's manual drag order.
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

  toggleAll: async (enabled) => {
    const next = get().alerts.map((a) => ({ ...a, enabled }));
    set({ alerts: next });
    await persist(next);
    await cancelAll();
    if (enabled) {
      await Promise.all(next.map((a) => scheduleAlert(a)));
    }
  },

  removeAlert: async (id) => {
    const next = get().alerts.filter((a) => a.id !== id);
    set({ alerts: next });
    await persist(next);
    await cancelAlert(id);
  },

  removeAll: async () => {
    set({ alerts: [], manuallyOrdered: false });
    await clearAlerts();
    await cancelAll();
  },

  reorderAlerts: async (alerts) => {
    set({ alerts, manuallyOrdered: true });
    await persist(alerts);
    await saveManuallyOrdered(true);
  },

  rescheduleAll: async () => {
    const { alerts } = get();
    await cancelAll();
    await Promise.all(alerts.filter((a) => a.enabled).map((a) => scheduleAlert(a)));
  },
}));

function insertByTimeframe(alerts: Alert[], newAlert: Alert): Alert[] {
  const newMin = TIMEFRAME_MINUTES[newAlert.timeframe];
  const idx = alerts.findIndex(
    (a) => TIMEFRAME_MINUTES[a.timeframe] > newMin
  );
  if (idx === -1) return [...alerts, newAlert];
  return [...alerts.slice(0, idx), newAlert, ...alerts.slice(idx)];
}
