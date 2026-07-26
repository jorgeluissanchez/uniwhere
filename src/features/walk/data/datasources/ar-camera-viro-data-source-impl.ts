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
 */
import * as THREE from 'three';

import {
  ArCameraDataSource,
  ArCameraPose,
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
   * Llamado por `walk-ar-scene.tsx` desde `onCameraTransformUpdate`. El
   * `forward` de Viro viene en world-space; de ahí derivamos el yaw para
   * que el joystick no dependa de la cinematic order del cuaternión.
   */
  publishFromViro(viro: {
    position: readonly [number, number, number];
    rotation: readonly [number, number, number, number];
  }): void {
    const yaw = this.extractYawFromQuaternion(viro.rotation);
    const pose: ArCameraPose = {
      position: viro.position,
      rotation: viro.rotation,
      yaw,
      timestamp: Date.now(),
    };
    this.latest = pose;
    this.tracking = 'ready';
    this.listeners.forEach((cb) => cb(pose));
  }

  markUnavailable(): void {
    this.tracking = 'unavailable';
  }

  /**
   * El yaw que queremos es la dirección "hacia donde apunta el teléfono" en
   * el plano horizontal (XZ). Con cuaternión (x, y, z, w) y la convención
   * Three.js (Y-up, -Z forward), basta con proyectar el vector forward al
   * plano XZ y sacar atan2.
   */
  private extractYawFromQuaternion(q: readonly [number, number, number, number]): number {
    const [x, y, z, w] = q;
    // forward esperado en Three.js: (-2(xz + wy), ..., -2(yz - wx))
    // para el yaw proyectado a XZ basta con atan2 de la XZ:
    const siny_cosp = 2 * (w * y + x * z);
    const cosy_cosp = 1 - 2 * (y * y + z * z);
    return Math.atan2(siny_cosp, cosy_cosp);
  }

  /**
   * Reconvierte la pose de Viro a un `THREE.Vector3` / `THREE.Quaternion`.
   * Útil en el bridge para evitar objetos `Vector3` por frame.
   */
  toThree(pose: ArCameraPose): { position: THREE.Vector3; quaternion: THREE.Quaternion } {
    return {
      position: new THREE.Vector3(pose.position[0], pose.position[1], pose.position[2]),
      quaternion: new THREE.Quaternion(pose.rotation[0], pose.rotation[1], pose.rotation[2], pose.rotation[3]),
    };
  }
}
