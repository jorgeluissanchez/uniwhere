// src/features/ar/presentation/components/breadcrumb-model.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Asset } from 'expo-asset';

interface Props {
  position: [number, number, number];
  index: number;
}

export function BreadcrumbModel({ position, index }: Props) {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // expo-asset resolves the bundled GLB to a local URI on device
        const asset = Asset.fromModule(require('../../../../../assets/3d_objects/Baguette.glb'));
        await asset.downloadAsync();
        if (cancelled || !asset.localUri) return;

        const loader = new GLTFLoader();
        loader.load(
          asset.localUri,
          (gltf) => {
            if (!cancelled) {
              setScene(gltf.scene.clone(true));
            }
          },
          undefined,
          (err) => console.error('[BreadcrumbModel] GLB load error:', err),
        );
      } catch (err) {
        console.error('[BreadcrumbModel] Asset error:', err);
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
    <group ref={groupRef} position={position} scale={[0.04, 0.04, 0.04]}>
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
