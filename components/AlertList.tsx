import React, { useCallback } from "react";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { Alert } from "../types";
import { AlertCard } from "./AlertCard";

interface Props {
  alerts: Alert[];
  onToggle: (id: string, next: boolean) => void;
  onReorder: (alerts: Alert[]) => void;
}

export function AlertList({ alerts, onToggle, onReorder }: Props) {
  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Alert>) => (
      <AlertCard
        alert={item}
        onToggle={onToggle}
        onLongPress={drag}
        isDragging={isActive}
      />
    ),
    [onToggle]
  );

  return (
    <DraggableFlatList
      data={alerts}
      keyExtractor={(item) => item.id}
      onDragEnd={({ data }) => onReorder(data)}
      activationDistance={12}
      containerStyle={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 140 }}
      renderItem={renderItem}
    />
  );
}
