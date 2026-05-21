import { PlyCloud } from '@/features/viewer/domain/entities/ply-cloud';
import { FpsCounter } from '@/features/viewer/presentation/components/fps-counter';
import { HUD } from '@/features/viewer/presentation/components/hud';
import { PointCloud3D } from '@/features/viewer/presentation/components/point-cloud-3d';
import { Canvas } from '@react-three/fiber/native';
import useControls from 'r3f-native-orbitcontrols';
import React, { useState } from 'react';
import { View } from 'react-native';

interface Props {
  cloud: PlyCloud;
}

export function PointCloudCanvas({ cloud }: Props) {
  const [OrbitControls, events] = useControls();
  const [fps, setFps] = useState(0);

  return (
    <View className="flex-1" {...events}>
      <Canvas>
        <OrbitControls />
        <ambientLight intensity={1} />
        <PointCloud3D geometry={cloud.geometry} />
        <FpsCounter onFps={setFps} />
      </Canvas>
      <HUD cloud={cloud} fps={fps} />
    </View>
  );
}
