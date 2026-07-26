/**
 * Dónde se planta el PLY dentro del mundo AR.
 *
 * El origen del mundo AR es la pose del teléfono al arrancar la sesión, que
 * es arbitraria: depende de dónde estaba parado el usuario al abrir la
 * pantalla. Por defecto anclamos el PLY ahí (0,0 / yaw 0), y le damos al
 * usuario un botón "Recentrar aquí" que vuelve a plantar el modelo en su
 * posición y orientación actuales.
 *
 * Sólo guardamos XZ y yaw: la altura la resuelve `WalkCanvas` bajando la nube
 * hasta el piso, y inclinar el modelo en X/Z lo dejaría flotando torcido.
 */
import { useCallback, useState } from "react";

import { WalkPoseRef } from "./use-walk-pose";

export type WalkAnchor = {
  x: number;
  z: number;
  /** Rotación del PLY alrededor de Y, en radianes. */
  yaw: number;
};

const ORIGIN: WalkAnchor = { x: 0, z: 0, yaw: 0 };

export function useWalkAnchoring() {
  const [anchor, setAnchor] = useState<WalkAnchor>(ORIGIN);

  /** Replanta el PLY en la posición y orientación actuales del usuario. */
  const recenter = useCallback((poseRef: WalkPoseRef) => {
    if (!poseRef.ready) return;
    setAnchor({
      x: poseRef.position.x,
      z: poseRef.position.z,
      yaw: poseRef.yaw,
    });
  }, []);

  const reset = useCallback(() => setAnchor(ORIGIN), []);

  return { anchor, recenter, reset };
}
