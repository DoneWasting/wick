import React, { useMemo, useState } from "react";
import {
  Alert as RNAlert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAlertsStore } from "../../store/alertsStore";
import { MarketSelector } from "../../components/MarketSelector";
import { TimeframeSelector } from "../../components/TimeframeSelector";
import { NotificationTimingPicker } from "../../components/NotificationTimingPicker";
import { PrimaryButton } from "../../components/PrimaryButton";
import { CandlestickIcon, ChevronRightIcon } from "../../components/Icons";
import {
  Market,
  NotifyBefore,
  Timeframe,
  TIMEFRAME_LABELS,
  TIMEFRAME_MINUTES,
} from "../../types";
import { Toast } from "../../components/Toast";
import { colors } from "../../lib/theme";

export default function EditAlert() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const alert = useAlertsStore((s) => s.alerts.find((a) => a.id === id));
  const hydrated = useAlertsStore((s) => s.hydrated);
  const updateAlert = useAlertsStore((s) => s.updateAlert);
  const removeAlert = useAlertsStore((s) => s.removeAlert);

  // Hooks must run unconditionally; we render the not-found UI below.
  const initial = useMemo(
    () => ({
      market: (alert?.market ?? "crypto") as Market,
      timeframe: (alert?.timeframe ?? "15m") as Timeframe,
      notifyBefore: (alert?.notifyBefore ?? []) as NotifyBefore[],
    }),
    [alert?.id]
  );

  const [market, setMarket] = useState<Market>(initial.market);
  const [timeframe, setTimeframe] = useState<Timeframe>(initial.timeframe);
  const [notifyBefore, setNotifyBefore] = useState<NotifyBefore[]>(initial.notifyBefore);
  const [editingTimeframe, setEditingTimeframe] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (hydrated && !alert) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: 20 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "600" }}>
          Alert not found
        </Text>
        <Text style={{ color: colors.textSecondary, marginTop: 8, marginBottom: 24 }}>
          It may have been deleted from another tab.
        </Text>
        <PrimaryButton label="Back" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const toggleNotify = (nb: NotifyBefore) => {
    setNotifyBefore((prev) =>
      prev.includes(nb) ? prev.filter((x) => x !== nb) : [...prev, nb].sort((a, b) => a - b)
    );
  };

  // If timeframe changes, drop any notifyBefore that no longer fits (>= timeframe minutes).
  const pickTimeframe = (tf: Timeframe) => {
    setTimeframe(tf);
    const cap = TIMEFRAME_MINUTES[tf];
    setNotifyBefore((prev) => prev.filter((n) => n < cap));
  };

  const save = async () => {
    if (!alert || notifyBefore.length === 0) return;
    const res = await updateAlert(alert.id, { market, timeframe, notifyBefore });
    if (!res.ok) {
      if (res.reason === "duplicate") {
        setToast("Another alert already uses this market + timeframe");
      } else {
        setToast("Could not save changes");
      }
      return;
    }
    router.back();
  };

  const askDelete = () => {
    if (!alert) return;
    if (Platform.OS === "web") {
      setConfirmDelete(true);
      return;
    }
    RNAlert.alert(
      "Delete this alert?",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await removeAlert(alert.id);
            router.back();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const dirty =
    !!alert &&
    (market !== alert.market ||
      timeframe !== alert.timeframe ||
      notifyBefore.length !== alert.notifyBefore.length ||
      notifyBefore.some((nb, i) => alert.notifyBefore[i] !== nb));

  const canSave = !!alert && dirty && notifyBefore.length > 0;

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
          Edit alert
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
          Changes re-arm notifications immediately on save.
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <SectionLabel>Market</SectionLabel>
        <MarketSelector value={market} onChange={setMarket} />

        <SectionLabel style={{ marginTop: 24 }}>Timeframe</SectionLabel>
        {editingTimeframe ? (
          <TimeframeSelector value={timeframe} onChange={pickTimeframe} />
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

        <SectionLabel style={{ marginTop: 24 }}>Notification timing</SectionLabel>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>
          You can choose more than one.
        </Text>
        <NotificationTimingPicker
          timeframe={timeframe}
          selected={notifyBefore}
          onToggle={toggleNotify}
        />

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 24 }}>
          <PrimaryButton
            label="Save changes"
            disabled={!canSave}
            onPress={() => void save()}
          />
          <View style={{ width: 16 }} />
          <PrimaryButton label="Cancel" variant="text" onPress={() => router.back()} />
        </View>

        <Pressable
          onPress={askDelete}
          hitSlop={8}
          style={{ marginTop: 32, alignSelf: "flex-start" }}
        >
          <Text style={{ color: colors.negative, fontSize: 15, fontWeight: "600" }}>
            Delete this alert
          </Text>
        </Pressable>
      </ScrollView>

      <Toast message={toast} onHide={() => setToast(null)} />

      {confirmDelete && alert && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: 14,
              padding: 20,
              maxWidth: 360,
              width: "100%",
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 18,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              Delete this alert?
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 20 }}>
              This cannot be undone.
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <Pressable
                onPress={() => setConfirmDelete(false)}
                style={{ paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 }}
              >
                <Text style={{ color: colors.accentBlue, fontSize: 15, fontWeight: "600" }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  setConfirmDelete(false);
                  await removeAlert(alert.id);
                  router.back();
                }}
                style={{ paddingHorizontal: 16, paddingVertical: 8 }}
              >
                <Text style={{ color: colors.negative, fontWeight: "600", fontSize: 15 }}>
                  Delete
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
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
