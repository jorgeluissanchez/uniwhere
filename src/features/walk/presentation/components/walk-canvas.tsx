/**
 * Canvas Three.js con la nube de puntos del PLY y la cámara Three.js
 * sincronizada a la pose AR (vía `useWalkPose`).
 *
 * Estrategia:
 *   - Cada frame, copiamos la pose de Viro a la cámara Three.js.
 *   - Sumamos el vector de caminata (joystick) escalado por dt y velocidad.
 *   - El suelo lo fija el suelo del boundingBox del PLY (no la pose Y de Viro).
 *   - Hasta que Viro reporte pose (`poseRef.ready`), la cámara no se mueve.
 *
 * Resultado: la cámara está en coordenadas del PLY (metros reales), pero su
 * orientación vive en el frame AR. El boundingBox del PLY está centrado
 * (ver `PlyRepositoryImpl.parse()`), por lo que la `centeringOffset` se
 * aplica sobre la base del anchor para que el suelo del PLY coincida con
 * el plano detectado.
 */
import { useFrame, useThree } from "@react-three/fiber/native";
import React, { useRef } from "react";
import * as THREE from "three";

import { PointCloud3D } from "@/features/viewer/presentation/components/point-cloud-3d";
import { PlyCloud } from "@/features/viewer/domain/entities/ply-cloud";

import { WalkVectorRef } from "../hooks/use-walk-joystick";
import { WalkPoseRef } from "../hooks/use-walk-pose";
import {
  integrate,
  walkDirection,
} from "../utils/walk-vector";

type Props = {
  cloud: PlyCloud;
  poseRef: WalkPoseRef;
  walkVectorRef: WalkVectorRef;
  /** Velocidad actual (m/s). Compartida con el HUD. */
  speed: number;
  /** Altura del usuario sobre el suelo del PLY. */
  eyeHeight: number;
};

export function WalkCanvas({ cloud, poseRef, walkVectorRef, speed, eyeHeight }: Props) {
  const { camera } = useThree();
  const skyY = useRef(eyeHeight);

  useFrame((_state, dt) => {
    // Sin pose de Viro, no movemos la cámara (todavía no hay AR).
    if (!poseRef.ready) return;

    // 1. Posición y rotación desde Viro.
    camera.position.copy(poseRef.position);
    camera.quaternion.copy(poseRef.quaternion);

    // 2. Vector de caminata en world-space.
    const direction = walkDirection(poseRef.yaw, {
      x: walkVectorRef.x,
      z: walkVectorRef.z,
    });

    if (direction) {
      // El suelo del PLY (en coords centradas): `boundingBox.min.y`.
      // La pose Y de Viro viene en metros absolutos del mundo AR; sumamos
      // el offset del anchor y la altura del ojo.
      const floorY = cloud.boundingBox.min.y + eyeHeight;
      const next = integrate(camera.position, direction, speed, dt, floorY);
      camera.position.x = next.x;
      camera.position.z = next.z;
      camera.position.y = floorY;
      skyY.current = floorY;
    } else {
      camera.position.y = skyY.current;
    }
  });

  return <PointCloud3D geometry={cloud.geometry} />;
}

/**
 * Variante "ghost": no renderiza puntos, sólo la cámara. Útil durante el
 * momento previo al anchor (cuando Viro ya está entregando pose pero el
 * PLY aún no debe aparecer).
 */
export function WalkCameraOnly({ poseRef }: { poseRef: WalkPoseRef }) {
  const { camera } = useThree();
  useFrame(() => {
    if (!poseRef.ready) return;
    camera.position.copy(poseRef.position);
    camera.quaternion.copy(poseRef.quaternion);
  });
  return null;
}
