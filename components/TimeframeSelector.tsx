import React from "react";
import { Pressable, Text, View } from "react-native";
import { ALL_TIMEFRAMES, Timeframe, TIMEFRAME_LABELS } from "../types";
import { RadioOuter } from "./Icons";
import { colors } from "../lib/theme";

interface Props {
  value: Timeframe | null;
  onChange: (t: Timeframe) => void;
}

export function TimeframeSelector({ value, onChange }: Props) {
  return (
    <View>
      {ALL_TIMEFRAMES.map((tf) => {
        const selected = value === tf;
        return (
          <Pressable
            key={tf}
            onPress={() => onChange(tf)}
            style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12 }}
          >
            <RadioOuter filled={selected} size={26} />
            <Text style={{ color: colors.textPrimary, fontSize: 16, marginLeft: 16 }}>
              {TIMEFRAME_LABELS[tf]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
