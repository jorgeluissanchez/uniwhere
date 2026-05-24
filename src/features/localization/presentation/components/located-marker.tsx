import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber/native';

interface Props {
  position: THREE.Vector3;
  radius?: number;
}

export function LocatedMarker({ position, radius = 0.05 }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const scaleRef = useRef(1);
  const dirRef = useRef(1);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    scaleRef.current += dirRef.current * delta * 1.2;
    if (scaleRef.current > 1.5) dirRef.current = -1;
    if (scaleRef.current < 0.8) dirRef.current = 1;
    const s = scaleRef.current;
    meshRef.current.scale.set(s, s, s);
  });

  return (
    <mesh ref={meshRef} position={[position.x, position.y, position.z]}>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
    </mesh>
  );
}
