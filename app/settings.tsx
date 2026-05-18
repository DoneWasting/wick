import React, { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { colors } from "../lib/theme";
import { ChevronLeftIcon } from "../components/Icons";
import { CandleToggle } from "../components/CandleToggle";
import { ChipButton } from "../components/ChipButton";
import {
  ensurePermissions,
  getPermissionState,
  sendTestNotification,
  PermissionState,
} from "../lib/notifications";
import {
  getSoundEnabled,
  setSoundEnabled,
  getVibrationEnabled,
  setVibrationEnabled,
} from "../lib/settings";
import { useAlertsStore } from "../store/alertsStore";
import { toast } from "../lib/toast";

export default function Settings() {
  const router = useRouter();
  const removeAll = useAlertsStore((s) => s.removeAll);
  const alertCount = useAlertsStore((s) => s.alerts.length);

  const [soundOn, setSoundOn] = useState(true);
  const [vibrationOn, setVibrationOn] = useState(true);
  const [permission, setPermission] = useState<PermissionState>("default");

  // Hydrate the sound + vibration preferences once on mount.
  useEffect(() => {
    void (async () => {
      setSoundOn(await getSoundEnabled());
      setVibrationOn(await getVibrationEnabled());
    })();
  }, []);

  // Reflect actual permission state. Works on web and native: getPermissionState
  // maps each platform's API into the same three-state vocabulary.
  useEffect(() => {
    void (async () => {
      setPermission(await getPermissionState());
    })();
  }, []);

  const setSound = async (v: boolean) => {
    setSoundOn(v);
    await setSoundEnabled(v);
  };

  const setVibration = async (v: boolean) => {
    setVibrationOn(v);
    await setVibrationEnabled(v);
  };

  const key = process.env.EXPO_PUBLIC_TWELVEDATA_KEY;
  const hasKey = !!key && key !== "your_key_here";

  const version =
    (Constants.expoConfig?.version as string | undefined) ?? "1.0.0";

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top", "bottom", "left", "right"]}
    >
      {/* Header: matches create/edit (24pt title + subtitle) with a proper
          back chevron above. iOS Settings pattern. */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{ alignSelf: "flex-start", paddingVertical: 4, marginBottom: 4 }}
          accessibilityLabel="Back"
        >
          <ChevronLeftIcon size={26} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "700" }}>
          Settings
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
          Notifications and data preferences.
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <SectionLabel>Notifications</SectionLabel>

        <Row>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Sound</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
              Play the system sound when an alert fires.
            </Text>
          </View>
          <CandleToggle value={soundOn} onValueChange={(v) => void setSound(v)} />
        </Row>

        <Row>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Vibration</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
              Vibrate the device when an alert fires.
            </Text>
          </View>
          <CandleToggle value={vibrationOn} onValueChange={(v) => void setVibration(v)} />
        </Row>

        <Row>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16 }}>
              Browser/OS permission
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
              {permission === "granted"
                ? "Granted — alerts will appear as system notifications."
                : permission === "denied"
                  ? "Denied — re-enable in your browser/OS settings."
                  : "Not yet decided — tap Request to ask."}
            </Text>
          </View>
          {permission !== "granted" && (
            <ChipButton
              label="Request"
              variant="primary"
              onPress={async () => {
                const ok = await ensurePermissions();
                setPermission(ok ? "granted" : "denied");
              }}
            />
          )}
        </Row>

        <Row isLast>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16 }}>
              Send test notification
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
              Fires one now to verify the path works.
            </Text>
          </View>
          <ChipButton
            label="Send"
            variant="primary"
            onPress={async () => {
              const ok = await sendTestNotification();
              toast(ok ? "Test notification sent" : "Notifications are blocked");
            }}
          />
        </Row>

        <SectionLabel style={{ marginTop: 28 }}>Data</SectionLabel>
        <Row isLast>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Clear all alerts</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
              Currently {alertCount} alert{alertCount === 1 ? "" : "s"} saved on this device.
            </Text>
          </View>
          <ChipButton
            label="Clear"
            variant="destructive"
            disabled={alertCount === 0}
            onPress={async () => {
              await removeAll();
              toast("All alerts deleted");
            }}
          />
        </Row>

        <SectionLabel style={{ marginTop: 28 }}>Market data</SectionLabel>
        <Note>
          <Text style={{ color: colors.textPrimary, fontSize: 14, marginBottom: 4 }}>
            TwelveData API key (Forex)
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            {hasKey
              ? `Configured (${key!.slice(0, 4)}…${key!.slice(-3)}). Set via .env: EXPO_PUBLIC_TWELVEDATA_KEY.`
              : "Not set — Forex price panel will show demo data. Get a free key at twelvedata.com and put it in .env."}
          </Text>
        </Note>

        <SectionLabel style={{ marginTop: 28 }}>About</SectionLabel>
        <Note>
          <Text style={{ color: colors.textPrimary, fontSize: 14, marginBottom: 4 }}>
            Wick
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            v{version} · {Platform.OS}
          </Text>
        </Note>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ children, isLast }: { children: React.ReactNode; isLast?: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.borderSubtle,
      }}
    >
      {children}
    </View>
  );
}

// Flat info card — used for rows that display data without an action. No
// border-bottom so they don't masquerade as interactive list items.
function Note({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: colors.cardElevated,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
      }}
    >
      {children}
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
