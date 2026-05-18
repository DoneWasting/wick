import React from "react";
import { Pressable, Text, View } from "react-native";
import { Market } from "../types";
import { RadioOuter } from "./Icons";
import { colors } from "../lib/theme";
import * as haptics from "../lib/haptics";

interface Props {
  value: Market | null;
  onChange: (m: Market) => void;
}

const OPTIONS: { value: Market; label: string }[] = [
  { value: "forex", label: "Forex" },
  { value: "crypto", label: "Crypto" },
];

export function MarketSelector({ value, onChange }: Props) {
  return (
    <View>
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              if (!selected) haptics.selection();
              onChange(opt.value);
            }}
            style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12 }}
          >
            <RadioOuter filled={selected} size={26} />
            <Text style={{ color: colors.textPrimary, fontSize: 16, marginLeft: 16 }}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
