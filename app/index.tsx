import React, { useState } from "react";
import {
  Alert as RNAlert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAlerts } from "../hooks/useAlerts";
import { AlertCard } from "../components/AlertCard";
import { EmptyState } from "../components/EmptyState";
import { MenuIcon, PencilIcon, TrashIcon } from "../components/Icons";
import { colors } from "../lib/theme";
import { useNow } from "../hooks/useNow";
import { formatClock, formatUtcClock } from "../lib/countdown";
import { Sidebar } from "../components/Sidebar";

export default function Home() {
  const router = useRouter();
  const { alerts, hydrated, toggleAlert, removeAll } = useAlerts();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const now = useNow(1000);
  const nowDate = new Date(now);

  const handleDeleteAll = () => {
    if (alerts.length === 0) return;
    if (Platform.OS === "web") {
      setConfirmDelete(true);
      return;
    }
    RNAlert.alert(
      "Delete all alerts?",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => void removeAll() },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top", "left", "right"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 8,
        }}
      >
        <Pressable hitSlop={10} onPress={() => setSidebarOpen(true)}>
          <MenuIcon size={26} color={colors.textPrimary} />
        </Pressable>
        <Pressable hitSlop={10} onPress={handleDeleteAll}>
          <TrashIcon size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      <Text
        style={{
          color: colors.textPrimary,
          paddingHorizontal: 20,
          paddingTop: 8,
          fontSize: 28,
          fontWeight: "700",
        }}
      >
        Candle alerts
      </Text>
      <Text
        style={{
          color: colors.textSecondary,
          paddingHorizontal: 20,
          paddingTop: 4,
          paddingBottom: 16,
          fontSize: 13,
        }}
      >
        Now {formatClock(nowDate)} local · {formatUtcClock(nowDate)} UTC
      </Text>

      {!hydrated ? null : alerts.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 140 }}>
          {alerts.map((a) => (
            <AlertCard key={a.id} alert={a} onToggle={toggleAlert} />
          ))}
        </ScrollView>
      )}

      <Pressable
        onPress={() => router.push("/create")}
        style={{
          position: "absolute",
          right: 24,
          bottom: 32,
          width: 56,
          height: 56,
          borderRadius: 14,
          backgroundColor: colors.accentBlueDark,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOpacity: 0.4,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <PencilIcon size={26} color={colors.textPrimary} />
      </Pressable>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onConfirmClearAll={() => setConfirmDelete(true)}
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
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "600", marginBottom: 8 }}>
              Delete all alerts?
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 20 }}>
              This cannot be undone.
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <Pressable
                onPress={() => setConfirmDelete(false)}
                style={{ paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 }}
              >
                <Text style={{ color: colors.accentBlue, fontSize: 15, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setConfirmDelete(false);
                  void removeAll();
                }}
                style={{ paddingHorizontal: 16, paddingVertical: 8 }}
              >
                <Text style={{ color: colors.negative, fontWeight: "600", fontSize: 15 }}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
