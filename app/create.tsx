import React, { useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAlerts } from "../hooks/useAlerts";
import { WizardStep } from "../components/WizardStep";
import { MarketSelector } from "../components/MarketSelector";
import { TimeframeSelector } from "../components/TimeframeSelector";
import { NotificationTimingPicker } from "../components/NotificationTimingPicker";
import { PrimaryButton } from "../components/PrimaryButton";
import { CandlestickIcon, ChevronRightIcon } from "../components/Icons";
import {
  Market,
  NotifyBefore,
  Timeframe,
  TIMEFRAME_LABELS,
  TIMEFRAME_MINUTES,
} from "../types";
import { Toast } from "../components/Toast";
import { colors } from "../lib/theme";

type Step = 1 | 2 | 3;

export default function CreateAlert() {
  const router = useRouter();
  const { addAlert } = useAlerts();

  const [step, setStep] = useState<Step>(1);
  const [market, setMarket] = useState<Market | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("15m");
  const [editingTimeframe, setEditingTimeframe] = useState(false);
  const [notifyBefore, setNotifyBefore] = useState<NotifyBefore[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const pruneNotify = (tf: Timeframe, current: NotifyBefore[]): NotifyBefore[] => {
    const cap = TIMEFRAME_MINUTES[tf];
    return current.filter((n) => n < cap);
  };

  const toggleNotify = (nb: NotifyBefore) => {
    setNotifyBefore((prev) =>
      prev.includes(nb) ? prev.filter((x) => x !== nb) : [...prev, nb].sort((a, b) => a - b)
    );
  };

  const cancel = () => router.back();

  const submit = async () => {
    if (!market || notifyBefore.length === 0) return;
    const res = await addAlert({ market, timeframe, notifyBefore });
    if (!res.ok) {
      setToast("Already exists, edit it instead");
      return;
    }
    router.back();
  };

  const stepState = (n: Step): "active" | "collapsed" | "upcoming" => {
    if (n < step) return "collapsed";
    if (n === step) return "active";
    return "upcoming";
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top", "bottom", "left", "right"]}>
      {Platform.OS === "web" && (
        <View style={{ alignItems: "center", paddingTop: 8 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#2a313c" }} />
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <WizardStep
          number={1}
          title="Choose the market you want to monitor:"
          state={stepState(1)}
          subtitle={step > 1 && market ? (market === "forex" ? "Forex" : "Crypto") : undefined}
        >
          {step === 1 && (
            <>
              <MarketSelector value={market} onChange={setMarket} />
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
                <PrimaryButton label="Continue" disabled={!market} onPress={() => setStep(2)} />
                <View style={{ width: 16 }} />
                <PrimaryButton label="Cancel" variant="text" onPress={cancel} />
              </View>
            </>
          )}
        </WizardStep>

        <WizardStep
          number={2}
          title="Choose the candlestick timeframe:"
          state={stepState(2)}
          subtitle={step > 2 ? TIMEFRAME_LABELS[timeframe] : undefined}
        >
          {step === 2 && (
            <>
              {editingTimeframe ? (
                <TimeframeSelector
                  value={timeframe}
                  onChange={(tf) => {
                    setTimeframe(tf);
                    setNotifyBefore((prev) => pruneNotify(tf, prev));
                  }}
                />
              ) : (
                <Pressable
                  onPress={() => setEditingTimeframe(true)}
                  style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12 }}
                >
                  <CandlestickIcon size={22} color={colors.textSecondary} />
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 17 }}>
                      {TIMEFRAME_LABELS[timeframe]}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Tap to edit</Text>
                  </View>
                  <ChevronRightIcon size={20} color={colors.textSecondary} />
                </Pressable>
              )}
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
                <PrimaryButton
                  label="Continue"
                  onPress={() => {
                    setEditingTimeframe(false);
                    setStep(3);
                  }}
                />
                <View style={{ width: 16 }} />
                <PrimaryButton label="Cancel" variant="text" onPress={cancel} />
              </View>
            </>
          )}
        </WizardStep>

        <WizardStep
          number={3}
          title="How long before the candle closes do you want to be notified?"
          subtitle="You can choose more than one option"
          state={stepState(3)}
          isLast
        >
          {step === 3 && (
            <>
              <NotificationTimingPicker
                timeframe={timeframe}
                selected={notifyBefore}
                onToggle={toggleNotify}
              />
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
                <PrimaryButton
                  label="Create"
                  disabled={notifyBefore.length === 0}
                  onPress={() => void submit()}
                />
                <View style={{ width: 16 }} />
                <PrimaryButton label="Cancel" variant="text" onPress={cancel} />
              </View>
            </>
          )}
        </WizardStep>
      </ScrollView>

      <Toast message={toast} onHide={() => setToast(null)} />
    </SafeAreaView>
  );
}
