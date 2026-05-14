import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import {
  Alert,
  NotifyBefore,
  TIMEFRAME_LABELS,
} from "../types";
import { getUpcomingCandleCloses } from "./candleMath";
import { getSoundEnabled } from "./settings";

const isWeb = Platform.OS === "web";

// How far into the future we eagerly schedule fires per alert.
// 72 hours covers any reasonable "user closed the app for a while" gap.
const SCHEDULE_WINDOW_HOURS = 72;
// iOS caps pending notifications at 64 across the whole app. We stay
// generously below that per-alert; multi-alert overflow falls off the
// oldest (most-distant-future) entries first, which is acceptable.
const MAX_FIRES_PER_ALERT = 50;

type WebTimer = ReturnType<typeof setTimeout>;
const webTimers: Map<string, WebTimer[]> = new Map();

// Identifier embeds the fire timestamp so each fire is unique and can be
// cancelled individually. The alert id is the prefix, which lets us cancel
// the whole alert via getAllScheduledNotificationsAsync + startsWith filter.
function triggerId(alertId: string, fireAtMs: number, notifyBefore: NotifyBefore): string {
  return `${alertId}__${fireAtMs}__${notifyBefore}`;
}

export type PermissionState = "granted" | "denied" | "default";

export async function getPermissionState(): Promise<PermissionState> {
  if (isWeb) {
    if (typeof window === "undefined" || !("Notification" in window)) return "denied";
    const p = window.Notification.permission;
    if (p === "granted") return "granted";
    if (p === "denied") return "denied";
    return "default";
  }
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return "granted";
  if (!settings.canAskAgain) return "denied";
  return "default";
}

export async function ensurePermissions(): Promise<boolean> {
  if (isWeb) {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    if (window.Notification.permission === "granted") return true;
    if (window.Notification.permission === "denied") return false;
    const res = await window.Notification.requestPermission();
    return res === "granted";
  }
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  if (!settings.canAskAgain) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

function buildContent(alert: Alert, notifyBefore: NotifyBefore) {
  const tfLabel = TIMEFRAME_LABELS[alert.timeframe];
  const marketLabel = alert.market === "forex" ? "Forex" : "Crypto";
  const title = `${tfLabel} candle closing`;
  const body =
    notifyBefore === 0
      ? `Candle is closing now — ${marketLabel}`
      : `Closes in ${notifyBefore} minute${notifyBefore === 1 ? "" : "s"} — ${marketLabel}`;
  return { title, body };
}

interface PlannedFire {
  fireAt: number;
  notifyBefore: NotifyBefore;
  id: string;
  title: string;
  body: string;
}

/**
 * Enumerate every fire that should land within the next SCHEDULE_WINDOW_HOURS,
 * capped at MAX_FIRES_PER_ALERT. Pure math — no platform calls.
 */
function planFiresForAlert(alert: Alert): PlannedFire[] {
  const now = Date.now();
  const horizonMs = SCHEDULE_WINDOW_HOURS * 60 * 60 * 1000;
  const fires: PlannedFire[] = [];

  // Cap candle enumeration too: at one fire per notifyBefore per candle, we
  // can never need more candles than the per-alert fire cap.
  const closes = getUpcomingCandleCloses(
    alert.timeframe,
    new Date(now),
    horizonMs,
    MAX_FIRES_PER_ALERT
  );

  for (const close of closes) {
    if (fires.length >= MAX_FIRES_PER_ALERT) break;
    for (const nb of alert.notifyBefore) {
      if (fires.length >= MAX_FIRES_PER_ALERT) break;
      const fireAt = close.getTime() - nb * 60_000;
      if (fireAt <= now) continue;
      const { title, body } = buildContent(alert, nb);
      fires.push({
        fireAt,
        notifyBefore: nb,
        id: triggerId(alert.id, fireAt, nb),
        title,
        body,
      });
    }
  }

  // Sort by fire time so older entries get scheduled first; if we hit the iOS
  // 64-cap later it's the most-distant-future fires that get dropped.
  return fires.sort((a, b) => a.fireAt - b.fireAt);
}

// ────────────────────────────────────────────────────────────────────────────
// Web: Service Worker integration
// ────────────────────────────────────────────────────────────────────────────

let swRegistration: ServiceWorkerRegistration | null = null;
let swReadyPromise: Promise<ServiceWorkerRegistration | null> | null = null;

async function getServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isWeb) return null;
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  if (swRegistration) return swRegistration;
  if (swReadyPromise) return swReadyPromise;

  swReadyPromise = (async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      // Wait until the SW is actually controlling the page.
      await navigator.serviceWorker.ready;
      swRegistration = reg;
      return reg;
    } catch (e) {
      // Most likely cause: not HTTPS or localhost. The fallback path still works.
      return null;
    }
  })();
  return swReadyPromise;
}

/**
 * Best-effort: ensure the SW is registered on app start. Call from _layout.
 * Returns the registration if successful, or null if the browser doesn't
 * support service workers or the page is served over an insecure origin.
 */
export async function initWebNotificationsBackend(): Promise<ServiceWorkerRegistration | null> {
  return getServiceWorker();
}

function fireWebNotification(title: string, body: string, tag?: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (window.Notification.permission !== "granted") return;
  try {
    new window.Notification(title, { body, tag });
  } catch {
    // Chrome on Android via a regular tab needs the SW path; harmless otherwise.
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────

/**
 * Schedule every fire within the next SCHEDULE_WINDOW_HOURS window for one
 * alert. Idempotent given the caller cancels first (which both the store
 * mutations and the foreground re-arm do).
 *
 * On native: registers N date-triggered notifications.
 * On web: tells the Service Worker to register them via TimestampTrigger when
 * available (Chromium browsers), so the notifications fire even when the tab
 * is closed. Falls back to in-page setTimeout otherwise — same as before, but
 * with the bigger pre-arm window.
 */
export async function scheduleAlert(alert: Alert): Promise<void> {
  if (!alert.enabled || alert.notifyBefore.length === 0) return;

  const fires = planFiresForAlert(alert);
  if (fires.length === 0) return;

  const soundOn = await getSoundEnabled();

  if (isWeb) {
    const reg = await getServiceWorker();
    if (reg && reg.active) {
      reg.active.postMessage({
        type: "SCHEDULE",
        payload: {
          alertId: alert.id,
          fires: fires.map((f) => ({
            fireAt: f.fireAt,
            title: f.title,
            body: f.body,
            tag: f.id,
          })),
        },
      });
      // Done: SW owns these fires. Don't double-arm with setTimeout.
      return;
    }
    // No SW: fall back to in-page setTimeout. Only fires while tab is open.
    const handles: WebTimer[] = [];
    for (const f of fires) {
      const delay = f.fireAt - Date.now();
      const handle = setTimeout(() => fireWebNotification(f.title, f.body, f.id), delay);
      handles.push(handle);
    }
    webTimers.set(alert.id, handles);
    return;
  }

  // Native
  for (const f of fires) {
    await Notifications.scheduleNotificationAsync({
      identifier: f.id,
      content: { title: f.title, body: f.body, sound: soundOn ? "default" : false },
      trigger: new Date(f.fireAt),
    });
  }
}

export async function cancelAlert(alertId: string): Promise<void> {
  if (isWeb) {
    const handles = webTimers.get(alertId);
    if (handles) {
      handles.forEach(clearTimeout);
      webTimers.delete(alertId);
    }
    const reg = await getServiceWorker();
    if (reg && reg.active) {
      reg.active.postMessage({ type: "CANCEL", payload: { alertId } });
    }
    return;
  }
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => typeof n.identifier === "string" && n.identifier.startsWith(`${alertId}__`))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

export async function cancelAll(): Promise<void> {
  if (isWeb) {
    webTimers.forEach((arr) => arr.forEach(clearTimeout));
    webTimers.clear();
    const reg = await getServiceWorker();
    if (reg && reg.active) {
      reg.active.postMessage({ type: "CANCEL_ALL" });
    }
    return;
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function sendTestNotification(): Promise<boolean> {
  const granted = await ensurePermissions();
  if (!granted) return false;

  const title = "Test notification";
  const body = "If you can read this, notifications work.";

  if (isWeb) {
    // Prefer the SW so the notification shows even if the page is about to
    // navigate; falls back to the in-page Notification constructor otherwise.
    const reg = await getServiceWorker();
    if (reg) {
      await reg.showNotification(title, { body });
    } else {
      fireWebNotification(title, body);
    }
    return true;
  }
  const soundOn = await getSoundEnabled();
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: soundOn ? "default" : false },
    trigger: null,
  });
  return true;
}

export async function listScheduled(): Promise<string[]> {
  if (isWeb) {
    return Array.from(webTimers.keys());
  }
  const all = await Notifications.getAllScheduledNotificationsAsync();
  return all.map((n) => n.identifier).filter(Boolean) as string[];
}

