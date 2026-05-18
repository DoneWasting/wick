import React, { useState } from "react";
import { Alert as RNAlert, Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAlertsStore } from "../../store/alertsStore";
import { AlertForm } from "../../components/AlertForm";
import { PrimaryButton } from "../../components/PrimaryButton";
import { colors } from "../../lib/theme";
import { toast } from "../../lib/toast";

export default function EditAlert() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const alert = useAlertsStore((s) => s.alerts.find((a) => a.id === id));
  const hydrated = useAlertsStore((s) => s.hydrated);
  const updateAlert = useAlertsStore((s) => s.updateAlert);
  const removeAlert = useAlertsStore((s) => s.removeAlert);
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

  // While hydrating, render an empty bg-colored screen rather than mounting
  // AlertForm with placeholder values that would briefly flash on screen.
  if (!alert) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  const askDelete = () => {
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
            toast("Alert deleted");
            router.back();
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <>
      <AlertForm
        title="Edit alert"
        subtitle="Changes re-arm notifications immediately on save."
        initialMarket={alert.market}
        initialTimeframe={alert.timeframe}
        initialNotifyBefore={alert.notifyBefore}
        submitLabel="Save changes"
        requireDirty
        onSubmit={async ({ market, timeframe, notifyBefore }) => {
          const res = await updateAlert(alert.id, { market, timeframe, notifyBefore });
          if (!res.ok) {
            if (res.reason === "duplicate") {
              toast("Another alert already uses this market + timeframe");
            } else {
              toast("Could not save changes");
            }
            return;
          }
          toast("Alert updated");
          router.back();
        }}
        onCancel={() => router.back()}
        onDelete={askDelete}
      />

      {confirmDelete && (
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
                  toast("Alert deleted");
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
    </>
  );
}
