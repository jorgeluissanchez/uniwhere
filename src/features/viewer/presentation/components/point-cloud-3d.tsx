import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber/native';

interface Props {
  geometry: THREE.BufferGeometry;
}

export function PointCloud3D({ geometry }: Props) {
  const { camera } = useThree();
  const pointsRef = useRef<THREE.Points>(null);

  useEffect(() => {
    if (!pointsRef.current) return;

    geometry.center();
    geometry.computeBoundingSphere();

    const sphere = geometry.boundingSphere!;
    const distance = sphere.radius * 2.5;

    camera.position.set(0, 0, distance);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.near = distance * 0.001;
      camera.far = distance * 100;
      camera.updateProjectionMatrix();
    }
  }, [geometry, camera]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.005}
        vertexColors={geometry.hasAttribute('color')}
        sizeAttenuation
        color={geometry.hasAttribute('color') ? undefined : '#cccccc'}
      />
    </points>
  );
}
