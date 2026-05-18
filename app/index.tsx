import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAlerts } from "../hooks/useAlerts";
import { AlertList } from "../components/AlertList";
import { EmptyState } from "../components/EmptyState";
import { MenuIcon, PlusIcon } from "../components/Icons";
import { ChipButton } from "../components/ChipButton";
import { colors } from "../lib/theme";
import { useNow } from "../hooks/useNow";
import {
  formatClock,
  formatCountdown,
  formatUtcClock,
  getNextFire,
} from "../lib/countdown";
import { Sidebar } from "../components/Sidebar";
import { CandleToggle } from "../components/CandleToggle";
import { FREE_TIER_ALERT_LIMIT, useIsPro } from "../lib/billing";

const HEADER_HEIGHT = 48;

export default function Home() {
  const router = useRouter();
  const {
    alerts,
    hydrated,
    toggleAlert,
    toggleAll,
    reorderAlerts,
  } = useAlerts();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isPro = useIsPro();
  const now = useNow(1000);
  const nowDate = new Date(now);

  const activeCount = alerts.filter((a) => a.enabled).length;
  const someEnabled = activeCount > 0;
  const totalAlerts = alerts.length;
  const freeSlotsLeft = Math.max(0, FREE_TIER_ALERT_LIMIT - totalAlerts);
  // "Nearing limit" = the user is close enough to feel the squeeze. We surface
  // an inline Upgrade hint here without nagging users who have lots of room.
  const nearingFreeLimit = !isPro && freeSlotsLeft <= 1;

  const nextFireAt = alerts
    .filter((a) => a.enabled)
    .reduce((min, a) => Math.min(min, getNextFire(a, now).fireAt), Infinity);
  const hasNextFire = Number.isFinite(nextFireAt);

  const goUpgrade = () => router.push("/upgrade");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top", "left", "right"]}>
      {/* Header band. The logo is absolutely positioned so its centering is
          independent of whatever sits on the left (hamburger) or the right
          (Upgrade chip / empty). */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 4,
          height: HEADER_HEIGHT,
          justifyContent: "center",
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            source={require("../assets/wick-logo.png")}
            resizeMode="contain"
            accessibilityLabel="Wick"
            style={{ width: 130, height: 36 }}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Pressable hitSlop={10} onPress={() => setSidebarOpen(true)}>
            <MenuIcon size={26} color={colors.textPrimary} />
          </Pressable>
          {/* Mirror the hamburger's footprint so the logo stays optically centered. */}
          <View style={{ width: 26 }} />
        </View>
      </View>

      {/* Status band: time pill + next-alert chip (when any alert is armed). */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: 8,
          paddingBottom: 16,
          paddingHorizontal: 16,
          gap: 8,
        }}
      >
        <StatusPill>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 12,
              fontVariant: ["tabular-nums"],
            }}
          >
            Now {formatClock(nowDate)} Local · {formatUtcClock(nowDate)} UTC
          </Text>
        </StatusPill>
        {hasNextFire && (
          <StatusPill accent>
            <Text
              style={{
                color: colors.positive,
                fontSize: 12,
                fontWeight: "600",
                fontVariant: ["tabular-nums"],
              }}
            >
              Next in {formatCountdown(nextFireAt - now)}
            </Text>
          </StatusPill>
        )}
      </View>

      {!hydrated ? null : alerts.length === 0 ? (
        <EmptyState onCreate={() => router.push("/create")} />
      ) : (
        <>
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 8,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: colors.cardElevated,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "600" }}>
                  All alerts
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                  {activeCount} of {totalAlerts} active
                </Text>
                {!isPro && (
                  <Text
                    style={{
                      color: nearingFreeLimit ? colors.negative : colors.textSecondary,
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    {totalAlerts >= FREE_TIER_ALERT_LIMIT
                      ? `Free tier full (${totalAlerts}/${FREE_TIER_ALERT_LIMIT})`
                      : `${totalAlerts}/${FREE_TIER_ALERT_LIMIT} free alerts used`}
                  </Text>
                )}
              </View>
              <CandleToggle value={someEnabled} onValueChange={(v) => void toggleAll(v)} />
            </View>
            {nearingFreeLimit && (
              <View
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: colors.borderSubtle,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 12, flex: 1, marginRight: 12 }}>
                  Get unlimited alerts with Wick Pro.
                </Text>
                <ChipButton
                  label="Upgrade"
                  variant="default"
                  tone="positive"
                  onPress={goUpgrade}
                />
              </View>
            )}
          </View>

          <AlertList
            alerts={alerts}
            onToggle={toggleAlert}
            onReorder={(next) => void reorderAlerts(next)}
          />
        </>
      )}

      <Pressable
        onPress={() => router.push("/create")}
        style={{
          position: "absolute",
          right: 24,
          bottom: 32,
          width: 56,
          height: 56,
          borderRadius: 14,
          backgroundColor: colors.positive,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOpacity: 0.4,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <PlusIcon size={28} color={colors.textPrimary} />
      </Pressable>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </SafeAreaView>
  );
}

// Pill wrapper used for the status band (time + next-alert).
function StatusPill({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.cardElevated,
        borderWidth: 1,
        borderColor: accent ? colors.positive : colors.borderSubtle,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 999,
      }}
    >
      {children}
    </View>
  );
}
