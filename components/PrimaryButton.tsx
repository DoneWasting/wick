import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "../lib/theme";
import * as haptics from "../lib/haptics";

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "filled" | "text";
  // "positive" paints the filled variant with the bullish green — used for
  // create entry points (the FAB and the empty-state CTA) so they read as
  // the same action. Ignored for the text variant.
  tone?: "default" | "positive";
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = "filled",
  tone = "default",
}: Props) {
  if (variant === "text") {
    return (
      <Pressable onPress={onPress} disabled={disabled} hitSlop={6}>
        <Text style={{ fontSize: 15, color: disabled ? colors.textDisabled : colors.accentBlue, fontWeight: "500" }}>
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        // Tactile beat on filled-button commits (Create, Save, Continue).
        // Text variant is treated as low-stakes and stays silent.
        haptics.impactLight();
        onPress();
      }}
      disabled={disabled}
    >
      <View
        style={{
          borderRadius: 999,
          paddingHorizontal: 28,
          paddingVertical: 12,
          backgroundColor: disabled
            ? colors.buttonFilledDisabled
            : tone === "positive"
              ? colors.positive
              : colors.buttonFilled,
          opacity: disabled ? 0.7 : 1,
        }}
      >
        <Text
          style={{
            fontSize: 15,
            textAlign: "center",
            color: disabled ? colors.textSecondary : colors.textPrimary,
            fontWeight: "600",
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
