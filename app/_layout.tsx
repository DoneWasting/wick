import React, { useEffect } from "react";
import { Platform, StatusBar, View } from "react-native";
import { Stack } from "expo-router";
import * as Notifications from "expo-notifications";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  ensurePermissions,
  initAndroidChannels,
  initWebNotificationsBackend,
} from "../lib/notifications";
import { useAlerts } from "../hooks/useAlerts";
import { useCandleScheduler } from "../hooks/useCandleScheduler";
import { colors } from "../lib/theme";
import { GlobalToast } from "../components/GlobalToast";
import { loadLastTimeframe } from "../lib/preferences";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export default function RootLayout() {
  useAlerts();
  useCandleScheduler();

  useEffect(() => {
    void ensurePermissions();
    // Register the service worker on web (no-op on native). The SW handles
    // Notification Triggers scheduling so notifications survive tab closure
    // on Chromium-based browsers.
    void initWebNotificationsBackend();
    // Register Android notification channels (no-op on web/iOS). Channels
    // own the sound on Android, so this must run before scheduleAlert.
    void initAndroidChannels();
    // Warm the last-used-timeframe cache so the create screen reads it sync.
    void loadLastTimeframe();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: "slide_from_bottom",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen
              name="create"
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="edit/[id]"
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="settings"
              options={{ presentation: "card", animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="upgrade"
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
          </Stack>
          {/* Mounted outside the Stack so toasts render above modal screens. */}
          <GlobalToast />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
