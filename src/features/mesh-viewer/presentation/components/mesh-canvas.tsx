import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import * as THREE from 'three';
import { Text } from '@/core/components/ui/text';
import { MeshModel } from '@/features/mesh-viewer/domain/entities/mesh-model';

interface CameraControllerProps {
  eulerRef: React.MutableRefObject<THREE.Euler>;
  boundingBox: THREE.Box3;
}

function CameraController({ eulerRef, boundingBox }: CameraControllerProps) {
  const { camera } = useThree();

  useEffect(() => {
    camera.rotation.order = 'YXZ';

    const sphere = new THREE.Sphere();
    boundingBox.getBoundingSphere(sphere);
    const r = Math.max(sphere.radius, 0.1);

    camera.position.set(0, 0, r * 2.5);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.near = r * 0.001;
      camera.far = r * 100;
      camera.updateProjectionMatrix();
    }
  }, [camera, boundingBox]);

  useFrame(() => {
    camera.rotation.copy(eulerRef.current);
  });

  return null;
}

function FallbackOverlay() {
  return (
    <View style={styles.fallback}>
      <Text className="text-canvas-foreground text-sm text-center">
        Giroscopio no disponible.{'\n'}La cámara permanece estática.
      </Text>
    </View>
  );
}

interface MeshCanvasProps {
  mesh: MeshModel;
  eulerRef: React.MutableRefObject<THREE.Euler>;
  available: boolean;
}

export function MeshCanvas({ mesh, eulerRef, available }: MeshCanvasProps) {
  return (
    <View style={styles.container}>
      <Canvas
        frameloop={available ? 'always' : 'demand'}
        camera={{ fov: 75 }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />
        <primitive object={mesh.scene} />
        <CameraController eulerRef={eulerRef} boundingBox={mesh.boundingBox} />
      </Canvas>
      {!available && <FallbackOverlay />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 48,
  },
});
