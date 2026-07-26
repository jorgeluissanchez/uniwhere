/**
 * Hook que extrae la pose de la cámara AR y la guarda en un ref accesible
 * desde el bridge de r3f (`useFrame`).
 *
 * Por qué un ref y no state: la pose cambia a 30 Hz y un `setState` por
 * frame ahogaría React. El `useFrame` lee el ref sincrónicamente.
 */
import { useDI } from "@/core/di/di-provider";
import { TOKENS } from "@/core/constants/tokens";
import { useEffect, useRef } from "react";
import * as THREE from "three";

import { ArCameraPose } from "../../data/datasources/ar-camera-data-source";

export type WalkPoseRef = {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  yaw: number;
  timestamp: number;
  /** True cuando Viro ha publicado al menos un frame. */
  ready: boolean;
};

/**
 * Inicializa el ref con valores neutros. La pose de Viro sobreescribirá
 * estos en cuanto llegue el primer frame.
 */
function createInitialPose(): WalkPoseRef {
  return {
    position: new THREE.Vector3(0, 1.6, 0),
    quaternion: new THREE.Quaternion(),
    yaw: 0,
    timestamp: 0,
    ready: false,
  };
}

export function useWalkPose(): WalkPoseRef {
  const di = useDI();
  const repo = di.resolve<{ getArCamera(): { onPoseUpdate(cb: (p: ArCameraPose) => void): () => void } }>(TOKENS.WalkRepo);
  const poseRef = useRef<WalkPoseRef>(createInitialPose());

  useEffect(() => {
    const cam = repo.getArCamera();
    const unsub = cam.onPoseUpdate((pose) => {
      poseRef.current.position.set(pose.position[0], pose.position[1], pose.position[2]);
      poseRef.current.quaternion.set(
        pose.rotation[0],
        pose.rotation[1],
        pose.rotation[2],
        pose.rotation[3],
      );
      poseRef.current.yaw = pose.yaw;
      poseRef.current.timestamp = pose.timestamp;
      poseRef.current.ready = true;
    });
    return unsub;
  }, [repo]);

  return poseRef.current;
}
