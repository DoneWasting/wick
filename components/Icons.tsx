import React from "react";
import Svg, { Path, Rect, Circle, Line } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

export function CandlestickIcon({ size = 22, color = "#8a929c" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="8" y1="3" x2="8" y2="6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Rect x="6" y="6" width="4" height="10" rx="0.8" fill={color} />
      <Line x1="8" y1="16" x2="8" y2="21" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="8" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Rect x="14" y="8" width="4" height="9" rx="0.8" fill={color} />
      <Line x1="16" y1="17" x2="16" y2="22" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export function BellIcon({ size = 18, color = "#8a929c" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3a6 6 0 00-6 6v3.5L4.5 15.5h15L18 12.5V9a6 6 0 00-6-6z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M10 18.5a2 2 0 004 0"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

export function MenuIcon({ size = 24, color = "#e6e8eb" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="18" x2="21" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function TrashIcon({ size = 22, color = "#e6e8eb" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h16"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function PencilIcon({ size = 22, color = "#e6e8eb" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14.5 4.5l5 5L8 21H3v-5L14.5 4.5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 20, color = "#8a929c" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CheckIcon({ size = 16, color = "#e6e8eb" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12l4 4 10-10"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function RadioOuter({ size = 22, color = "#8a929c", filled = false }: IconProps & { filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="10"
        stroke={filled ? "#4a90e2" : color}
        strokeWidth="2"
        fill="none"
      />
      {filled && <Circle cx="12" cy="12" r="5" fill="#4a90e2" />}
    </Svg>
  );
}
