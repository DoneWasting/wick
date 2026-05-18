import React, { useEffect, useRef } from "react";
import { Animated, Pressable } from "react-native";
import { colors } from "../lib/theme";
import * as haptics from "../lib/haptics";

interface Props {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}

const TRACK_W = 52;
const BODY_W = 18;
const BODY_H = 28;
const WICK_H = 4;
const PAD = 3;
const TRAVEL = TRACK_W - BODY_W - PAD * 2;

export function CandleToggle({ value, onValueChange, disabled }: Props) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [PAD, PAD + TRAVEL],
  });
  const bodyColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.negative, colors.positive],
  });

  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        // Light impact: this state change has real consequences (scheduling /
        // cancelling notifications), so it deserves a beat heavier than a
        // selection tick.
        haptics.impactLight();
        onValueChange(!value);
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      hitSlop={8}
      style={{
        width: TRACK_W,
        height: BODY_H,
        justifyContent: "center",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          width: TRACK_W,
          height: WICK_H,
          borderRadius: WICK_H / 2,
          backgroundColor: colors.textSecondary,
        }}
      />
      <Animated.View
        style={{
          width: BODY_W,
          height: BODY_H,
          borderRadius: 3,
          backgroundColor: bodyColor,
          transform: [{ translateX }],
        }}
      />
    </Pressable>
  );
}
