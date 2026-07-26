import { Button } from '@/core/components/ui/button';
import { Icon } from '@/core/components/ui/icon';
import { Spinner } from '@/core/components/ui/spinner';
import { Text } from '@/core/components/ui/text';
import { useViewer } from '@/features/viewer/presentation/context/viewer-context';
import { PointCloudCanvas } from '@/features/viewer/presentation/components/point-cloud-canvas';
import { RelativePathString, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

export function ViewerScreen() {
  const { cloud, loading, error } = useViewer();
  const router = useRouter();

  if (cloud) {
    return (
      <View className="flex-1 bg-canvas">
        <PointCloudCanvas cloud={cloud} />
        <View className="absolute top-12 left-5">
          <Button
            variant="secondary"
            onPress={() => router.replace('/scan' as RelativePathString)}
            className="rounded-full w-14 h-14 p-0 items-center justify-center"
          >
            <Icon as={ChevronLeft} size={20} />
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-canvas items-center justify-center gap-4 p-6">
      {loading ? (
        <>
          <Spinner size="large" className="text-primary" />
          {/* Sobre el canvas no sirve `text-muted-foreground`: en tema claro es
              gris oscuro y queda ilegible contra el fondo casi negro. */}
          <Text className="text-canvas-foreground/70 mt-2">Procesando archivo PLY…</Text>
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
