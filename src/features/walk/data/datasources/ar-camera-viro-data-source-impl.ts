/**
 * Implementación de ArCameraDataSource sobre `@reactvision/react-viro`.
 *
 * Viro expone `onCameraTransformUpdate({ position, rotation, forward, up })`
 * en `<ViroARScene>`. Aquí definimos un componente React que monta esa escena
 * y propaga la pose a los observadores registrados. El componente se monta
 * exactamente una vez, embebido en `walk-ar-scene.tsx`.
 *
 * No instanciamos ViroARScene aquí: ese detalle es de la capa de
 * presentación. Esta clase sólo guarda observadores y publica la pose.
 *
 * IMPORTANTE — el `rotation` de Viro NO es un cuaternión. Es `[x, y, z]`:
 * tres ángulos de Euler en grados (ver `ViroRotation` en
 * `components/Types/ViroUtils.ts`). Leerlo como `[x, y, z, w]` deja `w` en
 * `undefined`, lo que produce un cuaternión NaN, una matriz de cámara NaN y
 * una escena que deja de dibujarse por completo. Por eso la pose viaja como
 * la base {forward, up}, que Viro entrega ya en world-space.
 */
import * as THREE from 'three';

import {
  ArCameraDataSource,
  ArCameraPose,
  Vec3,
} from './ar-camera-data-source';

type Listener = (pose: ArCameraPose) => void;

export class ArCameraViroDataSourceImpl implements ArCameraDataSource {
  private listeners = new Set<Listener>();
  private latest: ArCameraPose | null = null;
  private tracking: 'idle' | 'ready' | 'unavailable' = 'idle';

  onPoseUpdate(cb: Listener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  getLatestPose(): ArCameraPose | null {
    return this.latest;
  }

  getTrackingState(): 'idle' | 'ready' | 'unavailable' {
    return this.tracking;
  }

  /**
   * Llamado por `walk-ar-scene.tsx` desde `onCameraTransformUpdate`.
   *
   * `forward` y `up` vienen de Viro ya en world-space, que es justo lo que se
   * necesita para orientar la cámara de Three.js sin depender del orden de los
   * ángulos de Euler.
   */
  publishFromViro(viro: {
    position: Vec3;
    forward: Vec3;
    up: Vec3;
  }): void {
    const pose: ArCameraPose = {
      position: viro.position,
      forward: viro.forward,
      up: viro.up,
      yaw: yawFromForward(viro.forward),
      timestamp: Date.now(),
    };
    this.latest = pose;
    this.tracking = 'ready';
    this.listeners.forEach((cb) => cb(pose));
  }

  markUnavailable(): void {
    this.tracking = 'unavailable';
  }
}

/**
 * Yaw de la cámara proyectando `forward` al plano horizontal.
 *
 * Convención compartida con `walk-vector.ts`: yaw=0 mira hacia -Z, y el yaw
 * positivo gira hacia -X. De ahí `atan2(-x, -z)`.
 *
 * Si el teléfono apunta recto al suelo o al cielo la proyección se degenera y
 * el yaw deja de estar definido; en ese caso se conserva 0 en vez de devolver
 * un valor que salta con el ruido del tracking.
 */
export function yawFromForward(forward: Vec3): number {
  const [x, , z] = forward;
  if (Math.hypot(x, z) < 1e-6) return 0;
  return Math.atan2(-x, -z);
}

/**
 * Construye el cuaternión de la cámara a partir de la base {forward, up}.
 *
 * `Matrix4.lookAt` produce la rotación cuyo -Z apunta de `eye` a `target`, que
 * es exactamente la convención de cámara de Three.js.
 */
export function quaternionFromBasis(
  forward: Vec3,
  up: Vec3,
  target: THREE.Quaternion,
): THREE.Quaternion {
  const eye = new THREE.Vector3(0, 0, 0);
  const at = new THREE.Vector3(forward[0], forward[1], forward[2]);
  const upVec = new THREE.Vector3(up[0], up[1], up[2]);
  // Un forward degenerado (todo ceros antes del primer frame real) produciría
  // una matriz sin inversa y un cuaternión NaN: se deja la orientación previa.
  if (at.lengthSq() < 1e-12 || upVec.lengthSq() < 1e-12) return target;
  const matrix = new THREE.Matrix4().lookAt(eye, at, upVec);
  return target.setFromRotationMatrix(matrix);
}
