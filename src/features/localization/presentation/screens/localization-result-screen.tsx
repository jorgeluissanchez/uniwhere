import { Button } from '@/core/components/ui/button';
import { Text } from '@/core/components/ui/text';
import { useLocalization } from '@/features/localization/presentation/context/localization-context';
import { PointCloudCanvas } from '@/features/viewer/presentation/components/point-cloud-canvas';
import { useViewer } from '@/features/viewer/presentation/context/viewer-context';
import { RelativePathString, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ActivityIndicator, View } from 'react-native';

export function LocalizationResultScreen() {
  const router = useRouter();
  const { cloud, loading } = useViewer();
  const { result, reset } = useLocalization();

  const markerPoint = useMemo(() => {
    if (!result || !cloud) return undefined;
    return new THREE.Vector3(result.x, result.y, result.z).sub(cloud.centeringOffset);
  }, [result, cloud]);

  const handleBack = () => {
    reset();
    router.push('/(app)/(tabs)/scan' as RelativePathString);
  };

  if (loading || !cloud) {
    return (
      <View className="flex-1 bg-[#0f0f1a] items-center justify-center gap-4">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-400">Cargando modelo…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0f0f1a]">
      <PointCloudCanvas cloud={cloud} markerPoint={markerPoint} />

      {/* Back button */}
      <View className="absolute top-12 right-5">
        <Button
          variant="secondary"
          onPress={handleBack}
          className="rounded-full w-[44px] h-[44px] items-center justify-center p-0"
        >
          <ChevronLeft size={20} color="#374151" />
        </Button>
      </View>

      {/* Coordinate HUD */}
      {result && (
        <View className="absolute bottom-8 left-5 right-5 gap-2">
          {!result.success && (
            <View className="bg-yellow-500/80 rounded-2xl px-4 py-2">
              <Text className="text-white text-xs text-center">
                Pose poco confiable ({result.inlier_count} inliers). Intenta con otra foto.
              </Text>
            </View>
          )}
          <View className="bg-black/60 rounded-2xl px-4 py-3">
            <Text className="text-white text-xs text-center font-mono">
              {`X: ${result.x.toFixed(3)}  Y: ${result.y.toFixed(3)}  Z: ${result.z.toFixed(3)}`}
            </Text>
            <Text className="text-gray-400 text-xs text-center mt-1">
              {`${result.inlier_count} inliers · ${result.success ? 'confiable' : 'baja confianza'}`}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
