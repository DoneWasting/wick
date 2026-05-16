import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "../types";

const ALERTS_KEY = "@candle-alerts/alerts";
const ORDER_KEY = "@candle-alerts/manually-ordered";

export interface AlertsSnapshot {
  alerts: Alert[];
  manuallyOrdered: boolean;
}

export async function loadAlerts(): Promise<AlertsSnapshot> {
  try {
    const [rawAlerts, rawOrder] = await Promise.all([
      AsyncStorage.getItem(ALERTS_KEY),
      AsyncStorage.getItem(ORDER_KEY),
    ]);
    const parsed = rawAlerts ? JSON.parse(rawAlerts) : [];
    const alerts = Array.isArray(parsed) ? (parsed as Alert[]) : [];
    const manuallyOrdered = rawOrder === "1";
    return { alerts, manuallyOrdered };
  } catch {
    return { alerts: [], manuallyOrdered: false };
  }
}

export async function saveAlerts(alerts: Alert[]): Promise<void> {
  await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
}

export async function saveManuallyOrdered(manuallyOrdered: boolean): Promise<void> {
  await AsyncStorage.setItem(ORDER_KEY, manuallyOrdered ? "1" : "0");
}

export async function clearAlerts(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(ALERTS_KEY),
    AsyncStorage.removeItem(ORDER_KEY),
  ]);
}
