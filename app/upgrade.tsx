import React from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeftIcon, CheckIcon } from "../components/Icons";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors } from "../lib/theme";
import { toast } from "../lib/toast";
import { FREE_TIER_ALERT_LIMIT } from "../lib/billing";

// Placeholder upgrade screen. Replace the body with the real pricing flow
// once billing is wired (RevenueCat / StoreKit / etc).
const PRO_FEATURES = [
  "Unlimited alerts",
  "Per-pair alerts (BTC/USDT, EUR/USD, …)",
  "Custom labels per alert",
  "Quiet hours / Do Not Disturb",
  "Snooze and Open-chart from the notification",
];

export default function Upgrade() {
  const router = useRouter();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top", "bottom", "left", "right"]}
    >
      {Platform.OS === "web" && (
        <View style={{ alignItems: "center", paddingTop: 8 }}>
          <View
            style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#2a313c" }}
          />
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{ alignSelf: "flex-start", paddingVertical: 4, marginBottom: 8 }}
          accessibilityLabel="Back"
        >
          <ChevronLeftIcon size={26} color={colors.textPrimary} />
        </Pressable>

        <Text
          style={{
            color: colors.positive,
            fontSize: 13,
            fontWeight: "700",
            letterSpacing: 1.2,
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Wick Pro
        </Text>
        <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "700" }}>
          Trade with the full toolkit.
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8, lineHeight: 20 }}>
          The free tier covers {FREE_TIER_ALERT_LIMIT} alerts and the essentials. Pro lifts the limits and adds the features traders actually ask for.
        </Text>

        <View
          style={{
            marginTop: 24,
            padding: 18,
            borderRadius: 14,
            backgroundColor: colors.cardElevated,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
          }}
        >
          {PRO_FEATURES.map((f) => (
            <View
              key={f}
              style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 8 }}
            >
              <View style={{ marginRight: 12, marginTop: 2 }}>
                <CheckIcon size={18} color={colors.positive} />
              </View>
              <Text style={{ color: colors.textPrimary, fontSize: 15, flex: 1, lineHeight: 22 }}>
                {f}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 28, alignItems: "center" }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }}>
            Launching soon.
          </Text>
          <PrimaryButton
            label="Notify me at launch"
            tone="positive"
            onPress={() => toast("You're on the list. Thanks!")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
