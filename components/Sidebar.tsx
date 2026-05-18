import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { GearIcon } from "./Icons";
import { colors } from "../lib/theme";
import { useAlertsStore } from "../store/alertsStore";
import { useIsPro } from "../lib/billing";
import * as haptics from "../lib/haptics";

interface Props {
  open: boolean;
  onClose: () => void;
}

const WIDTH = Math.min(300, Math.round(Dimensions.get("window").width * 0.82));

export function Sidebar({ open, onClose }: Props) {
  const router = useRouter();
  const slide = useRef(new Animated.Value(open ? 0 : -WIDTH)).current;
  const fade = useRef(new Animated.Value(open ? 1 : 0)).current;
  const alertCount = useAlertsStore((s) => s.alerts.length);
  const isPro = useIsPro();

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

  // Close the drawer first, then run the action after the slide-out finishes.
  // Avoids janky overlap of the new screen mounting while the drawer is still
  // animating away.
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
          <Image
            source={require("../assets/wick-logo.png")}
            resizeMode="contain"
            accessibilityLabel="Wick"
            style={{ width: 110, height: 30 }}
          />
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>
            v{version} · {alertCount} alert{alertCount === 1 ? "" : "s"}
          </Text>
        </View>

        {!isPro && (
          <Pressable
            onPress={handle(() => {
              haptics.impactLight();
              router.push("/upgrade");
            })}
            style={({ pressed }) => ({
              marginHorizontal: 8,
              marginBottom: 12,
              padding: 14,
              borderRadius: 12,
              backgroundColor: colors.positive,
              opacity: pressed ? 0.85 : 1,
            })}
            accessibilityLabel="Upgrade to Wick Pro"
          >
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "700" }}>
              Upgrade to Wick Pro
            </Text>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 12,
                marginTop: 4,
                opacity: 0.85,
              }}
            >
              Unlimited alerts and more.
            </Text>
          </Pressable>
        )}

        <SidebarItem
          icon={<GearIcon size={20} color={colors.textPrimary} />}
          label="Settings"
          onPress={handle(() => router.push("/settings"))}
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
          <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "600" }}>
            Wick
          </Text>
          <Text style={{ color: colors.textDisabled, fontSize: 11, marginTop: 2 }}>
            Candle Timer for Traders
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
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        haptics.impactLight();
        onPress();
      }}
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
          color: colors.textPrimary,
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
