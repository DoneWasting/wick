import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "../lib/theme";

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "filled" | "text";
}

export function PrimaryButton({ label, onPress, disabled, variant = "filled" }: Props) {
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
    <Pressable onPress={onPress} disabled={disabled}>
      <View
        style={{
          borderRadius: 999,
          paddingHorizontal: 28,
          paddingVertical: 12,
          backgroundColor: disabled ? colors.buttonFilledDisabled : colors.buttonFilled,
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
