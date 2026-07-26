/**
 * HUD mínimo en la esquina superior derecha: estado del tracking AR y, una
 * vez listo, un recordatorio de que el movimiento es físico.
 */
import { Text } from "@/core/components/ui/text";
import React from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  poseReady: boolean;
};

export function WalkHud({ poseReady }: Props) {
  return (
    <View style={styles.hud} pointerEvents="none">
      <Text style={styles.line}>
        {poseReady ? "Caminá para moverte" : "Iniciando AR…"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hud: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  line: {
    color: "#fff",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
});
