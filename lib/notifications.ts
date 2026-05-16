import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import {
  Alert,
  NotifyBefore,
  TIMEFRAME_LABELS,
} from "../types";
import { getUpcomingCandleCloses } from "./candleMath";
import { getSoundEnabled, getVibrationEnabled } from "./settings";

const isWeb = Platform.OS === "web";
const isAndroid = Platform.OS === "android";

// Android requires notifications to belong to a channel, and sound + vibration +
// lockscreen-visibility are bound to the channel (not the notification).
// We use one channel per (sound, vibration) combination so the in-app "Sound"
// and "Vibration" toggles can switch between them without prompting the user.
//
// IMPORTANT: once a channel is created on the device, the app cannot change
// its properties. To roll out new defaults we bump the id (-v2, -v3 ...).
// Old channels become orphaned in Settings but are harmless.
export const ANDROID_CHANNEL_ID_SOUND = "candle-alerts-v2"; // sound + vibration
export const ANDROID_CHANNEL_ID_SOUND_NOVIB = "candle-alerts-novib-v1"; // sound, no vibration
export const ANDROID_CHANNEL_ID_SILENT = "candle-alerts-silent-v2"; // silent + vibration
export const ANDROID_CHANNEL_ID_SILENT_NOVIB = "candle-alerts-silent-novib-v1"; // silent, no vibration

function pickChannelId(soundOn: boolean, vibrateOn: boolean): string {
  if (soundOn) {
    return vibrateOn ? ANDROID_CHANNEL_ID_SOUND : ANDROID_CHANNEL_ID_SOUND_NOVIB;
  }
  return vibrateOn ? ANDROID_CHANNEL_ID_SILENT : ANDROID_CHANNEL_ID_SILENT_NOVIB;
}

// How far into the future we eagerly schedule fires per alert.
// 72 hours covers any reasonable "user closed the app for a while" gap.
const SCHEDULE_WINDOW_HOURS = 72;
// iOS caps pending notifications at 64 across the whole app. We stay
// generously below that per-alert; multi-alert overflow falls off the
// oldest (most-distant-future) entries first, which is acceptable.
const MAX_FIRES_PER_ALERT = 50;

type WebTimer = ReturnType<typeof setTimeout>;
const webTimers: Map<string, WebTimer[]> = new Map();

// Monotonic epoch tagged onto every SW message. The SW remembers the latest
// CANCEL/CANCEL_ALL epoch and drops any SCHEDULE that was decided before it,
// so a late-arriving (or post-restart) schedule can never re-arm something
// the user just turned off.
let nextEpoch = 0;
function newEpoch(): number {
  return ++nextEpoch;
}

// Prefer the active worker; fall back to waiting/installing so a message
// posted during a SW update transition isn't silently dropped.
function pickSwTarget(reg: ServiceWorkerRegistration): ServiceWorker | null {
  return reg.active || reg.waiting || reg.installing || null;
}

// Round-trip a message through the SW using a MessageChannel so the caller
// can await actual completion rather than fire-and-forget. The 5s timeout
// guards against a wedged or terminated SW — caller continues either way.
function sendSwMessage(target: ServiceWorker, msg: unknown): Promise<void> {
  return new Promise<void>((resolve) => {
    const channel = new MessageChannel();
    const done = () => {
      try { channel.port1.close(); } catch {}
      resolve();
    };
    const timeout = setTimeout(done, 5000);
    channel.port1.onmessage = () => {
      clearTimeout(timeout);
      done();
    };
    try {
      target.postMessage(msg, [channel.port2]);
    } catch {
      clearTimeout(timeout);
      done();
    }
  });
}

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
  let lead: string;
  if (notifyBefore === 0) {
    lead = "Candle is closing now";
  } else if (notifyBefore < 1) {
    lead = `Closes in ${notifyBefore * 60} seconds`;
  } else {
    lead = `Closes in ${notifyBefore} minute${notifyBefore === 1 ? "" : "s"}`;
  }
  const body = `${lead} — ${marketLabel}`;
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

/**
 * Create both notification channels on Android. No-op everywhere else.
 * Must run before the first notification is scheduled — call from _layout.
 *
 * Re-creating a channel with the same id is a no-op for properties like
 * sound (Android caches them at first creation), so it's safe to call
 * this on every app start.
 */
export async function initAndroidChannels(): Promise<void> {
  if (!isAndroid) return;

  // sound on → MAX (heads-up + sound + wake); sound off → still HIGH so it
  // shows a heads-up, just without the chime.
  const channelConfigs: Array<{
    id: string;
    name: string;
    sound: string | null;
    enableVibrate: boolean;
  }> = [
    { id: ANDROID_CHANNEL_ID_SOUND, name: "Candle close alerts", sound: "alert.mp3", enableVibrate: true },
    { id: ANDROID_CHANNEL_ID_SOUND_NOVIB, name: "Candle close alerts (no vibration)", sound: "alert.mp3", enableVibrate: false },
    { id: ANDROID_CHANNEL_ID_SILENT, name: "Candle close alerts (silent)", sound: null, enableVibrate: true },
    { id: ANDROID_CHANNEL_ID_SILENT_NOVIB, name: "Candle close alerts (silent, no vibration)", sound: null, enableVibrate: false },
  ];

  for (const c of channelConfigs) {
    await Notifications.setNotificationChannelAsync(c.id, {
      name: c.name,
      importance: c.sound
        ? Notifications.AndroidImportance.MAX
        : Notifications.AndroidImportance.HIGH,
      // filename in android/app/src/main/res/raw/ (bundled by the plugin)
      sound: c.sound,
      enableVibrate: c.enableVibrate,
      vibrationPattern: c.enableVibrate ? [0, 250, 250, 250] : undefined,
      lightColor: "#4a90e2",
      // PUBLIC = full content visible on lock screen. Without this, many OEMs
      // hide our notifications entirely when the device is locked, which is
      // exactly the "nothing fires until I unlock" symptom.
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
      showBadge: true,
    });
  }
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
  const vibrateOn = await getVibrationEnabled();

  if (isWeb) {
    const reg = await getServiceWorker();
    const target = reg ? pickSwTarget(reg) : null;
    if (target) {
      await sendSwMessage(target, {
        type: "SCHEDULE",
        payload: {
          alertId: alert.id,
          epoch: newEpoch(),
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
  const channelId = pickChannelId(soundOn, vibrateOn);
  for (const f of fires) {
    await Notifications.scheduleNotificationAsync({
      identifier: f.id,
      content: {
        title: f.title,
        body: f.body,
        // iOS reads sound from the content; pass the bundled filename when on,
        // false to silence the per-notification chime when off.
        sound: soundOn ? "alert.mp3" : false,
        // Legacy Android (< 8.0) ignores channel importance and uses
        // notification priority instead. Newer Android ignores this. Setting
        // it is harmless and broadens compatibility.
        priority: Notifications.AndroidNotificationPriority.MAX,
        // Legacy Android (< 8.0) reads vibration from the notification, not
        // the channel; omit it entirely when vibration is off.
        vibrate: vibrateOn ? [0, 250, 250, 250] : undefined,
      },
      // Android reads the channel from the trigger object; iOS ignores it.
      trigger: isAndroid
        ? { date: f.fireAt, channelId }
        : new Date(f.fireAt),
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
    const target = reg ? pickSwTarget(reg) : null;
    if (target) {
      await sendSwMessage(target, {
        type: "CANCEL",
        payload: { alertId, epoch: newEpoch() },
      });
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
    const target = reg ? pickSwTarget(reg) : null;
    if (target) {
      await sendSwMessage(target, {
        type: "CANCEL_ALL",
        payload: { epoch: newEpoch() },
      });
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
  const vibrateOn = await getVibrationEnabled();
  const channelId = pickChannelId(soundOn, vibrateOn);
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: soundOn ? "alert.mp3" : false,
    },
    // For "fire immediately on Android" we need an object trigger so we can
    // attach channelId. seconds: 1 is close enough to immediate.
    trigger: isAndroid ? { seconds: 1, channelId } : null,
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

