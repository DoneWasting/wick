// Wick — Service Worker
//
// Goal: deliver scheduled notifications even when the tab is closed.
//
// Strategy:
//   1. If the browser supports the Notification Triggers API
//      (`TimestampTrigger` global in the SW context), use it. This causes
//      the OS / browser to fire the notification at the timestamp without
//      needing the SW to be alive. Currently supported in Chromium-based
//      browsers (Chrome, Edge, Opera).
//   2. Otherwise, fall back to in-SW setTimeout. The SW survives some
//      idle time after the tab closes, so this can still buy you a few
//      seconds-to-minutes of tab-closed delivery on Firefox/Safari, but
//      the OS will eventually terminate the SW and timers die with it.
//      For long horizons on non-Chromium browsers, treat this as tab-must-
//      be-open behavior — same as before the SW existed.
//
// Concurrency:
//   All SCHEDULE/CANCEL/CANCEL_ALL messages run through one serial promise
//   chain so an in-flight SCHEDULE cannot finish *after* a later CANCEL_ALL
//   and leak a TimestampTrigger registration. Each message also carries an
//   epoch counter from the main thread; CANCEL/CANCEL_ALL bump
//   `latestCancelEpoch` and any SCHEDULE with a stale epoch is dropped — a
//   second line of defense for SW restarts and multi-client posting.
//   Messages can include a MessagePort in `event.ports[0]`; we post `{ok:true}`
//   to it when the work for that message completes, so the main thread can
//   await actual completion instead of fire-and-forget postMessage.

/* global self, clients */

const FALLBACK_TIMERS = new Map(); // tag -> timeout id (only used when no TimestampTrigger)

let messageQueue = Promise.resolve();
let latestCancelEpoch = 0;

function enqueue(fn) {
  // Errors are swallowed so a single failing handler does not poison the chain.
  messageQueue = messageQueue.then(() => fn().catch(() => {}));
  return messageQueue;
}

function ack(port) {
  if (!port) return;
  try {
    port.postMessage({ ok: true });
  } catch {
    // Port already closed — main thread bailed via timeout. Harmless.
  }
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function hasTimestampTrigger() {
  return typeof self.TimestampTrigger === "function";
}

async function scheduleOne({ fireAt, title, body, tag }) {
  const now = Date.now();
  if (fireAt <= now) return; // already past — skip

  if (hasTimestampTrigger()) {
    try {
      await self.registration.showNotification(title, {
        body,
        tag,
        // eslint-disable-next-line no-undef
        showTrigger: new TimestampTrigger(fireAt),
        renotify: true,
      });
      return;
    } catch (e) {
      // Some Chromium variants throw if the user hasn't granted the implicit
      // notification-triggers permission. Fall through to setTimeout.
    }
  }

  const delay = fireAt - now;
  // Cap delay at ~24.8 days (max safe setTimeout). We won't ever schedule
  // beyond SCHEDULE_WINDOW_HOURS=72 from the main thread, but be defensive.
  if (delay > 2_147_483_000) return;

  const handle = setTimeout(() => {
    FALLBACK_TIMERS.delete(tag);
    self.registration.showNotification(title, { body, tag, renotify: true });
  }, delay);
  FALLBACK_TIMERS.set(tag, handle);
}

async function cancelByPrefix(alertId) {
  // Cancel pending fallback timers.
  for (const [tag, handle] of FALLBACK_TIMERS) {
    if (tag.startsWith(`${alertId}__`)) {
      clearTimeout(handle);
      FALLBACK_TIMERS.delete(tag);
    }
  }
  // Cancel TimestampTrigger-scheduled notifications.
  try {
    // includeTriggered: true is required to also list scheduled-but-not-fired
    // notifications in browsers that support Notification Triggers.
    const all = await self.registration.getNotifications({ includeTriggered: true });
    for (const n of all) {
      if (n.tag && n.tag.startsWith(`${alertId}__`)) {
        n.close();
      }
    }
  } catch {
    // Non-supporting browsers: getNotifications without the option still
    // returns currently-displayed notifications, which we close as best-effort.
    const all = await self.registration.getNotifications();
    for (const n of all) {
      if (n.tag && n.tag.startsWith(`${alertId}__`)) n.close();
    }
  }
}

async function cancelAll() {
  for (const handle of FALLBACK_TIMERS.values()) clearTimeout(handle);
  FALLBACK_TIMERS.clear();
  try {
    const all = await self.registration.getNotifications({ includeTriggered: true });
    for (const n of all) n.close();
  } catch {
    const all = await self.registration.getNotifications();
    for (const n of all) n.close();
  }
}

self.addEventListener("message", (event) => {
  const msg = event.data;
  if (!msg || typeof msg !== "object") return;

  const port = event.ports && event.ports[0];
  const source = event.source;

  event.waitUntil(
    enqueue(async () => {
      try {
        if (msg.type === "SCHEDULE") {
          const { alertId, fires, epoch } = msg.payload || {};
          if (!alertId || !Array.isArray(fires)) return;
          // Drop schedules that were decided before the latest cancellation.
          if (typeof epoch === "number" && epoch <= latestCancelEpoch) return;
          await cancelByPrefix(alertId);
          for (const f of fires) {
            await scheduleOne(f);
          }
          return;
        }

        if (msg.type === "CANCEL") {
          const { alertId, epoch } = msg.payload || {};
          if (!alertId) return;
          if (typeof epoch === "number" && epoch > latestCancelEpoch) {
            latestCancelEpoch = epoch;
          }
          await cancelByPrefix(alertId);
          return;
        }

        if (msg.type === "CANCEL_ALL") {
          const epoch = msg.payload && msg.payload.epoch;
          if (typeof epoch === "number" && epoch > latestCancelEpoch) {
            latestCancelEpoch = epoch;
          }
          await cancelAll();
          return;
        }

        if (msg.type === "PING") {
          if (source) {
            source.postMessage({
              type: "PONG",
              hasTimestampTrigger: hasTimestampTrigger(),
            });
          }
          return;
        }
      } finally {
        ack(port);
      }
    })
  );
});

// Clicking a notification focuses an existing tab or opens a new one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        if ("focus" in client) {
          await client.focus();
          return;
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow("/");
      }
    })()
  );
});
