import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  Text,
  View,
} from "react-native";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { BellIcon, CandlestickIcon, TrashIcon } from "./Icons";
import { colors } from "../lib/theme";
import { sendTestNotification } from "../lib/notifications";
import { useAlertsStore } from "../store/alertsStore";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirmClearAll: () => void;
}

const WIDTH = Math.min(300, Math.round(Dimensions.get("window").width * 0.82));

export function Sidebar({ open, onClose, onConfirmClearAll }: Props) {
  const router = useRouter();
  const slide = useRef(new Animated.Value(open ? 0 : -WIDTH)).current;
  const fade = useRef(new Animated.Value(open ? 1 : 0)).current;
  const alertCount = useAlertsStore((s) => s.alerts.length);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: open ? 0 : -WIDTH,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: open ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [open, slide, fade]);

  const version =
    (Constants.expoConfig?.version as string | undefined) ?? "1.0.0";

  const handle = (fn: () => void | Promise<void>) => () => {
    onClose();
    setTimeout(() => {
      void fn();
    }, 160);
  };

  return (
    <View
      pointerEvents={open ? "auto" : "none"}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.55)",
          opacity: fade,
        }}
      >
        <Pressable
          onPress={onClose}
          style={{ flex: 1 }}
          accessibilityLabel="Close menu"
        />
      </Animated.View>

      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: WIDTH,
          backgroundColor: colors.cardElevated,
          borderRightWidth: 1,
          borderRightColor: colors.borderSubtle,
          transform: [{ translateX: slide }],
          paddingTop: 56,
          paddingHorizontal: 8,
        }}
      >
        <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "700" }}>
            Candle alerts
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
            v{version} · {alertCount} alert{alertCount === 1 ? "" : "s"}
          </Text>
        </View>

        <SidebarItem
          icon={<CandlestickIcon size={20} color={colors.textPrimary} />}
          label="Settings"
          onPress={handle(() => router.push("/settings"))}
        />
        <SidebarItem
          icon={<BellIcon size={20} color={colors.textPrimary} />}
          label="Send test notification"
          onPress={handle(async () => {
            const ok = await sendTestNotification();
            if (!ok && typeof window !== "undefined" && "alert" in window) {
              window.alert(
                "Notifications are blocked. Enable them in your browser/OS settings."
              );
            }
          })}
        />
        <SidebarItem
          icon={<TrashIcon size={20} color={colors.negative} />}
          label="Clear all alerts"
          danger
          disabled={alertCount === 0}
          onPress={handle(() => onConfirmClearAll())}
        />

        <View
          style={{
            marginTop: "auto",
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderTopWidth: 1,
            borderTopColor: colors.borderSubtle,
          }}
        >
          <Text style={{ color: colors.textDisabled, fontSize: 11, lineHeight: 16 }}>
            Local-only candle close reminders for Forex & Crypto. All alerts
            persist on this device; no account required.
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

function SidebarItem({
  icon,
  label,
  onPress,
  danger,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: pressed ? colors.bg : "transparent",
        opacity: disabled ? 0.4 : 1,
      })}
    >
      <View style={{ width: 24, alignItems: "center" }}>{icon}</View>
      <Text
        style={{
          color: danger ? colors.negative : colors.textPrimary,
          fontSize: 15,
          marginLeft: 14,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
