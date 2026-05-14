import { useEffect } from "react";
import { useAlertsStore } from "../store/alertsStore";

export function useAlerts() {
  const alerts = useAlertsStore((s) => s.alerts);
  const hydrated = useAlertsStore((s) => s.hydrated);
  const hydrate = useAlertsStore((s) => s.hydrate);

  useEffect(() => {
    if (!hydrated) {
      void hydrate();
    }
  }, [hydrated, hydrate]);

  return {
    alerts,
    hydrated,
    addAlert: useAlertsStore.getState().addAlert,
    updateAlert: useAlertsStore.getState().updateAlert,
    toggleAlert: useAlertsStore.getState().toggleAlert,
    removeAlert: useAlertsStore.getState().removeAlert,
    removeAll: useAlertsStore.getState().removeAll,
  };
}
