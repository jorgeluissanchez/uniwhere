/**
 * Pantalla del modo "Recorrer en VR".
 *
 * Estructura:
 *   <View fill>
 *     <ViroARSceneNavigator />        // cámara AR + pose (z-order 0)
 *     <Canvas r3f>                    // PLY en Three.js (z-order 1)
 *     <Overlays />                    // botones, HUD, joystick (z-order 2+)
 *   </View>
 *
 * Sobre Expo Go: Viro llama a `NativeModules.VRTMaterialManager` y
 * `NativeModules.VRTAnimationModule` en *evaluación de módulo*. Esos
 * módulos no existen en Expo Go, así que importar Viro en el top-level
 * hace crashear el bundler. Por eso:
 *   1. Detectamos Expo Go antes de tocar Viro.
 *   2. Si estamos en Expo Go, mostramos un fallback explicando que la
 *      feature sólo funciona en development build.
 *   3. `WalkArScene` se importa con `React.lazy` + `Suspense` para que el
 *      module-eval de Viro sólo ocurra cuando ya estamos en un dev build.
 *      (Lazy igual evalúa en el primer render, pero al menos pospone la
 *      explosión hasta que la pantalla esté montada.)
 *
 * Carga:
 *   - Si `viewerContext.cloud` ya está cargada (porque el usuario venía
 *     del viewer), entramos directo.
 *   - Si no, esperamos a que `loadFromPath(selectedScan.localUri)` termine.
 */
import { Spinner } from "@/core/components/ui/spinner";
import { Text } from "@/core/components/ui/text";
import { useViewer } from "@/features/viewer/presentation/context/viewer-context";
import { Canvas } from "@react-three/fiber/native";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { WalkCanvas } from "../components/walk-canvas";
import { WalkControlsOverlay } from "../components/walk-controls-overlay";
import { WalkHud } from "../components/walk-hud";
import { WalkJoystick } from "../components/walk-joystick";
import { useWalkAnchoring } from "../hooks/use-walk-anchoring";
import { useWalkJoystick } from "../hooks/use-walk-joystick";
import { useWalkPose } from "../hooks/use-walk-pose";
import { WALK_SPEED_DEFAULT, WALK_SPEED_RUN } from "../utils/walk-vector";

const EYE_HEIGHT = 1.65;  // m

// Lazy: Viro's module evaluation crashes in Expo Go. We only resolve
// WalkArScene on devices that can actually run Viro.
const LazyWalkArScene = React.lazy(async () => {
  const mod = await import('../components/walk-ar-scene');
  return { default: mod.WalkArScene };
});

let cachedIsExpoGo: boolean | undefined;
async function detectExpoGo(): Promise<boolean> {
  if (cachedIsExpoGo !== undefined) return cachedIsExpoGo;
  try {
    const expo = await import('expo');
    cachedIsExpoGo = !!expo.isRunningInExpoGo?.();
  } catch {
    cachedIsExpoGo = false;
  }
  return cachedIsExpoGo;
}

function ExpoGoFallback() {
  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackTitle}>Modo AR no disponible en Expo Go</Text>
      <Text style={styles.fallbackBody}>
        La función "Recorrer en VR" usa ARCore (Android) y ARKit (iOS), que
        no están incluidos en Expo Go. Para probarla necesitás un
        development build:
      </Text>
      <Text style={styles.fallbackCode}>
        npx expo prebuild --clean{'\n'}
        npx expo run:android --device
      </Text>
      <Text style={styles.fallbackHint}>
        Dispositivo físico con ARCore (Android) o ARKit (iPhone ≥ 6s).
      </Text>
    </View>
  );
}

export function WalkViewScreen() {
  const { cloud, loading, error, loadFromPath } = useViewer();
  const params = useLocalSearchParams<{ localUri?: string }>();
  const poseRef = useWalkPose();
  const joystick = useWalkJoystick();
  const anchoring = useWalkAnchoring();
  const [running, setRunning] = useState(false);
  const [isExpoGo, setIsExpoGo] = useState<boolean | null>(null);

  useEffect(() => {
    void detectExpoGo().then(setIsExpoGo);
  }, []);

  useEffect(() => {
    if (!cloud && params.localUri && !loading) {
      void loadFromPath(params.localUri);
    }
  }, [cloud, params.localUri, loading, loadFromPath]);

  const speed = running ? WALK_SPEED_RUN : WALK_SPEED_DEFAULT;

  // El offset del PLY en coords centradas (para Viro).
  const offset = useMemo<readonly [number, number, number]>(() => {
    if (!cloud) return [0, 0, 0];
    return [
      cloud.centeringOffset.x,
      cloud.centeringOffset.y,
      cloud.centeringOffset.z,
    ];
  }, [cloud]);

  if (isExpoGo === null) {
    return (
      <View style={styles.loading}>
        <Spinner size="large" />
      </View>
    );
  }

  if (isExpoGo) {
    return <ExpoGoFallback />;
  }

  if (!cloud) {
    return (
      <View style={styles.loading}>
        <Spinner size="large" />
        <Text style={{ marginTop: 12, color: "#fff" }}>
          {loading ? "Cargando PLY…" : error ?? "Sin PLY"}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. Viro AR: cámara + plane detection + pose. Lazy para no romper Expo Go. */}
      <React.Suspense fallback={null}>
        <LazyWalkArScene offset={offset} />
      </React.Suspense>

      {/* 2. PLY en Three.js, sincronizado a la pose. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Canvas
          camera={{ fov: 75, near: 0.05, far: 100, position: [0, EYE_HEIGHT, 0] }}
          frameloop="always"
        >
          <WalkCanvas
            cloud={cloud}
            poseRef={poseRef}
            walkVectorRef={joystick.walkVectorRef.current}
            speed={speed}
            eyeHeight={EYE_HEIGHT}
          />
        </Canvas>
      </View>

      {/* 3. Botones de control. */}
      <WalkControlsOverlay
        tracking={anchoring.state}
        onAnchor={anchoring.anchor}
        running={running}
        onToggleRunning={() => setRunning((v) => !v)}
      />

      {/* 4. HUD. */}
      <WalkHud speed={speed} eyeHeight={EYE_HEIGHT} poseReady={poseRef.ready} />

      {/* 5. Joystick. */}
      <WalkJoystick joystick={joystick} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loading: {
    flex: 1,
    backgroundColor: "#0f0f1a",
    alignItems: "center",
    justifyContent: "center",
  },
  fallback: {
    flex: 1,
    backgroundColor: "#0f0f1a",
    paddingHorizontal: 24,
    paddingTop: 80,
    gap: 16,
  },
  fallbackTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  fallbackBody: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    lineHeight: 22,
  },
  fallbackCode: {
    color: "#fff",
    fontFamily: "monospace",
    fontSize: 13,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  fallbackHint: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontStyle: "italic",
  },
});
