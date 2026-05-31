// src/features/ar/utils/grid-to-world.ts
import { RoutePoint } from '@/features/ar/domain/entities/route';

const SPACING   = 0.28;  // world-space distance between adjacent grid points
const DEPTH     = -1.8;  // base Z distance from camera
const ELEVATION = -0.4;  // Y offset (below camera center, simulates floor level)
const ORIGIN    = 3.5;   // center offset for an 8×8 grid ((8-1)/2)

/**
 * Maps a 2D grid cell to a Three.js world position on the X-Z plane (parallel
 * to the ground). col → X (left/right), row → Z (near/far).
 */
export function gridToWorld(point: RoutePoint): [number, number, number] {
  const x = (point.col - ORIGIN) * SPACING;
  const y = ELEVATION;
  const z = DEPTH - (point.row - ORIGIN) * SPACING;
  return [x, y, z];
}
