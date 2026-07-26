/**
 * HUD mínimo en la esquina superior derecha: muestra la velocidad actual
 * y, si la pose AR está lista, la altura del ojo sobre el suelo del PLY.
 */
import { Text } from "@/core/components/ui/text";
import React from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  speed: number;       // m/s actuales
  eyeHeight: number;   // altura del ojo sobre el suelo del PLY
  poseReady: boolean;
};

export function WalkHud({ speed, eyeHeight, poseReady }: Props) {
  return (
    <View style={styles.hud} pointerEvents="none">
      <Text style={styles.line}>{speed.toFixed(1)} m/s</Text>
      <Text style={styles.line}>
        {poseReady ? `Ojo: ${eyeHeight.toFixed(2)} m` : "Iniciando AR…"}
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
