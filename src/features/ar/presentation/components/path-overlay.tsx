// src/features/ar/presentation/components/path-overlay.tsx
import React from 'react';
import Svg, { Line } from 'react-native-svg';
import { RoutePoint } from '@/features/ar/domain/entities/route';
import { CELL_SIZE } from './grid-matrix';

const CENTER = CELL_SIZE / 2;

interface Props {
  route: RoutePoint[];
  size: number;
}

function toXY(p: RoutePoint) {
  return { x: p.col * CELL_SIZE + CENTER, y: p.row * CELL_SIZE + CENTER };
}

export function PathOverlay({ route, size }: Props) {
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
            stroke="#3B82F6"
            strokeWidth={2.5}
            opacity={0.6}
          />
        );
      })}
    </Svg>
  );
}
