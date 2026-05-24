import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber/native';

interface Props {
  geometry: THREE.BufferGeometry;
  focusPoint?: THREE.Vector3;
}

export function PointCloud3D({ geometry, focusPoint }: Props) {
  const { camera } = useThree();
  const pointsRef = useRef<THREE.Points>(null);

  useEffect(() => {
    if (!pointsRef.current) return;

    geometry.computeBoundingSphere();
    const sphere = geometry.boundingSphere!;

    if (focusPoint) {
      // Place camera elevated and behind the marker so it's immediately visible
      const dist = sphere.radius * 2.0;
      camera.position.set(
        focusPoint.x,
        focusPoint.y + dist * 0.45,
        focusPoint.z + dist,
      );
      camera.lookAt(focusPoint);
    } else {
      camera.position.set(0, 0, sphere.radius * 2.5);
    }

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.near = sphere.radius * 0.001;
      camera.far = sphere.radius * 100;
      camera.updateProjectionMatrix();
    }
  }, [geometry, camera, focusPoint]);

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
