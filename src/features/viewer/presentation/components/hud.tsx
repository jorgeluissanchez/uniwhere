import { Text } from '@/core/components/ui/text';
import { PlyCloud } from '@/features/viewer/domain/entities/ply-cloud';
import React from 'react';
import { View } from 'react-native';

interface Props {
  cloud: PlyCloud;
  fps: number;
  loading?: boolean;
}

export function HUD({ cloud, fps, loading = false }: Props) {
  return (
    <View className="absolute top-4 right-4 bg-black/60 rounded-lg p-2 min-w-[120px]" pointerEvents="none">
      {loading ? (
        <Text className="text-white text-xs">Procesando…</Text>
      ) : (
        <>
          <Text className="text-white text-xs">Puntos: {cloud.vertexCount.toLocaleString()}</Text>
          {cloud.originalVertexCount !== cloud.vertexCount && (
            <Text className="text-gray-400 text-[10px]">
              (reducido de {cloud.originalVertexCount.toLocaleString()})
            </Text>
          )}
          <Text className="text-white text-xs">FPS: {fps}</Text>
        </>
      )}
    </View>
  );
}
