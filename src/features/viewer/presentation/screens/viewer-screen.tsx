import { Button } from '@/core/components/ui/button';
import { Text } from '@/core/components/ui/text';
import { useViewer } from '@/features/viewer/presentation/context/viewer-context';
import { PointCloudCanvas } from '@/features/viewer/presentation/components/point-cloud-canvas';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

export function ViewerScreen() {
  const { cloud, loading, error } = useViewer();
  const router = useRouter();

  if (cloud) {
    return (
      <View className="flex-1 bg-[#0f0f1a]">
        <PointCloudCanvas cloud={cloud} />
        <View className="absolute top-12 right-5">
          <Button
            variant="secondary"
            onPress={() => router.back()}
            className="rounded-full w-[44px] h-[44px] items-center justify-center p-0"
          >
            <ChevronLeft size={20} color="#374151" />
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
          <Text className="text-muted-foreground mt-2">Procesando archivo PLY…</Text>
        </>
      ) : (
        <>
          {!!error && (
            <Text className="text-destructive text-center text-sm max-w-[300px]">{error}</Text>
          )}
        </>
      )}
    </View>
  );
}
