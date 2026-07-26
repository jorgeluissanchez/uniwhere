// src/features/ar/presentation/components/grid-matrix.tsx
import React, { useCallback, useRef } from 'react';
import { PanResponder, View } from 'react-native';
import { RoutePoint } from '@/features/ar/domain/entities/route';

export const GRID_SIZE = 8;
export const CELL_SIZE = 36;  // tamaño por defecto; la pantalla puede reducirlo
const DOT_RATIO = 14 / CELL_SIZE;

interface Props {
  route: RoutePoint[];
  onPointSelect: (point: RoutePoint) => void;
  /** Lado de cada celda. La pantalla lo calcula según el ancho disponible. */
  cellSize?: number;
}

export function GridMatrix({ route, onPointSelect, cellSize = CELL_SIZE }: Props) {
  const containerRef = useRef<View>(null);
  // Stores the absolute on-screen position of the grid after layout
  const layoutRef = useRef<{ x: number; y: number } | null>(null);

  // El PanResponder se crea una sola vez, así que no puede capturar `cellSize`
  // por closure: lo lee de aquí para no quedarse con el valor del primer render.
  const cellSizeRef = useRef(cellSize);
  cellSizeRef.current = cellSize;

  const dotSize = Math.round(cellSize * DOT_RATIO);
  const dotOffset = (cellSize - dotSize) / 2;

  const isInRoute = useCallback(
    (row: number, col: number) => route.some(p => p.row === row && p.col === col),
    [route],
  );

  const isLast = useCallback(
    (row: number, col: number) => {
      const last = route[route.length - 1];
      return !!last && last.row === row && last.col === col;
    },
    [route],
  );

  // Convert absolute page coordinates to a grid cell
  const getCell = useCallback((pageX: number, pageY: number): RoutePoint | null => {
    if (!layoutRef.current) return null;
    const size = cellSizeRef.current;
    const col = Math.floor((pageX - layoutRef.current.x) / size);
    const row = Math.floor((pageY - layoutRef.current.y) / size);
    if (col >= 0 && col < GRID_SIZE && row >= 0 && row < GRID_SIZE) {
      return { row, col };
    }
    return null;
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Se remide al empezar cada gesto: `onLayout` no se dispara al hacer
      // scroll, así que la posición cacheada puede haber quedado obsoleta.
      onPanResponderGrant: (e) => {
        const { pageX, pageY } = e.nativeEvent;
        containerRef.current?.measureInWindow((x, y) => {
          layoutRef.current = { x, y };
          const cell = getCell(pageX, pageY);
          if (cell) onPointSelect(cell);
        });
      },
      onPanResponderMove: (e) => {
        const cell = getCell(e.nativeEvent.pageX, e.nativeEvent.pageY);
        if (cell) onPointSelect(cell);
      },
    }),
  ).current;

  const totalSize = GRID_SIZE * cellSize;

  return (
    <View
      ref={containerRef}
      onLayout={() => {
        // measureInWindow gives absolute screen coordinates, needed for PanResponder
        containerRef.current?.measureInWindow((x, y) => {
          layoutRef.current = { x, y };
        });
      }}
      style={{ width: totalSize, height: totalSize }}
      {...panResponder.panHandlers}
    >
      {Array.from({ length: GRID_SIZE }, (_, row) =>
        Array.from({ length: GRID_SIZE }, (_, col) => {
          const selected = isInRoute(row, col);
          const last = isLast(row, col);
          return (
            <View
              key={`${row}-${col}`}
              className={last ? 'bg-primary' : selected ? 'bg-primary/70' : 'bg-muted-foreground/30'}
              style={{
                position: 'absolute',
                top: row * cellSize + dotOffset,
                left: col * cellSize + dotOffset,
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                // Scale up the last-selected dot for tactile feedback
                transform: [{ scale: last ? 1.3 : 1 }],
              }}
            />
          );
        })
      )}
    </View>
  );
}
