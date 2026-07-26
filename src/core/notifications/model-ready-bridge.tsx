/**
 * Abre el modelo cuando el usuario toca la notificación de "Modelo listo".
 *
 * Sin esto la notificación solo traía al usuario a la app, a la pantalla en la
 * que estuviera: tenía que volver a buscar el escaneo y pulsar "Ver Modelo" a
 * mano, que es justo el paso que la notificación debería ahorrarle.
 *
 * Hay dos caminos distintos y los dos hacen falta:
 *   - App viva (en segundo plano): llega por el listener de respuestas.
 *   - App cerrada: el toque arranca el proceso, así que el evento ocurrió antes
 *     de que hubiera JS escuchando. Ese caso se recupera preguntando por la
 *     notificación que lanzó la app.
 *
 * Se monta una sola vez en el layout raíz, dentro del `ViewerProvider` (usa su
 * `loadFromPath`) y del `Stack` (usa el router). No renderiza nada.
 */
import { useViewer } from '@/features/viewer/presentation/context/viewer-context';
import { RelativePathString, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';

import {
  addModelReadyListener,
  getLaunchModelReady,
  ModelReadyPayload,
} from './model-download-notifications';

export function ModelReadyBridge() {
  const router = useRouter();
  const { loadFromPath } = useViewer();

  // Evita abrir dos veces el mismo aviso: en arranque en frío el toque puede
  // llegar por `getLaunchModelReady` y por el listener casi a la vez.
  const handledRef = useRef<string | null>(null);

  const open = useCallback(
    async (payload: ModelReadyPayload) => {
      const token = `${payload.scanId}:${payload.localUri}`;
      if (handledRef.current === token) return;
      handledRef.current = token;

      const loaded = await loadFromPath(payload.localUri);
      // Si el archivo desapareció (limpieza del sistema, desinstalación
      // parcial), no navegamos al visor vacío: el usuario vuelve a la lista y
      // el botón le ofrecerá descargarlo otra vez.
      if (!loaded) return;
      router.push('/viewer' as RelativePathString);
    },
    [loadFromPath, router],
  );

  useEffect(() => {
    const unsubscribe = addModelReadyListener((payload) => { void open(payload); });
    void getLaunchModelReady().then((payload) => { if (payload) void open(payload); });
    return unsubscribe;
  }, [open]);

  return null;
}
