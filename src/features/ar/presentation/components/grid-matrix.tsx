// src/features/ar/presentation/components/grid-matrix.tsx
import React, { useCallback, useRef } from 'react';
import { PanResponder, View } from 'react-native';
import { RoutePoint } from '@/features/ar/domain/entities/route';

const GRID_SIZE = 8;
export const CELL_SIZE = 36;  // exported so PathOverlay uses the same constant
const DOT_SIZE = 14;
const DOT_OFFSET = (CELL_SIZE - DOT_SIZE) / 2;

interface Props {
  route: RoutePoint[];
  onPointSelect: (point: RoutePoint) => void;
}

export function GridMatrix({ route, onPointSelect }: Props) {
  const containerRef = useRef<View>(null);
  // Stores the absolute on-screen position of the grid after layout
  const layoutRef = useRef<{ x: number; y: number } | null>(null);

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
    const col = Math.floor((pageX - layoutRef.current.x) / CELL_SIZE);
    const row = Math.floor((pageY - layoutRef.current.y) / CELL_SIZE);
    if (col >= 0 && col < GRID_SIZE && row >= 0 && row < GRID_SIZE) {
      return { row, col };
    }
    return null;
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const cell = getCell(e.nativeEvent.pageX, e.nativeEvent.pageY);
        if (cell) onPointSelect(cell);
      },
      onPanResponderMove: (e) => {
        const cell = getCell(e.nativeEvent.pageX, e.nativeEvent.pageY);
        if (cell) onPointSelect(cell);
      },
    }),
  ).current;

  const totalSize = GRID_SIZE * CELL_SIZE;

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
              style={{
                position: 'absolute',
                top: row * CELL_SIZE + DOT_OFFSET,
                left: col * CELL_SIZE + DOT_OFFSET,
                width: DOT_SIZE,
                height: DOT_SIZE,
                borderRadius: DOT_SIZE / 2,
                backgroundColor: last ? '#1D4ED8' : selected ? '#3B82F6' : '#D1D5DB',
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
