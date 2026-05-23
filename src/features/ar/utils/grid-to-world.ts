// src/features/ar/utils/grid-to-world.ts
import { RoutePoint } from '@/features/ar/domain/entities/route';

const SPACING = 0.28;  // world-space distance between adjacent grid points
const DEPTH   = -2.2;  // fixed Z: grid sits at this depth, facing the camera
const ORIGIN  = 3.5;   // center offset for an 8×8 grid ((8-1)/2)

/**
 * Maps a 2D grid cell to a Three.js world position on the X-Y plane so the
 * grid faces the camera directly (perpendicular to the view axis).
 * col → X (left/right), row → Y (top/bottom, negated so row 0 is at top).
 */
export function gridToWorld(point: RoutePoint): [number, number, number] {
  const x = (point.col - ORIGIN) * SPACING;
  const y = -(point.row - ORIGIN) * SPACING;
  return [x, y, DEPTH];
}
