/**
 * Botones de control en la pantalla del modo walk:
 *   - "Anclar": fija la pose actual (sólo visible cuando Viro detectó un plano).
 *   - "Salir": vuelve al drawer del scan.
 *   - "Caminar / Correr": toggle de velocidad.
 *
 * `pointerEvents="box-none"` deja pasar los toques al GL de Viro, así que
 * los toques en zonas vacías no consumen el evento.
 */
import { Button } from "@/core/components/ui/button";
import { Text } from "@/core/components/ui/text";
import { useRouter } from "expo-router";
import { Footprints, MoveRight, X } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

import { AnchoringState } from "../hooks/use-walk-anchoring";

type Props = {
  tracking: AnchoringState;
  onAnchor: () => void;
  running: boolean;
  onToggleRunning: () => void;
};

export function WalkControlsOverlay({ tracking, onAnchor, running, onToggleRunning }: Props) {
  const router = useRouter();
  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.topRow} pointerEvents="box-none">
        <Button
          variant="secondary"
          size="icon"
          onPress={() => router.back()}
          accessibilityLabel="Salir"
          testID="walk-exit"
        >
          <X size={20} />
        </Button>
      </View>

      <View style={styles.bottomRow} pointerEvents="box-none">
        <Button
          variant={running ? "default" : "secondary"}
          onPress={onToggleRunning}
          testID="walk-toggle-speed"
        >
          <Footprints size={16} />
          <Text>{running ? "Correr" : "Caminar"}</Text>
        </Button>

        {tracking === "detected" && (
          <Button onPress={onAnchor} testID="walk-anchor">
            <MoveRight size={16} />
            <Text>Anclar</Text>
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    width: "100%",
  },
  bottomRow: {
    position: "absolute",
    bottom: 32,
    right: 16,
    flexDirection: "row",
    gap: 8,
  },
});
