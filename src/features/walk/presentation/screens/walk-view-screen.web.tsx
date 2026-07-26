/**
 * Pantalla del modo "Recorrer en VR" en web.
 *
 * Metro resuelve `.web.tsx` antes que `.tsx`, así que el bundle web usa este
 * archivo y nunca llega a resolver Viro — que es código nativo y no existe en
 * el navegador. La versión nativa vive en `walk-view-screen.tsx`.
 *
 * Estructura:
 *   <View fill>
 *     <WalkCameraFeed />   // <video> de la cámara, solo en el modo sin XR
 *     <WalkXrScene />      // canvas transparente con el PLY
 *     <Overlays />         // botones y HUD
 *   </View>
 *
 * Movimiento: igual que en nativo, solo físico. Con WebXR lo entrega el
 * tracking del navegador; sin WebXR no hay desplazamiento posible, solo mirar
 * alrededor. No se añaden controles sintéticos.
 */
import { Button } from '@/core/components/ui/button';
import { Icon } from '@/core/components/ui/icon';
import { Spinner } from '@/core/components/ui/spinner';
import { Text } from '@/core/components/ui/text';
import { useViewer } from '@/features/viewer/presentation/context/viewer-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Eye, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { WalkCameraFeed } from '../components/walk-camera-feed.web';
import { useXrSupport, WalkXrScene } from '../components/walk-xr-scene.web';
import { useWalkAnchoring } from '../hooks/use-walk-anchoring';

export function WalkViewScreen() {
  const router = useRouter();
  const { cloud, loading, error, loadFromPath } = useViewer();
  const params = useLocalSearchParams<{ localUri?: string }>();
  const support = useXrSupport();
  const { anchor } = useWalkAnchoring();

  const [sessionActive, setSessionActive] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const startSessionRef = useRef<(() => Promise<void>) | null>(null);
  const [xrError, setXrError] = useState<string | null>(null);

  useEffect(() => {
    if (!cloud && params.localUri && !loading) {
      void loadFromPath(params.localUri);
    }
  }, [cloud, params.localUri, loading, loadFromPath]);

  const onReady = useCallback((start: () => Promise<void>) => {
    startSessionRef.current = start;
  }, []);

  const handleStart = useCallback(async () => {
    setXrError(null);
    try {
      await startSessionRef.current?.();
    } catch {
      // El caso habitual es que el usuario rechace el permiso de AR, o que la
      // página no esté en HTTPS (WebXR lo exige).
      setXrError('No se pudo iniciar la sesión AR. Requiere HTTPS y permiso de cámara.');
    }
  }, []);

  if (!cloud) {
    return (
      <View className="flex-1 bg-canvas items-center justify-center">
        <Spinner size="large" className="text-primary" />
        <Text className="text-canvas-foreground mt-3">
          {loading ? 'Cargando PLY…' : error ?? 'Sin PLY'}
        </Text>
      </View>
    );
  }

  const xrReady = support === 'supported';

  return (
    // `bg-black` y no `bg-canvas`: debajo va el feed de la cámara, así que esto
    // solo se ve mientras arranca.
    <View className="flex-1 bg-black overflow-hidden">
      {/* La cámara de fondo solo hace falta sin WebXR: en una sesión inmersiva
          el compositor del navegador ya dibuja el paso de cámara. */}
      {!xrReady && <WalkCameraFeed onError={setFeedError} />}

      <WalkXrScene
        cloud={cloud}
        anchor={anchor}
        onReady={onReady}
        onSessionChange={setSessionActive}
      />

      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topRow} pointerEvents="box-none">
          <Button variant="secondary" size="icon" onPress={() => router.back()} testID="walk-exit">
            {/* Vía `Icon`: hereda el color del Button por `TextClassContext`.
                Un lucide crudo se pinta con su color por defecto. */}
            <Icon as={X} size={20} />
          </Button>
        </View>

        <View
          className="absolute top-4 right-4 rounded-lg bg-canvas/45 px-2.5 py-1.5"
          pointerEvents="none"
        >
          <Text className="text-canvas-foreground text-[11px]">
            {support === 'checking'
              ? 'Comprobando soporte AR…'
              : xrReady
                ? sessionActive ? 'Caminá para moverte' : 'Listo para iniciar AR'
                : 'Girá el teléfono para mirar alrededor'}
          </Text>
        </View>

        <View style={styles.bottomRow} pointerEvents="box-none">
          {xrReady && !sessionActive && (
            <Button onPress={handleStart} testID="walk-start-xr">
              <Icon as={Eye} size={16} />
              <Text>Iniciar AR</Text>
            </Button>
          )}
        </View>

        {(xrError || feedError || !xrReady) && (
          <View
            className="absolute bottom-8 left-4 max-w-[340px] rounded-lg bg-canvas/60 p-3"
            pointerEvents="none"
          >
            {(xrError || feedError) && (
              <Text className="text-canvas-foreground/90 text-xs leading-[18px]">
                {xrError ?? feedError}
              </Text>
            )}
            {!xrReady && support !== 'checking' && !xrError && !feedError && (
              <Text className="text-canvas-foreground/90 text-xs leading-[18px]">
                Este navegador no soporta AR con seguimiento de posición, así que
                podés mirar alrededor pero no desplazarte. Para recorrer el modelo
                caminando, abrilo en Chrome para Android o usá la app.
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

/**
 * Solo queda aquí el layout absoluto de las capas de overlay. Todo color pasó a
 * utilidades de Tailwind con los tokens del design system.
 */
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
  },
  bottomRow: {
    position: 'absolute',
    bottom: 32,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
});
