// src/features/ar/utils/grid-to-world.ts
import { RoutePoint } from '@/features/ar/domain/entities/route';

const SPACING   = 0.22;  // world-space meters between adjacent grid points
const DEPTH     = -1.8;  // base Z distance from camera (negative = in front)
const ELEVATION = -0.4;  // Y offset (drop below camera center to simulate floor level)
const ORIGIN    = 3.5;   // center offset for an 8×8 grid ((8-1)/2)

/**
 * Maps a 2D grid cell to a Three.js world position.
 * col → X axis (left/right)
 * row → Z axis (near/far from camera), so the drawn shape is preserved in 3D
 * The camera sits at (0,0,0) looking down -Z; more negative Z = further away.
 */
export function gridToWorld(point: RoutePoint): [number, number, number] {
  const x = (point.col - ORIGIN) * SPACING;
  const y = ELEVATION;
  const z = DEPTH - (point.row - ORIGIN) * SPACING;  // row maps depth, not ignored
  return [x, y, z];
}
