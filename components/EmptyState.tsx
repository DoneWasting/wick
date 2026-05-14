import React from "react";
import { Text, View } from "react-native";
import { BellIcon } from "./Icons";
import { colors } from "../lib/theme";

export function EmptyState() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
        minHeight: 320,
      }}
    >
      <View style={{ opacity: 0.5 }}>
        <BellIcon size={64} color={colors.textDisabled} />
      </View>
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 15,
          marginTop: 20,
          textAlign: "center",
          lineHeight: 24,
        }}
      >
        No alerts yet.{"\n"}Tap the pencil to create one.
      </Text>
    </View>
  );
}
