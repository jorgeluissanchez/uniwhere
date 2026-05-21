import { Button } from '@/core/components/ui/button';
import { Text } from '@/core/components/ui/text';
import { useViewer } from '@/features/viewer/presentation/context/viewer-context';
import { PointCloudCanvas } from '@/features/viewer/presentation/components/point-cloud-canvas';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

export function ViewerScreen() {
  const { cloud, loading, error, loadFile } = useViewer();

  if (cloud) {
    return (
      <View className="flex-1 bg-[#0f0f1a]">
        <PointCloudCanvas cloud={cloud} />
        <View className="absolute bottom-6 right-6">
          <Button onPress={loadFile} disabled={loading} className="rounded-full px-5">
            <Text>Abrir</Text>
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0f0f1a] items-center justify-center gap-4 p-6">
      {loading ? (
        <>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-400 mt-2">Procesando archivo PLY…</Text>
        </>
      ) : (
        <>
          {!!error && (
            <Text className="text-destructive text-center text-sm max-w-[300px]">{error}</Text>
          )}
          <Button onPress={loadFile} disabled={loading} className="px-9">
            <Text>Abrir archivo PLY</Text>
          </Button>
        </>
      )}
    </View>
  );
}
