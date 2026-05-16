import React, { useState } from "react";
import { ScrollView } from "react-native";
import { Alert } from "../types";
import { AlertCard } from "./AlertCard";
import { colors } from "../lib/theme";

interface Props {
  alerts: Alert[];
  onToggle: (id: string, next: boolean) => void;
  onReorder: (alerts: Alert[]) => void;
}

// Web build only. react-native-draggable-flatlist's gesture handlers don't
// trigger reliably under react-native-web with mouse input, so this variant
// uses the browser's native HTML5 drag-and-drop API on plain divs instead.
export function AlertList({ alerts, onToggle, onReorder }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const reset = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      reset();
      return;
    }
    const next = [...alerts];
    const [moved] = next.splice(dragIndex, 1);
    // After removing dragIndex, indices shift by one for positions past it.
    const insertAt = targetIndex > dragIndex ? targetIndex - 1 : targetIndex;
    next.splice(insertAt, 0, moved);
    onReorder(next);
    reset();
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 140 }}>
      {alerts.map((alert, idx) => {
        const isDragging = dragIndex === idx;
        const showIndicator =
          overIndex === idx && dragIndex !== null && dragIndex !== idx;
        return React.createElement(
          "div",
          {
            key: alert.id,
            draggable: true,
            onDragStart: (e: React.DragEvent) => {
              setDragIndex(idx);
              e.dataTransfer.effectAllowed = "move";
              // Firefox needs setData to start a drag.
              e.dataTransfer.setData("text/plain", String(idx));
            },
            onDragOver: (e: React.DragEvent) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (overIndex !== idx) setOverIndex(idx);
            },
            onDrop: (e: React.DragEvent) => {
              e.preventDefault();
              handleDrop(idx);
            },
            onDragEnd: reset,
            style: {
              cursor: dragIndex === null ? "grab" : "grabbing",
              opacity: isDragging ? 0.4 : 1,
              borderTop: showIndicator
                ? `2px solid ${colors.accentBlue}`
                : "2px solid transparent",
              userSelect: "none",
            },
          },
          <AlertCard alert={alert} onToggle={onToggle} isDragging={isDragging} />
        );
      })}
    </ScrollView>
  );
}
