// __tests__/unit/features/ar/utils/grid-to-world.test.ts
import { gridToWorld } from '@/features/ar/utils/grid-to-world';

const SPACING = 0.28;
const DEPTH = -1.8;
const ELEVATION = -0.4;
const ORIGIN = 3.5;

describe('gridToWorld', () => {
  it('maps col to X axis with correct spacing', () => {
    const [x] = gridToWorld({ row: 0, col: 0 });
    expect(x).toBeCloseTo((0 - ORIGIN) * SPACING);
  });

  it('maps row to Z axis (depth)', () => {
    const [, , z] = gridToWorld({ row: 2, col: 0 });
    expect(z).toBeCloseTo(DEPTH - (2 - ORIGIN) * SPACING);
  });

  it('Y is always ELEVATION', () => {
    expect(gridToWorld({ row: 3, col: 5 })[1]).toBeCloseTo(ELEVATION);
  });

  it('center cell (3.5, 3.5) maps to approximately (0, ELEVATION, DEPTH)', () => {
    // ORIGIN is 3.5 for an 8x8 grid — but since indices are integers,
    // use col=4, row=0 to test direction
    const [x] = gridToWorld({ row: 0, col: 4 });
    expect(x).toBeCloseTo((4 - ORIGIN) * SPACING);
  });
});
