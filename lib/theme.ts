import { StyleSheet } from "react-native";

export const colors = {
  bg: "#0E0E0E",
  cardBg: "#161616",
  cardElevated: "#161616",
  textPrimary: "#FFFFFF",
  textSecondary: "#9A9A9A",
  textDisabled: "#4a525c",
  // Neutral interactive accent. Used for selected radio/checkbox state and
  // for non-destructive dismiss actions ("Cancel"). Codified in BRAND.md
  // alongside the bullish/bearish signal colors.
  accentBlue: "#4a90e2",
  borderSubtle: "#242424",
  divider: "#242424",
  buttonFilled: "#374a63",
  buttonFilledDisabled: "#2a313c",
  // Bullish (on / positive / next-event). Signal color from BRAND.md.
  positive: "#1FBF7A",
  // Bearish (off / destructive). Signal color from BRAND.md.
  negative: "#E24B4A",
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
