// src/features/ar/presentation/screens/demo-screen.tsx
import React from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { RelativePathString, useRouter } from 'expo-router';
import { Button } from '@/core/components/ui/button';
import { Text } from '@/core/components/ui/text';
import { GridMatrix, CELL_SIZE, GRID_SIZE } from '@/features/ar/presentation/components/grid-matrix';
import { PathOverlay } from '@/features/ar/presentation/components/path-overlay';
import { useARRoute } from '@/features/ar/presentation/context/ar-route-context';

const SCREEN_PADDING = 20;
/** Por debajo de esto la celda queda más chica que un objetivo táctil cómodo. */
const MIN_CELL = 28;

export function DemoScreen() {
  const { route, savedRoute, saving, error, addPoint, resetRoute, saveRoute } = useARRoute();
  const router = useRouter();

  // La cuadrícula se adapta al ancho disponible en vez de imponer 8 × 36px, que
  // se desbordaba sobre el encabezado y los botones en pantallas angostas.
  const { width } = useWindowDimensions();
  const available = width - SCREEN_PADDING * 2;
  const cellSize = Math.max(MIN_CELL, Math.min(CELL_SIZE, Math.floor(available / GRID_SIZE)));
  const gridPx = cellSize * GRID_SIZE;

  return (
    <View className="flex-1 bg-background pt-12">
      {/* Con la cuadrícula al mínimo el contenido puede no caber a lo alto: el
          scroll evita que se recorten los botones. */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
      >
        <View className="px-5 pb-5 gap-1">
          <Text variant="h3" className="text-foreground">Trazar Ruta AR</Text>
          <Text className="text-muted-foreground text-sm">
            Arrastra el dedo sobre la cuadrícula para dibujar la ruta
          </Text>
        </View>

        {/* Grid */}
        <View className="flex-1 items-center justify-center py-4">
          <View style={{ width: gridPx, height: gridPx }}>
            <GridMatrix route={route} onPointSelect={addPoint} cellSize={cellSize} />
            <PathOverlay route={route} size={gridPx} cellSize={cellSize} />
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
          <View className="mx-5 mt-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <Text className="text-sm text-destructive">{error}</Text>
          </View>
        )}

        {/* Actions */}
        <View className="p-5 gap-3 w-full max-w-lg mx-auto">
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
      </ScrollView>
    </View>
  );
}
