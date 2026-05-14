import { StyleSheet } from "react-native";

export const colors = {
  bg: "#0a0e14",
  cardBg: "#111821",
  cardElevated: "#0f1620",
  textPrimary: "#e6e8eb",
  textSecondary: "#8a929c",
  textDisabled: "#4a525c",
  accentBlue: "#4a90e2",
  accentBlueDark: "#1e3a5f",
  accentBlueSoft: "#7fb0e8",
  borderSubtle: "#1a2230",
  divider: "#1a2230",
  buttonFilled: "#374a63",
  buttonFilledDisabled: "#2a313c",
  switchTrackOff: "#2a313c",
  switchTrackOn: "#7fb0e8",
  switchThumbOn: "#1e3a5f",
  switchThumbOff: "#6b7380",
  positive: "#4ade80",
  negative: "#f87171",
} as const;

export const s = StyleSheet.create({
  flex1: { flex: 1 },
  row: { flexDirection: "row" },
  rowCenter: { flexDirection: "row", alignItems: "center" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  center: { alignItems: "center", justifyContent: "center" },
  bg: { backgroundColor: colors.bg },
  card: { backgroundColor: colors.cardBg },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  textPrimary: { color: colors.textPrimary },
  textSecondary: { color: colors.textSecondary },
  textDisabled: { color: colors.textDisabled },
  accent: { color: colors.accentBlue },
});
