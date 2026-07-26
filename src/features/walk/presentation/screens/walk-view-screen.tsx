/**
 * Pantalla del modo "Recorrer en VR".
 *
 * Estructura:
 *   <View fill>
 *     <ViroARSceneNavigator />        // cámara AR + pose (z-order 0)
 *     <Canvas r3f>                    // PLY en Three.js (z-order 1, alpha)
 *     <Overlays />                    // botones, HUD (z-order 2+)
 *   </View>
 *
 * Movimiento: el usuario camina de verdad. La pose de ARCore/ARKit se copia
 * 1:1 a la cámara de Three.js, así que un metro en la habitación es un metro
 * dentro del PLY. No hay joystick ni control de velocidad.
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
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { WalkCanvas } from "../components/walk-canvas";
import { WalkControlsOverlay } from "../components/walk-controls-overlay";
import { WalkHud } from "../components/walk-hud";
import { useWalkAnchoring } from "../hooks/use-walk-anchoring";
import { useWalkPose } from "../hooks/use-walk-pose";

/**
 * Altura asumida del teléfono sobre el piso al arrancar la sesión AR. El
 * origen del mundo AR nace ahí, no en el suelo, así que se usa para bajar el
 * PLY hasta el piso real.
 */
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
  const { poseRef, ready: poseReady } = useWalkPose();
  const anchoring = useWalkAnchoring();
  const [isExpoGo, setIsExpoGo] = useState<boolean | null>(null);

  useEffect(() => {
    void detectExpoGo().then(setIsExpoGo);
  }, []);

  useEffect(() => {
    if (!cloud && params.localUri && !loading) {
      void loadFromPath(params.localUri);
    }
  }, [cloud, params.localUri, loading, loadFromPath]);

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
      {/* 1. Viro AR: cámara + pose. Lazy para no romper Expo Go. */}
      <React.Suspense fallback={null}>
        <LazyWalkArScene />
      </React.Suspense>

      {/* 2. PLY en Three.js, sincronizado a la pose.
          El Canvas va con alpha: sin `gl.alpha` el WebGLRenderer limpia con
          negro opaco y tapa por completo el feed de la cámara de Viro — el
          PLY "no aparece" porque la pantalla entera es su clear color. */}
      <View style={styles.canvasLayer} pointerEvents="none">
        <Canvas
          style={styles.canvas}
          gl={{ alpha: true, premultipliedAlpha: false }}
          onCreated={({ gl, scene }) => {
            scene.background = null;
            gl.setClearColor(0x000000, 0);
          }}
          camera={{ fov: 75, near: 0.05, far: 200, position: [0, 0, 0] }}
          frameloop="always"
        >
          <WalkCanvas
            cloud={cloud}
            poseRef={poseRef}
            eyeHeight={EYE_HEIGHT}
            anchor={anchoring.anchor}
          />
        </Canvas>
      </View>

      {/* 3. Botones de control. */}
      <WalkControlsOverlay
        poseReady={poseReady}
        onRecenter={() => anchoring.recenter(poseRef)}
      />

      {/* 4. HUD. */}
      <WalkHud poseReady={poseReady} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  // Transparente en toda la pila: cualquier color de fondo aquí vuelve a
  // tapar el feed de la cámara que renderiza Viro por debajo.
  canvasLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  canvas: {
    flex: 1,
    backgroundColor: "transparent",
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
