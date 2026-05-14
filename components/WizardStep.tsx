import React from "react";
import { Text, View } from "react-native";
import { colors } from "../lib/theme";

type StepState = "active" | "collapsed" | "upcoming";

interface Props {
  number: number;
  title: string;
  subtitle?: string;
  state: StepState;
  isLast?: boolean;
  children?: React.ReactNode;
}

export function WizardStep({
  number,
  title,
  subtitle,
  state,
  isLast,
  children,
}: Props) {
  const dim = state === "upcoming";
  const titleColor = dim ? colors.textSecondary : colors.textPrimary;
  const circleBg = dim ? colors.borderSubtle : "#cfd6dd";
  const circleText = dim ? colors.textSecondary : colors.bg;

  return (
    <View style={{ flexDirection: "row" }}>
      <View style={{ alignItems: "center", marginRight: 16, width: 32 }}>
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: circleBg,
            borderWidth: 1,
            borderColor: dim ? colors.borderSubtle : "#cfd6dd",
          }}
        >
          <Text style={{ color: circleText, fontWeight: "600" }}>{number}</Text>
        </View>
        {!isLast && (
          <View
            style={{
              width: 1,
              flexGrow: 1,
              minHeight: 24,
              backgroundColor: "#2a313c",
              marginTop: 4,
            }}
          />
        )}
      </View>

      <View style={{ flex: 1, paddingBottom: 24 }}>
        <Text
          style={{
            fontSize: 16,
            lineHeight: 24,
            color: titleColor,
            fontWeight: state === "active" ? "600" : "500",
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 13, marginTop: 2, color: colors.textSecondary }}>
            {subtitle}
          </Text>
        ) : null}
        {children ? <View style={{ marginTop: 16 }}>{children}</View> : null}
      </View>
    </View>
  );
}
