import { useEffect } from "react";
import { Platform, AppState, AppStateStatus } from "react-native";
import * as Notifications from "expo-notifications";
import { useAlertsStore } from "../store/alertsStore";
import { scheduleAlert } from "../lib/notifications";

/**
 * Owns the rescheduling lifecycle.
 *
 * Each call to scheduleAlert pre-arms the next ~72h of fires for one alert,
 * so the app does NOT need to be running for subsequent candles to fire. The
 * native OS / browser-level scheduler delivers them.
 *
 * Re-arm triggers (each one is a top-up, not a lifeline):
 *   - hydration finishes -> initial schedule
 *   - alert list changes -> store handles per-alert; this hook also runs
 *     rescheduleAll which cancels and re-arms everything fresh
 *   - app foregrounds -> rebuild the 72h window from "now"
 *   - a notification fires (native) -> re-arm that alert's window
 */
export function useCandleScheduler() {
  const alerts = useAlertsStore((s) => s.alerts);
  const hydrated = useAlertsStore((s) => s.hydrated);
  const rescheduleAll = useAlertsStore((s) => s.rescheduleAll);

  // 1) Re-arm whenever the alert list changes after hydration.
  useEffect(() => {
    if (!hydrated) return;
    void rescheduleAll();
  }, [hydrated, alerts, rescheduleAll]);

  // 2) Re-arm when the app comes back to foreground.
  useEffect(() => {
    const handler = (state: AppStateStatus) => {
      if (state === "active") {
        void rescheduleAll();
      }
    };
    const sub = AppState.addEventListener("change", handler);
    return () => sub.remove();
  }, [rescheduleAll]);

  // 3) On native: every fired notification is an opportunity to extend our
  // 72h window further into the future. The pre-arm already covers the gap,
  // but doing this here means a power user who keeps the app installed for
  // a week never falls below ~71h of coverage.
  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = Notifications.addNotificationReceivedListener((n) => {
      const id = n.request.identifier;
      const alertId = id.split("__")[0];
      const alert = useAlertsStore.getState().alerts.find((a) => a.id === alertId);
      if (alert && alert.enabled) {
        void scheduleAlert(alert);
      }
    });
    return () => sub.remove();
  }, []);
}
