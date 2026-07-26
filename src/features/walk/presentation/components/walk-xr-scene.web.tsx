/**
 * Recorrido AR en web. Dos modos, según lo que soporte el navegador.
 *
 * 1. WebXR (`immersive-ar`): AR de verdad. El `WebXRManager` de Three.js toma
 *    la pose del visor cada frame y escribe él mismo la cámara, así que el
 *    movimiento físico del usuario lo desplaza dentro del PLY igual que en
 *    nativo. Por eso aquí NO se toca `camera.position`: hacerlo pelearía con
 *    el manager y rompería el tracking.
 *
 *    Se pide `local-floor` como referencia: su origen está en el piso, no a la
 *    altura del dispositivo. Eso simplifica plantar el modelo — el suelo del
 *    PLY va directo a y=0 — y es más fiable que estimar la altura del ojo,
 *    que es lo que hay que hacer en nativo.
 *
 * 2. Sin WebXR: la cámara del dispositivo de fondo y el giroscopio para mirar
 *    alrededor desde un punto fijo. NO hay desplazamiento: sin tracking
 *    posicional, moverse solo sería posible con controles sintéticos, y el
 *    movimiento en este modo es físico por decisión de producto.
 *
 * Nota de plataforma: `immersive-ar` hoy solo existe en Chrome/Android con
 * ARCore y sobre HTTPS. Safari iOS y los navegadores de escritorio caen
 * siempre en el modo 2.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { PlyCloud } from '@/features/viewer/domain/entities/ply-cloud';

import { CloudAnchor, WalkCloud } from './walk-cloud';

/** Altura del ojo sobre el piso en el modo sin WebXR, en metros. */
const EYE_HEIGHT = 1.65;

export type XrSupport = 'checking' | 'supported' | 'unsupported';

/** ¿Puede este navegador abrir una sesión `immersive-ar`? */
export function useXrSupport(): XrSupport {
  const [support, setSupport] = useState<XrSupport>('checking');

  useEffect(() => {
    let cancelled = false;
    const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
    if (!xr?.isSessionSupported) {
      setSupport('unsupported');
      return;
    }
    xr.isSessionSupported('immersive-ar')
      .then((ok) => { if (!cancelled) setSupport(ok ? 'supported' : 'unsupported'); })
      .catch(() => { if (!cancelled) setSupport('unsupported'); });
    return () => { cancelled = true; };
  }, []);

  return support;
}

/**
 * Orientación desde el giroscopio, para el modo sin WebXR.
 *
 * `deviceorientation` entrega alpha/beta/gamma en grados; el orden 'YXZ' es el
 * que corresponde a esa terna. El giro final sobre X compensa que la
 * referencia del evento sea la pantalla mirando al cielo, mientras que la
 * cámara de Three.js mira al horizonte.
 */
function DeviceOrientationCamera({ eyeHeight }: { eyeHeight: number }) {
  const { camera } = useThree();
  const orientation = useRef<{ alpha: number; beta: number; gamma: number } | null>(null);

  useEffect(() => {
    const onOrientation = (event: DeviceOrientationEvent) => {
      orientation.current = {
        alpha: event.alpha ?? 0,
        beta: event.beta ?? 0,
        gamma: event.gamma ?? 0,
      };
    };
    window.addEventListener('deviceorientation', onOrientation);
    return () => window.removeEventListener('deviceorientation', onOrientation);
  }, []);

  useFrame(() => {
    camera.position.set(0, eyeHeight, 0);
    const current = orientation.current;
    if (!current) return;

    const degToRad = Math.PI / 180;
    const euler = new THREE.Euler(
      current.beta * degToRad,
      current.alpha * degToRad,
      -current.gamma * degToRad,
      'YXZ',
    );
    camera.quaternion.setFromEuler(euler);
    camera.quaternion.multiply(new THREE.Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2));
  });

  return null;
}

type Props = {
  cloud: PlyCloud;
  anchor: CloudAnchor;
  /** Se dispara cuando arranca o termina la sesión inmersiva. */
  onSessionChange?: (active: boolean) => void;
  /** Registra la función que inicia la sesión, para el botón del overlay. */
  onReady?: (start: () => Promise<void>) => void;
};

export function WalkXrScene({ cloud, anchor, onSessionChange, onReady }: Props) {
  const support = useXrSupport();
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Con `local-floor` el origen ya está en el piso, así que basta con subir el
  // modelo por su propio mínimo. En el modo sin XR la cámara se coloca a la
  // altura del ojo, así que el criterio es el mismo: suelo del PLY en y=0.
  const groundOffsetY = useMemo(() => -cloud.boundingBox.min.y, [cloud.boundingBox]);

  const startSession = useCallback(async () => {
    const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
    const renderer = rendererRef.current;
    if (!xr || !renderer) return;

    const session = await xr.requestSession('immersive-ar', {
      // `local-floor` es lo que hace que y=0 sea el piso. Sin él habría que
      // estimar la altura del dispositivo, que es la fuente de error que
      // complica el modo nativo.
      requiredFeatures: ['local-floor'],
    });

    renderer.xr.setReferenceSpaceType('local-floor');
    await renderer.xr.setSession(session as unknown as XRSession);
    onSessionChange?.(true);
    session.addEventListener('end', () => onSessionChange?.(false));
  }, [onSessionChange]);

  useEffect(() => {
    if (support === 'supported') onReady?.(startSession);
  }, [support, startSession, onReady]);

  return (
    <Canvas
      // Transparente para que se vea el paso de cámara por detrás: el de WebXR
      // en modo inmersivo, y el <video> del fallback en el modo sin XR.
      gl={{ alpha: true, antialias: true }}
      camera={{ fov: 75, near: 0.05, far: 200, position: [0, EYE_HEIGHT, 0] }}
      style={{ position: 'absolute', inset: 0, background: 'transparent' }}
      onCreated={({ gl, scene }) => {
        rendererRef.current = gl;
        scene.background = null;
        gl.setClearColor(0x000000, 0);
        // Habilitado siempre: si nunca se abre una sesión, no cambia nada, y
        // activarlo después de crear el contexto no siempre surte efecto.
        gl.xr.enabled = true;
      }}
    >
      {support !== 'supported' && <DeviceOrientationCamera eyeHeight={EYE_HEIGHT} />}
      <WalkCloud geometry={cloud.geometry} groundOffsetY={groundOffsetY} anchor={anchor} />
    </Canvas>
  );
}
