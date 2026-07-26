/**
 * HUD mínimo en la esquina superior derecha: estado del tracking AR y, una
 * vez listo, un recordatorio de que el movimiento es físico.
 */
import { Text } from "@/core/components/ui/text";
import React from "react";
import { View } from "react-native";

type Props = {
  poseReady: boolean;
};

export function WalkHud({ poseReady }: Props) {
  return (
    <View
      className="absolute top-4 right-4 rounded-lg bg-canvas/45 px-2.5 py-1.5"
      pointerEvents="none"
    >
      {/* `tabular-nums` evita que el ancho baile cuando el texto cambia. */}
      <Text className="text-canvas-foreground text-[11px] tabular-nums">
        {poseReady ? "Caminá para moverte" : "Iniciando AR…"}
      </Text>
    </View>
  );
}
