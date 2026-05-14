# Wick

A cross-platform (web + iOS + Android) app for setting local notifications on Forex and Crypto candlestick closes. Built with Expo + expo-router + NativeWind v4.

## Quick start (web)

```bash
npm install
npx expo start --web
```

When the browser opens, allow notification permission when prompted. Then tap the pencil FAB and create a 1-minute alert with "At closing time" — you should get a browser notification within ~60s.

## Quick start (native)

```bash
npm install
npx expo start
# Press i for iOS simulator, a for Android emulator, or scan the QR with Expo Go.
```

Note: native push uses real `expo-notifications`, which only fires reliably when your app is **NOT** in foreground on most Android devices. The notification handler in `app/_layout.tsx` is configured to show them in-foreground anyway, but Doze mode can delay sub-minute timers on Android.

## Forex API key (optional)

The price panel for Forex alerts uses [TwelveData](https://twelvedata.com). Get a free key (800 requests/day, 8/min) at:

1. https://twelvedata.com/register
2. Copy your API key from the dashboard.
3. `cp .env.example .env`
4. Edit `.env` and set `EXPO_PUBLIC_TWELVEDATA_KEY=<your key>`.
5. Restart `expo start`.

Without a key, the Forex price panel falls back to **demo mode** (clearly labeled "demo"). Notifications still fire on real candle close times regardless — the API is only used for the optional in-card price display.

Crypto prices come from Binance's public API and never need a key.

## How to test notifications fast

1. Open the app and grant notification permission.
2. Tap the pencil FAB.
3. Pick **Crypto** (or Forex) → **1 minute** → check **At closing time**.
4. Tap **Create**.
5. Wait at most 60 seconds. You should see a notification: `1 minute candle closing` — `Candle is closing now — Crypto`.

To prove it's UTC-aligned: open the app at `12:34:30` UTC. The 1-minute alert will fire exactly at `12:35:00` UTC.

## Tests the app passes

1. ✅ `npx expo start --web` opens without errors.
2. ✅ Creating a 1m alert with `At closing time` fires within ~60s.
3. ✅ Toggling an alert off cancels its scheduled triggers (verified by `Notifications.getAllScheduledNotificationsAsync` on native, by clearing internal timers on web).
4. ✅ Reloading the app rehydrates alerts from AsyncStorage and reschedules them.
5. ✅ Multiple `notifyBefore` values per alert all schedule independently and render as separate rows with a bell icon.

## Known web limitations

| Feature | Web | iOS / Android |
|---|---|---|
| Permission | `Notification.requestPermission()` (requires HTTPS or localhost) | `expo-notifications` permission |
| Background firing | Only while the tab is open | Real OS notifications |
| Cancellation | `clearTimeout` of in-memory handles | `Notifications.cancelScheduledNotificationAsync` |
| Persistence after reload | Hydrates from AsyncStorage and re-arms timers | Hydrates from AsyncStorage; native triggers persist across reloads |
| Background tab | Browsers may throttle `setTimeout` in background tabs by up to 1 minute | Not affected |

**The big web caveat**: if you close the tab, no notification will fire. That's a browser/PWA limitation, not the app — making it work without an open tab would require a service worker with Web Push (FCM/APNs), which is out of scope here.

## Architecture

```
app/
  _layout.tsx              Root: notification handler, permission request, hydration
  index.tsx                "Wick" home with FAB
  create.tsx               3-step modal wizard
components/
  AlertCard.tsx            Row with toggle, bell rows, expandable price
  WizardStep.tsx           Numbered circle + vertical rail
  MarketSelector.tsx       Forex / Crypto radio
  TimeframeSelector.tsx    1m..4h radio list
  NotificationTimingPicker.tsx  Checkbox grid, filters out >= timeframe
  EmptyState.tsx           "No alerts yet" placeholder
  PrimaryButton.tsx        Filled and text variants
  Toast.tsx                Bottom toast for "Already exists"
  Icons.tsx                Inline SVG icons
hooks/
  useAlerts.ts             Hydration entry point + CRUD facade
  useCandleScheduler.ts    Reacts to alert changes, app foreground, and notification delivery to re-arm next-close timers
  useMarketData.ts         Binance (crypto) + TwelveData (forex) with 30s cache and demo fallback
lib/
  candleMath.ts            getNextCandleClose, UTC-aligned
  notifications.ts         schedule/cancel/list — unified across web (setTimeout) and native (expo-notifications)
  storage.ts               AsyncStorage helpers
store/
  alertsStore.ts           zustand store, persisted on every mutation
types/
  index.ts                 Alert, Market, Timeframe, NotifyBefore + label maps
```

## Why we re-arm instead of using a recurring trigger

`expo-notifications` has no native concept of "every Nth candle close aligned to UTC". A 1h alert at 14:23 must fire at 15:00, 16:00, 17:00 … with each fire perfectly snapping to the UTC hour. We schedule **only the next** close, then re-arm:

- On native: a `notificationReceived` listener re-calls `scheduleAlertNext` for that alert.
- On web: the `setTimeout` callback fires the browser notification and then schedules the next one.
- On app foreground: we cancel and re-arm everything in case timers were paused by the OS.

This keeps the alignment exact even after sleep/wake cycles.
