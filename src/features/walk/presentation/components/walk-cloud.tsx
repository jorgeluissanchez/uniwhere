/**
 * La nube de puntos del PLY colocada en el mundo AR. Compartida por el modo
 * nativo (Viro) y el web (WebXR): las dos plataformas difieren en cómo se
 * obtiene la pose de la cámara, pero el modelo se planta igual.
 *
 * La geometría viene centrada en el origen (`PlyRepositoryImpl.parse()` llama a
 * `geometry.center()`), así que hay que bajarla para que su suelo caiga en el
 * piso real. Cuánto exactamente depende de dónde nace el origen del mundo AR,
 * y eso sí cambia por plataforma — de ahí que `groundOffsetY` llegue de fuera.
 */
import React from 'react';
import * as THREE from 'three';

/**
 * Tamaño del punto en metros. A escala real (0.005 m = 5 mm) la nube es
 * literalmente invisible a más de un par de metros: cada punto cae por debajo
 * del pixel. 2 cm es lo mínimo que se lee como superficie caminando.
 */
export const POINT_SIZE = 0.02;

export type CloudAnchor = {
  x: number;
  z: number;
  /** Rotación del PLY alrededor de Y, en radianes. */
  yaw: number;
};

type Props = {
  geometry: THREE.BufferGeometry;
  /** Desplazamiento vertical que lleva el suelo del PLY al piso real. */
  groundOffsetY: number;
  anchor: CloudAnchor;
};

export function WalkCloud({ geometry, groundOffsetY, anchor }: Props) {
  return (
    <group position={[anchor.x, groundOffsetY, anchor.z]} rotation={[0, anchor.yaw, 0]}>
      <points geometry={geometry}>
        <pointsMaterial
          size={POINT_SIZE}
          sizeAttenuation
          vertexColors={geometry.hasAttribute('color')}
          color={geometry.hasAttribute('color') ? undefined : '#cccccc'}
        />
      </points>
    </group>
  );
}
