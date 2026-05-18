import React from "react";
import { useRouter } from "expo-router";
import { useAlerts } from "../hooks/useAlerts";
import { AlertForm } from "../components/AlertForm";
import { NotifyBefore } from "../types";
import { toast } from "../lib/toast";
import { getLastTimeframeSync, setLastTimeframe } from "../lib/preferences";

// Pre-checking "1 minute before" lets the median user land on this screen,
// pick a market, and tap Create without touching the timing list.
const DEFAULT_NOTIFY: NotifyBefore[] = [1];

export default function CreateAlert() {
  const router = useRouter();
  const { addAlert } = useAlerts();

  return (
    <AlertForm
      title="New alert"
      initialMarket={null}
      // Carry over the last timeframe the user chose so creating several alerts
      // in a row doesn't make them re-pick the same value each time.
      initialTimeframe={getLastTimeframeSync()}
      initialNotifyBefore={DEFAULT_NOTIFY}
      submitLabel="Create"
      onSubmit={async ({ market, timeframe, notifyBefore }) => {
        const res = await addAlert({ market, timeframe, notifyBefore });
        if (!res.ok) {
          toast("Already exists, edit it instead");
          return;
        }
        void setLastTimeframe(timeframe);
        toast("Alert created");
        router.back();
      }}
      onCancel={() => router.back()}
    />
  );
}
