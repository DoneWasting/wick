import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

// expo-haptics throws "Haptics is not available" on web. Wrapping every call
// at the import site would be noisy, so this module centralizes the guard.
const isWeb = Platform.OS === "web";

export function selection(): void {
  if (isWeb) return;
  void Haptics.selectionAsync();
}

export function impactLight(): void {
  if (isWeb) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function impactMedium(): void {
  if (isWeb) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}
