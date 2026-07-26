// src/features/ar/presentation/components/path-overlay.tsx
import React from 'react';
import Svg, { Line } from 'react-native-svg';
import { RoutePoint } from '@/features/ar/domain/entities/route';
import { useAppTheme } from '@/core/hooks/use-app-theme';
import { CELL_SIZE } from './grid-matrix';

interface Props {
  route: RoutePoint[];
  size: number;
  /** Debe coincidir con el que recibe GridMatrix. */
  cellSize?: number;
}

export function PathOverlay({ route, size, cellSize = CELL_SIZE }: Props) {
  const center = cellSize / 2;
  const toXY = (p: RoutePoint) => ({
    x: p.col * cellSize + center,
    y: p.row * cellSize + center,
  });

  // `stroke` es una prop de react-native-svg, no un estilo: no acepta clases de
  // Tailwind, así que este es uno de los pocos sitios donde hay que pedirle el
  // color al provider en vez de usar `text-primary`.
  const { tokens } = useAppTheme();

  return (
    // pointerEvents="none" so the SVG does not intercept PanResponder gestures on GridMatrix
    <Svg
      width={size}
      height={size}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      {route.slice(1).map((point, i) => {
        const from = toXY(route[i]);
        const to = toXY(point);
        return (
          <Line
            key={`line-${i}`}
            x1={from.x} y1={from.y}
            x2={to.x} y2={to.y}
            stroke={`hsl(${tokens.primary})`}
            strokeWidth={2.5}
            opacity={0.6}
          />
        );
      })}
    </Svg>
  );
}
