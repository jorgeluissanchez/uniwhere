/**
 * Botones de control en la pantalla del modo walk:
 *   - "Salir": vuelve al drawer del scan.
 *   - "Recentrar aquí": replanta el PLY en la posición actual del usuario.
 *
 * No hay control de movimiento: el usuario se mueve caminando de verdad y la
 * pose de ARCore/ARKit lo traslada dentro del modelo.
 *
 * `pointerEvents="box-none"` deja pasar los toques al GL de Viro, así que
 * los toques en zonas vacías no consumen el evento.
 */
import { Button } from "@/core/components/ui/button";
import { Icon } from "@/core/components/ui/icon";
import { Text } from "@/core/components/ui/text";
import { useRouter } from "expo-router";
import { Crosshair, X } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  /** True cuando Viro ya publicó pose; sin eso, recentrar no tiene sentido. */
  poseReady: boolean;
  onRecenter: () => void;
};

export function WalkControlsOverlay({ poseReady, onRecenter }: Props) {
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
          {/* Vía `Icon`, no `<X />` suelto: la primitiva lee el
              `TextClassContext` del Button y hereda `text-secondary-foreground`.
              Un lucide crudo se pinta con su color por defecto y se pierde
              contra el fondo del botón. */}
          <Icon as={X} size={20} />
        </Button>
      </View>

      <View style={styles.bottomRow} pointerEvents="box-none">
        {poseReady && (
          <Button onPress={onRecenter} testID="walk-recenter">
            <Icon as={Crosshair} size={16} />
            <Text>Recentrar aquí</Text>
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
