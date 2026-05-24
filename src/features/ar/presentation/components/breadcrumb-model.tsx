// src/features/ar/presentation/components/breadcrumb-model.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import Constants from 'expo-constants';

interface Props {
  position: [number, number, number];
  index: number;
}

// Build the GLB URL.
// expo-asset.downloadAsync() generates ?unstable_path= URLs that Metro 0.83 returns 404 on.
// Metro DOES serve assets at /assets/<relativePath> — use that directly.
function getGLBUrl(): string {
  if (Platform.OS === 'web') {
    return '/assets/3d_objects/Baguette.glb';
  }
  // Constants.expoConfig.hostUri = "10.10.x.x:PORT" (the Metro dev server)
  const host = (Constants.expoConfig as any)?.hostUri ?? '10.0.2.2:8083';
  return `http://${host}/assets/assets/3d_objects/Baguette.glb`;
}

export function BreadcrumbModel({ position, index }: Props) {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const url = getGLBUrl();
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching GLB`);
        const buffer = await res.arrayBuffer();
        if (cancelled) return;

        const loader = new GLTFLoader();
        loader.parse(
          buffer,
          '',
          (gltf) => {
            if (!cancelled) setScene(gltf.scene.clone(true));
          },
          (err) => console.error('[BreadcrumbModel] GLB parse error:', err),
        );
      } catch (err) {
        console.error('[BreadcrumbModel] Load error:', err);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Bob animation: each breadcrumb is offset by its index so they wave independently
  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.y =
      position[1] + Math.sin(Date.now() * 0.0018 + index * 0.7) * 0.025;
  });

  return (
    <group ref={groupRef} position={position} scale={[0.24, 0.24, 0.24]}>
      {scene ? (
        <primitive object={scene} />
      ) : (
        // Placeholder while GLB loads
        <mesh>
          <sphereGeometry args={[1.2, 12, 12]} />
          <meshStandardMaterial color="#3B82F6" opacity={0.75} transparent />
        </mesh>
      )}
    </group>
  );
}
