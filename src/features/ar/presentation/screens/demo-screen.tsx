// src/features/ar/presentation/screens/demo-screen.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { RelativePathString, useRouter } from 'expo-router';
import { Button } from '@/core/components/ui/button';
import { Text } from '@/core/components/ui/text';
import { GridMatrix, CELL_SIZE } from '@/features/ar/presentation/components/grid-matrix';
import { PathOverlay } from '@/features/ar/presentation/components/path-overlay';
import { useARRoute } from '@/features/ar/presentation/context/ar-route-context';

const GRID_PX = 8 * CELL_SIZE;

export function DemoScreen() {
  const { route, savedRoute, saving, error, addPoint, resetRoute, saveRoute } = useARRoute();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="h3" className="text-foreground">Trazar Ruta AR</Text>
        <Text className="text-muted-foreground text-sm">
          Arrastra el dedo sobre la cuadrícula para dibujar la ruta
        </Text>
      </View>

      {/* Grid */}
      <View style={styles.gridWrapper}>
        <View style={{ width: GRID_PX, height: GRID_PX }}>
          <GridMatrix route={route} onPointSelect={addPoint} />
          <PathOverlay route={route} size={GRID_PX} />
        </View>
      </View>

      {/* Point counter */}
      <Text className="text-muted-foreground text-sm text-center">
        {route.length === 0
          ? 'Sin puntos seleccionados'
          : `${route.length} punto${route.length !== 1 ? 's' : ''} en la ruta`}
      </Text>

      {/* Error */}
      {!!error && (
        <View className="mx-5 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
          <Text className="text-sm text-destructive">{error}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Button onPress={saveRoute} disabled={saving || route.length === 0}>
          <Text>{saving ? 'Guardando…' : 'Guardar Ruta'}</Text>
        </Button>

        <Button variant="secondary" onPress={resetRoute} disabled={route.length === 0}>
          <Text>Reiniciar Ruta</Text>
        </Button>

        <Button
          variant="outline"
          onPress={() => router.push('/ar-route' as RelativePathString)}
          disabled={!savedRoute || savedRoute.length === 0}
        >
          <Text>Mostrar Ruta en AR</Text>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', paddingTop: 48 },
  header: { paddingHorizontal: 20, paddingBottom: 20, gap: 4 },
  gridWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actions: { padding: 20, paddingBottom: 32, gap: 12 },
});
