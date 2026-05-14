import AsyncStorage from "@react-native-async-storage/async-storage";

const SOUND_KEY = "@candle-alerts/sound";

/** Default-on. Stored as "1"/"0"; missing entry means default. */
export async function getSoundEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(SOUND_KEY);
  return v === null ? true : v === "1";
}

export async function setSoundEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(SOUND_KEY, enabled ? "1" : "0");
}
