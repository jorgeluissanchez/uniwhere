/**
 * Joystick virtual translucido que el usuario usa para caminar dentro del PLY.
 *
 * - Forma: pad circular con un knob más pequeño adentro.
 * - Input: el centro es (0,0); al arrastrar, el knob se mueve hacia donde
 *   va el dedo. El valor se normaliza a [-1..1] en cada eje.
 * - Output: dos `SharedValue` (x, z) con offset en píxeles dentro del pad.
 *   El bridge (`walkDirection`) las convierte a vector de caminata.
 *
 * El knob no puede salirse del pad: distanceFromCenter se clampa al radio.
 */
import { runOnJS } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useWalkJoystick } from "../hooks/use-walk-joystick";

const PAD_RADIUS = 70;       // px, radio del pad
const KNOB_RADIUS = 26;      // px, radio del knob
const DEADZONE = 0.06;       // ratio dentro del pad

type Props = {
  joystick: ReturnType<typeof useWalkJoystick>;
};

export function WalkJoystick({ joystick }: Props) {
  const startX = useSharedValue(0);
  const startZ = useSharedValue(0);

  const pan = Gesture.Pan()
    .onBegin(() => {
      startX.value = joystick.knobX.value;
      startZ.value = joystick.knobZ.value;
    })
    .onChange((e) => {
      const nextX = startX.value + e.translationX;
      const nextZ = startZ.value + e.translationY;
      const dist = Math.hypot(nextX, nextZ);
      const max = PAD_RADIUS - KNOB_RADIUS;
      const clampedX = dist > max ? (nextX / dist) * max : nextX;
      const clampedZ = dist > max ? (nextZ / dist) * max : nextZ;
      joystick.knobX.value = clampedX;
      joystick.knobZ.value = clampedZ;
      // Normalizar a [-1..1] por radio.
      const nx = clampedX / max;
      const nz = clampedZ / max;
      joystick.panX.value = Math.abs(nx) < DEADZONE ? 0 : nx;
      joystick.panZ.value = Math.abs(nz) < DEADZONE ? 0 : nz;
      runOnJS(joystick.syncToJS)(joystick.panX.value, joystick.panZ.value);
    })
    .onEnd(() => {
      joystick.knobX.value = withTiming(0, { duration: 120 });
      joystick.knobZ.value = withTiming(0, { duration: 120 });
      joystick.panX.value = withTiming(0, { duration: 120 });
      joystick.panZ.value = withTiming(0, { duration: 120 });
      runOnJS(joystick.syncToJS)(0, 0);
    });

  const knobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: joystick.knobX.value - KNOB_RADIUS },
      { translateY: joystick.knobZ.value - KNOB_RADIUS },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.pad} pointerEvents="box-none">
        <View style={[styles.padBg, { width: PAD_RADIUS * 2, height: PAD_RADIUS * 2 }]}>
          <View style={[styles.knob, knobStyle, { width: KNOB_RADIUS * 2, height: KNOB_RADIUS * 2 }]} />
        </View>
      </View>
    </GestureDetector>
  );
}

// Componente de UI alternativo con un Skia canvas circular (más pulido).
// Por simplicidad y porque no necesitamos pintar nada vectorial complejo
// aquí, lo dejo como opción: el joystick real está arriba basado en Views.

const styles = StyleSheet.create({
  pad: {
    position: "absolute",
    bottom: 32,
    left: 32,
    width: PAD_RADIUS * 2,
    height: PAD_RADIUS * 2,
    alignItems: "center",
    justifyContent: "center",
  },
  padBg: {
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  knob: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
});
