import React, { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { colors } from "../lib/theme";
import { PrimaryButton } from "../components/PrimaryButton";
import { ChevronRightIcon } from "../components/Icons";
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

export default function Settings() {
  const router = useRouter();
  const removeAll = useAlertsStore((s) => s.removeAll);
  const alertCount = useAlertsStore((s) => s.alerts.length);

  const [soundOn, setSoundOn] = useState(true);
  const [vibrationOn, setVibrationOn] = useState(true);
  const [permission, setPermission] = useState<PermissionState>("default");
  const [testMsg, setTestMsg] = useState<string | null>(null);

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
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{ transform: [{ rotate: "180deg" }], marginRight: 12 }}
        >
          <ChevronRightIcon size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "700" }}>
          Settings
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
          <Switch
            value={soundOn}
            onValueChange={(v) => void setSound(v)}
            trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
            thumbColor={soundOn ? colors.switchThumbOn : colors.switchThumbOff}
            ios_backgroundColor={colors.switchTrackOff}
          />
        </Row>

        <Row>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Vibration</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
              Vibrate the device when an alert fires.
            </Text>
          </View>
          <Switch
            value={vibrationOn}
            onValueChange={(v) => void setVibration(v)}
            trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
            thumbColor={vibrationOn ? colors.switchThumbOn : colors.switchThumbOff}
            ios_backgroundColor={colors.switchTrackOff}
          />
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
            <PrimaryButton
              label="Request"
              onPress={async () => {
                const ok = await ensurePermissions();
                setPermission(ok ? "granted" : "denied");
              }}
            />
          )}
        </Row>

        <Row>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16 }}>
              Send test notification
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
              Fires one now to verify the path works.
              {testMsg ? `  ${testMsg}` : ""}
            </Text>
          </View>
          <PrimaryButton
            label="Send"
            onPress={async () => {
              const ok = await sendTestNotification();
              setTestMsg(ok ? "✓ sent" : "✗ blocked");
              setTimeout(() => setTestMsg(null), 3000);
            }}
          />
        </Row>

        <SectionLabel style={{ marginTop: 28 }}>Market data</SectionLabel>
        <Row>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16 }}>
              TwelveData API key (Forex)
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
              {hasKey
                ? `Configured (${key!.slice(0, 4)}…${key!.slice(-3)}). Set via .env: EXPO_PUBLIC_TWELVEDATA_KEY.`
                : "Not set — Forex price panel will show demo data. Get a free key at twelvedata.com and put it in .env."}
            </Text>
          </View>
        </Row>

        <SectionLabel style={{ marginTop: 28 }}>Data</SectionLabel>
        <Row>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Clear all alerts</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
              Currently {alertCount} alert{alertCount === 1 ? "" : "s"} saved on this device.
            </Text>
          </View>
          <Pressable
            onPress={async () => {
              await removeAll();
            }}
            disabled={alertCount === 0}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: alertCount === 0 ? colors.borderSubtle : colors.negative,
              opacity: alertCount === 0 ? 0.5 : 1,
            }}
          >
            <Text
              style={{ color: alertCount === 0 ? colors.textDisabled : colors.negative, fontWeight: "600" }}
            >
              Clear
            </Text>
          </Pressable>
        </Row>

        <SectionLabel style={{ marginTop: 28 }}>About</SectionLabel>
        <Row>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Version</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
              v{version} · {Platform.OS}
            </Text>
          </View>
        </Row>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle,
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
          marginBottom: 4,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
