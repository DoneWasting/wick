import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "../lib/theme";
import * as haptics from "../lib/haptics";

type Variant = "primary" | "destructive" | "default";

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
}

// Compact pill button for inline row actions (Settings, AlertForm delete, etc).
// Smaller than PrimaryButton on purpose — PrimaryButton owns the bottom-bar
// commit slot; ChipButton fits next to text or list items.
export function ChipButton({ label, onPress, variant = "default", disabled }: Props) {
  const v = palette(variant, !!disabled);
  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        haptics.impactLight();
        onPress();
      }}
      disabled={disabled}
      hitSlop={4}
    >
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: v.border,
          backgroundColor: v.bg,
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <Text style={{ color: v.fg, fontSize: 14, fontWeight: "600" }}>{label}</Text>
      </View>
    </Pressable>
  );
}

function palette(variant: Variant, disabled: boolean): { bg: string; border: string; fg: string } {
  if (disabled) {
    return { bg: "transparent", border: colors.borderSubtle, fg: colors.textDisabled };
  }
  switch (variant) {
    case "primary":
      return { bg: colors.buttonFilled, border: colors.buttonFilled, fg: colors.textPrimary };
    case "destructive":
      return { bg: "transparent", border: colors.negative, fg: colors.negative };
    case "default":
    default:
      return { bg: "transparent", border: colors.borderSubtle, fg: colors.textPrimary };
  }
}
