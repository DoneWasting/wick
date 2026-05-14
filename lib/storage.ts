import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "../types";

const ALERTS_KEY = "@candle-alerts/alerts";

export async function loadAlerts(): Promise<Alert[]> {
  try {
    const raw = await AsyncStorage.getItem(ALERTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Alert[]) : [];
  } catch {
    return [];
  }
}

export async function saveAlerts(alerts: Alert[]): Promise<void> {
  await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
}

export async function clearAlerts(): Promise<void> {
  await AsyncStorage.removeItem(ALERTS_KEY);
}
