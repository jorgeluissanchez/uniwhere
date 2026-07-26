/**
 * Canvas Three.js con la nube de puntos del PLY, con la cámara Three.js
 * atada 1:1 a la pose AR (vía `useWalkPose`).
 *
 * Movimiento: no hay joystick ni velocidad. La pose que publica ARCore /
 * ARKit ya *es* el movimiento físico del usuario en metros reales, así que
 * copiarla directo a la cámara hace que caminar en la habitación equivalga a
 * caminar dentro del PLY. Cualquier desplazamiento sintético sumado encima
 * rompería esa correspondencia.
 *
 * Colocación del PLY: la geometría viene centrada en el origen
 * (`PlyRepositoryImpl.parse()` llama a `geometry.center()`), mientras que el
 * origen del mundo AR está a la altura del teléfono al arrancar la sesión, no
 * en el piso. Sin corregirlo el usuario aparece parado en el centro
 * geométrico del modelo, con la mitad de la nube bajo sus pies. El `<group>`
 * baja la nube para que su suelo (`boundingBox.min.y`) caiga en el piso real,
 * a `-eyeHeight` del origen AR, y la desplaza/rota según el anchor elegido.
 */
import { useFrame, useThree } from "@react-three/fiber/native";
import React, { useMemo } from "react";

import { PlyCloud } from "@/features/viewer/domain/entities/ply-cloud";

import { WalkAnchor } from "../hooks/use-walk-anchoring";
import { WalkPoseRef } from "../hooks/use-walk-pose";
import { WalkCloud } from "./walk-cloud";

type Props = {
  cloud: PlyCloud;
  poseRef: WalkPoseRef;
  /** Altura estimada del teléfono sobre el piso al iniciar la sesión AR. */
  eyeHeight: number;
  /** Dónde plantar el PLY dentro del mundo AR. */
  anchor: WalkAnchor;
};

export function WalkCanvas({ cloud, poseRef, eyeHeight, anchor }: Props) {
  const { camera } = useThree();

  // Cuánto hay que bajar la nube para que su suelo coincida con el piso real.
  const groundOffsetY = useMemo(
    () => -cloud.boundingBox.min.y - eyeHeight,
    [cloud.boundingBox, eyeHeight],
  );

  useFrame(() => {
    // Sin pose de Viro, no movemos la cámara (todavía no hay AR).
    if (!poseRef.ready) return;
    camera.position.copy(poseRef.position);
    camera.quaternion.copy(poseRef.quaternion);
  });

  return (
    <WalkCloud geometry={cloud.geometry} groundOffsetY={groundOffsetY} anchor={anchor} />
  );
}
