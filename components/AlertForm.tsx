import React, { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Market,
  NotifyBefore,
  Timeframe,
  TIMEFRAME_MINUTES,
} from "../types";
import { MarketSelector } from "./MarketSelector";
import { TimeframeSelector } from "./TimeframeSelector";
import { NotificationTimingPicker } from "./NotificationTimingPicker";
import { PrimaryButton } from "./PrimaryButton";
import { ChipButton } from "./ChipButton";
import { colors } from "../lib/theme";
import { getNextCandleClose } from "../lib/candleMath";
import { formatCountdown, formatUtcClock } from "../lib/countdown";
import { useNow } from "../hooks/useNow";

export interface AlertFormValues {
  market: Market;
  timeframe: Timeframe;
  notifyBefore: NotifyBefore[];
}

interface Props {
  title: string;
  subtitle?: string;
  // Allow null for create (user must pick); always populated for edit.
  initialMarket: Market | null;
  initialTimeframe: Timeframe;
  initialNotifyBefore: NotifyBefore[];
  submitLabel: string;
  // Require values to have changed before enabling submit. True for edit.
  requireDirty?: boolean;
  onSubmit: (values: AlertFormValues) => Promise<void> | void;
  onCancel: () => void;
  // Edit-only. When provided, renders a destructive button at the bottom.
  onDelete?: () => void;
}

export function AlertForm({
  title,
  subtitle,
  initialMarket,
  initialTimeframe,
  initialNotifyBefore,
  submitLabel,
  requireDirty = false,
  onSubmit,
  onCancel,
  onDelete,
}: Props) {
  const [market, setMarket] = useState<Market | null>(initialMarket);
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe);
  const [notifyBefore, setNotifyBefore] = useState<NotifyBefore[]>(initialNotifyBefore);
  const [submitting, setSubmitting] = useState(false);

  // If the parent swaps the underlying alert (e.g. nav between edit screens),
  // resync local state. Compared shallowly via the relevant inputs.
  useEffect(() => {
    setMarket(initialMarket);
    setTimeframe(initialTimeframe);
    setNotifyBefore(initialNotifyBefore);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMarket, initialTimeframe]);

  const pickTimeframe = (tf: Timeframe) => {
    setTimeframe(tf);
    // Drop any selected notify offset that's now >= timeframe minutes.
    const cap = TIMEFRAME_MINUTES[tf];
    setNotifyBefore((prev) => prev.filter((n) => n < cap));
  };

  const toggleNotify = (nb: NotifyBefore) => {
    setNotifyBefore((prev) =>
      prev.includes(nb) ? prev.filter((x) => x !== nb) : [...prev, nb].sort((a, b) => a - b)
    );
  };

  const dirty =
    market !== initialMarket ||
    timeframe !== initialTimeframe ||
    notifyBefore.length !== initialNotifyBefore.length ||
    notifyBefore.some((nb, i) => initialNotifyBefore[i] !== nb);

  const canSubmit =
    !!market && notifyBefore.length > 0 && (!requireDirty || dirty) && !submitting;

  // Human-readable explanation of why the primary button is disabled. Surfaced
  // as a quiet hint above the button so users learn the requirement at the
  // moment of confusion instead of guessing.
  const disabledHint = !market
    ? "Pick a market to continue"
    : notifyBefore.length === 0
    ? "Pick at least one notify time"
    : requireDirty && !dirty
    ? "Make a change to save"
    : null;

  const handleSubmit = async () => {
    if (!market || notifyBefore.length === 0) return;
    setSubmitting(true);
    try {
      await onSubmit({ market, timeframe, notifyBefore });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top", "bottom", "left", "right"]}
    >
      {Platform.OS === "web" && (
        <View style={{ alignItems: "center", paddingTop: 8 }}>
          <View
            style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#2a313c" }}
          />
        </View>
      )}

      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "700" }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <SectionLabel>Market</SectionLabel>
          <MarketSelector value={market} onChange={setMarket} />

          <SectionLabel style={{ marginTop: 24 }}>Timeframe</SectionLabel>
          <TimeframeSelector value={timeframe} onChange={pickTimeframe} />

          <SectionLabel style={{ marginTop: 24 }}>Notify me…</SectionLabel>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>
            Pick one or more. Each fires per candle close.
          </Text>
          <NotificationTimingPicker
            timeframe={timeframe}
            selected={notifyBefore}
            onToggle={toggleNotify}
          />

          <NextClosePreview timeframe={timeframe} />

          {onDelete ? (
            <View style={{ marginTop: 32, alignSelf: "flex-start" }}>
              <ChipButton
                label="Delete this alert"
                variant="destructive"
                onPress={onDelete}
              />
            </View>
          ) : null}
        </ScrollView>

        {/* Sticky bottom CTA: Cancel left (text), Primary right (filled).
            Matches iOS/Material muscle memory and is always thumb-reachable. */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: 16,
            backgroundColor: colors.bg,
            borderTopWidth: 1,
            borderTopColor: colors.borderSubtle,
          }}
        >
          {disabledHint ? (
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                textAlign: "right",
                marginBottom: 8,
              }}
            >
              {disabledHint}
            </Text>
          ) : null}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <PrimaryButton label="Cancel" variant="text" onPress={onCancel} />
            <View style={{ width: 16 }} />
            <PrimaryButton
              label={submitLabel}
              disabled={!canSubmit}
              onPress={() => void handleSubmit()}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function NextClosePreview({ timeframe }: { timeframe: Timeframe }) {
  // Tick every 10s — countdown precision finer than that is just visual noise
  // for a preview, and we save renders.
  const now = useNow(10_000);
  const next = useMemo(() => getNextCandleClose(timeframe, new Date(now)), [timeframe, now]);
  const remainingMs = next.getTime() - now;
  return (
    <View
      style={{
        marginTop: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: colors.cardElevated,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
      }}
    >
      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Next candle close</Text>
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: 15,
          fontWeight: "600",
          marginTop: 2,
          fontVariant: ["tabular-nums"],
        }}
      >
        {formatUtcClock(next)} UTC · in {formatCountdown(remainingMs)}
      </Text>
    </View>
  );
}

function SectionLabel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <Text
      style={[
        {
          color: colors.textSecondary,
          fontSize: 12,
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 8,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
