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
      <View style={styles.loading}>
        <Spinner size="large" />
        <Text style={styles.loadingText}>
          {loading ? 'Cargando PLY…' : error ?? 'Sin PLY'}
        </Text>
      </View>
    );
  }

  const xrReady = support === 'supported';

  return (
    <View style={styles.container}>
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
            <X size={20} />
          </Button>
        </View>

        <View style={styles.hud} pointerEvents="none">
          <Text style={styles.hudText}>
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
              <Eye size={16} />
              <Text>Iniciar AR</Text>
            </Button>
          )}
        </View>

        {(xrError || feedError || !xrReady) && (
          <View style={styles.notice} pointerEvents="none">
            {(xrError || feedError) && (
              <Text style={styles.noticeText}>{xrError ?? feedError}</Text>
            )}
            {!xrReady && support !== 'checking' && !xrError && !feedError && (
              <Text style={styles.noticeText}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  loading: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#fff',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
  },
  hud: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  hudText: {
    color: '#fff',
    fontSize: 11,
  },
  bottomRow: {
    position: 'absolute',
    bottom: 32,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  notice: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    maxWidth: 340,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 8,
  },
  noticeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    lineHeight: 18,
  },
});
