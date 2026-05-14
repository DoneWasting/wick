import React from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Alert,
  NOTIFY_BEFORE_LABELS,
  TIMEFRAME_CARD_LABELS,
} from "../types";
import { BellIcon, CandlestickIcon } from "./Icons";
import { colors } from "../lib/theme";
import { useNow } from "../hooks/useNow";
import { formatCountdown, getNextFire } from "../lib/countdown";

interface Props {
  alert: Alert;
  onToggle: (id: string, next: boolean) => void;
}

export function AlertCard({ alert, onToggle }: Props) {
  const router = useRouter();
  const enabled = alert.enabled;
  const dim = !enabled;

  const titleColor = dim ? colors.textDisabled : colors.textPrimary;
  const subColor = dim ? colors.textDisabled : colors.textSecondary;
  const iconColor = dim ? colors.textDisabled : colors.textSecondary;

  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }}>
      <Pressable
        onPress={() => router.push(`/edit/${alert.id}`)}
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          paddingHorizontal: 20,
          paddingVertical: 20,
        }}
      >
        <View style={{ marginTop: 4, marginRight: 16 }}>
          <CandlestickIcon size={22} color={iconColor} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: "600", color: titleColor }}>
            {TIMEFRAME_CARD_LABELS[alert.timeframe]}
          </Text>

          {dim && (
            <Text style={{ fontSize: 14, marginTop: 2, color: subColor }}>
              {alert.market === "forex" ? "Forex" : "Crypto"}
            </Text>
          )}

          <View style={{ marginTop: 8 }}>
            {alert.notifyBefore.map((nb) => (
              <View
                key={nb}
                style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}
              >
                <View style={{ marginRight: 12 }}>
                  <BellIcon size={18} color={iconColor} />
                </View>
                <Text style={{ fontSize: 14, color: subColor }}>
                  {NOTIFY_BEFORE_LABELS[nb]}
                </Text>
              </View>
            ))}
          </View>

          {enabled && <CountdownLine alert={alert} />}
        </View>

        <View style={{ marginLeft: 12, alignSelf: "center" }}>
          <Switch
            value={enabled}
            onValueChange={(v) => onToggle(alert.id, v)}
            trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
            thumbColor={enabled ? colors.switchThumbOn : colors.switchThumbOff}
            ios_backgroundColor={colors.switchTrackOff}
          />
        </View>
      </Pressable>
    </View>
  );
}

function CountdownLine({ alert }: { alert: Alert }) {
  const now = useNow(1000);
  const next = getNextFire(alert, now);
  const remaining = next.fireAt - now;
  const label = NOTIFY_BEFORE_LABELS[next.notifyBefore];
  return (
    <View style={{ marginTop: 4 }}>
      <Text style={{ color: colors.accentBlueSoft, fontSize: 13 }}>
        Next: {formatCountdown(remaining)} · {label}
      </Text>
    </View>
  );
}
