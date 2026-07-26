import { Button } from '@/core/components/ui/button';
import { Icon } from '@/core/components/ui/icon';
import { Spinner } from '@/core/components/ui/spinner';
import { Text } from '@/core/components/ui/text';
import { useLocalization } from '@/features/localization/presentation/context/localization-context';
import { PointCloudCanvas } from '@/features/viewer/presentation/components/point-cloud-canvas';
import { useViewer } from '@/features/viewer/presentation/context/viewer-context';
import { RelativePathString, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { View } from 'react-native';

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
    router.replace('/scan' as RelativePathString);
  };

  if (loading || !cloud) {
    return (
      <View className="flex-1 bg-[#0f0f1a] items-center justify-center gap-4">
        <Spinner size="large" className="text-primary" />
        <Text className="text-gray-400">Cargando modelo…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0f0f1a]">
      <PointCloudCanvas cloud={cloud} markerPoint={markerPoint} />

      {/* "Usted se encuentra aquí" badge */}
      {markerPoint && (
        <View className="absolute top-12 left-5 right-16 flex-row items-center gap-2 bg-black/70 rounded-2xl px-4 py-2.5">
          <View className="w-3 h-3 rounded-full bg-destructive" />
          <Text className="text-white text-sm font-semibold flex-1">Usted se encuentra aquí</Text>
        </View>
      )}

      {/* Back button */}
      <View className="absolute top-12 right-5">
        <Button
          variant="secondary"
          onPress={handleBack}
          className="rounded-full w-14 h-14 p-0 items-center justify-center"
        >
          <Icon as={ChevronLeft} size={20} />
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
