import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button } from '@/core/components/ui/button';
import { Text } from '@/core/components/ui/text';
import { MeshCanvas } from '@/features/mesh-viewer/presentation/components/mesh-canvas';
import { useMeshViewer } from '@/features/mesh-viewer/presentation/context/mesh-viewer-context';
import { useMeshGyroscope } from '@/features/mesh-viewer/presentation/hooks/use-mesh-gyroscope';

export function MeshViewerScreen() {
  const { mesh, loading, error, loadMesh } = useMeshViewer();
  const { eulerRef, available } = useMeshGyroscope();

  if (mesh) {
    return (
      <View style={styles.container}>
        <MeshCanvas mesh={mesh} eulerRef={eulerRef} available={available} />
        <View style={styles.reloadButton}>
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
    <View style={styles.center}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color="#3B82F6" />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  reloadButton: {
    position: 'absolute',
    top: 48,
    right: 16,
  },
});
