import React, { useEffect, useRef } from "react";
import { Animated, Text } from "react-native";

interface Props {
  message: string | null;
  onHide: () => void;
}

export function Toast({ message, onHide }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
    const t = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => onHide());
    }, 2200);
    return () => clearTimeout(t);
  }, [message, opacity, onHide]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 24,
        right: 24,
        bottom: 96,
        opacity,
      }}
    >
      <Animated.View
        style={{
          backgroundColor: "#1a2230",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: "#2a313c",
        }}
      >
        <Text style={{ color: "#FFFFFF", textAlign: "center" }}>{message}</Text>
      </Animated.View>
    </Animated.View>
  );
}
