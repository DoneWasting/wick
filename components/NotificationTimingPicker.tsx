import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  ALL_NOTIFY_BEFORE,
  NOTIFY_BEFORE_LABELS,
  NotifyBefore,
  Timeframe,
  TIMEFRAME_MINUTES,
} from "../types";
import { CheckIcon } from "./Icons";
import { colors } from "../lib/theme";

interface Props {
  timeframe: Timeframe | null;
  selected: NotifyBefore[];
  onToggle: (nb: NotifyBefore) => void;
}

export function NotificationTimingPicker({ timeframe, selected, onToggle }: Props) {
  // Hide any option that is >= the timeframe length. e.g. for a 1m candle
  // we don't show "5 minutes before" — that would mean notifying *before
  // the current candle even opened*, which is incoherent.
  const cap = timeframe ? TIMEFRAME_MINUTES[timeframe] : Infinity;
  const options = ALL_NOTIFY_BEFORE.filter((nb) => nb < cap);

  return (
    <View>
      {options.map((nb) => {
        const isChecked = selected.includes(nb);
        return (
          <Pressable
            key={nb}
            onPress={() => onToggle(nb)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
            }}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 16 }}>
              {NOTIFY_BEFORE_LABELS[nb]}
            </Text>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                borderWidth: 1.5,
                borderColor: isChecked ? colors.accentBlue : colors.textSecondary,
                backgroundColor: isChecked ? colors.accentBlue : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isChecked ? <CheckIcon size={16} color="#ffffff" /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
