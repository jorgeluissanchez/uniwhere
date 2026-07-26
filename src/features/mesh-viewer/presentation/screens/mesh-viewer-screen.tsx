import React from 'react';
import { View } from 'react-native';
import { Button } from '@/core/components/ui/button';
import { Spinner } from '@/core/components/ui/spinner';
import { Text } from '@/core/components/ui/text';
import { MeshCanvas } from '@/features/mesh-viewer/presentation/components/mesh-canvas';
import { useMeshViewer } from '@/features/mesh-viewer/presentation/context/mesh-viewer-context';
import { useMeshGyroscope } from '@/features/mesh-viewer/presentation/hooks/use-mesh-gyroscope';

export function MeshViewerScreen() {
  const { mesh, loading, error, loadMesh } = useMeshViewer();
  const { eulerRef, available } = useMeshGyroscope();

  if (mesh) {
    return (
      <View className="flex-1 bg-canvas">
        <MeshCanvas mesh={mesh} eulerRef={eulerRef} available={available} />
        <View className="absolute top-12 right-4">
          <Button
            variant="secondary"
            onPress={loadMesh}
            className="rounded-full px-4 h-[36px]"
          >
            <Text className="text-sm">Cargar otro</Text>
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center gap-3 p-6">
      {loading ? (
        <>
          <Spinner size="large" className="text-primary" />
          <Text className="text-muted-foreground mt-3">Cargando modelo…</Text>
          <Text className="text-muted-foreground text-xs text-center max-w-[260px]">
            Los archivos grandes pueden tardar varios segundos
          </Text>
        </>
      ) : (
        <>
          {!!error && (
            <View className="mb-4 mx-6 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
              <Text className="text-sm text-destructive text-center">{error}</Text>
            </View>
          )}
          <Button onPress={loadMesh}>
            <Text>{error ? 'Reintentar' : 'Cargar Modelo'}</Text>
          </Button>
          <Text className="text-muted-foreground text-xs mt-3">
            Formatos: OBJ · GLB · GLTF
          </Text>
        </>
      )}
    </View>
  );
}
