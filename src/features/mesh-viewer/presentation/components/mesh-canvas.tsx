import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import * as THREE from 'three';
import { Text } from '@/core/components/ui/text';
import { MeshModel } from '@/features/mesh-viewer/domain/entities/mesh-model';

interface CameraControllerProps {
  eulerRef: React.MutableRefObject<THREE.Euler>;
}

function CameraController({ eulerRef }: CameraControllerProps) {
  const { camera } = useThree();

  useEffect(() => {
    camera.rotation.order = 'YXZ';
  }, [camera]);

  useFrame(() => {
    camera.rotation.copy(eulerRef.current);
  });

  return null;
}

function FallbackOverlay() {
  return (
    <View style={styles.fallback}>
      <Text className="text-white text-sm text-center">
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
      <Canvas camera={{ fov: 75, position: [0, 1.6, 0], near: 0.01, far: 1000 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />
        <primitive object={mesh.scene} />
        <CameraController eulerRef={eulerRef} />
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
