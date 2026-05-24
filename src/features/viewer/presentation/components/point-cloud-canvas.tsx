import { PlyCloud } from '@/features/viewer/domain/entities/ply-cloud';
import { FpsCounter } from '@/features/viewer/presentation/components/fps-counter';
import { HUD } from '@/features/viewer/presentation/components/hud';
import { PointCloud3D } from '@/features/viewer/presentation/components/point-cloud-3d';
import { LocatedMarker } from '@/features/localization/presentation/components/located-marker';
import { Canvas } from '@react-three/fiber/native';
import useControls from 'r3f-native-orbitcontrols';
import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { View } from 'react-native';

interface Props {
  cloud: PlyCloud;
  markerPoint?: THREE.Vector3;
}

export function PointCloudCanvas({ cloud, markerPoint }: Props) {
  const [OrbitControls, events] = useControls();
  const [fps, setFps] = useState(0);

  const markerRadius = useMemo(() => {
    if (!markerPoint) return 0.05;
    const size = new THREE.Vector3();
    cloud.boundingBox.getSize(size);
    return Math.max(size.x, size.y, size.z) * 0.06;  // 5× the base 0.012
  }, [cloud.boundingBox, markerPoint]);

  return (
    <View className="flex-1" {...events}>
      <Canvas>
        <OrbitControls />
        <ambientLight intensity={1} />
        <PointCloud3D geometry={cloud.geometry} focusPoint={markerPoint} />
        {markerPoint && (
          <LocatedMarker position={markerPoint} radius={markerRadius} />
        )}
        <FpsCounter onFps={setFps} />
      </Canvas>
      <HUD cloud={cloud} fps={fps} />
    </View>
  );
}
