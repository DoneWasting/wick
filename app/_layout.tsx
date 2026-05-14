import React, { useEffect } from "react";
import { Platform, StatusBar, View } from "react-native";
import { Stack } from "expo-router";
import * as Notifications from "expo-notifications";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ensurePermissions, initWebNotificationsBackend } from "../lib/notifications";
import { useAlerts } from "../hooks/useAlerts";
import { useCandleScheduler } from "../hooks/useCandleScheduler";
import { colors } from "../lib/theme";

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
  }, []);

  return (
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
        </Stack>
      </View>
    </SafeAreaProvider>
  );
}
