import React from 'react';
import { render } from '@testing-library/react-native';
import { GridMatrix, CELL_SIZE, GRID_SIZE } from '@/features/ar/presentation/components/grid-matrix';

/** El contenedor externo, cuyo tamaño define el lado total de la cuadrícula. */
function gridBox(tree: any) {
  return Array.isArray(tree) ? tree[0] : tree;
}

describe('GridMatrix', () => {
  it('renders without crashing', () => {
    const onPointSelect = jest.fn();
    const { toJSON } = render(<GridMatrix route={[]} onPointSelect={onPointSelect} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with a route without crashing', () => {
    const route = [{ row: 0, col: 0 }, { row: 1, col: 1 }];
    const onPointSelect = jest.fn();
    const { toJSON } = render(<GridMatrix route={route} onPointSelect={onPointSelect} />);
    expect(toJSON()).toBeTruthy();
  });

  it('defaults to CELL_SIZE when no cellSize is given', () => {
    const { toJSON } = render(<GridMatrix route={[]} onPointSelect={jest.fn()} />);
    expect(gridBox(toJSON()).props.style).toMatchObject({
      width: GRID_SIZE * CELL_SIZE,
      height: GRID_SIZE * CELL_SIZE,
    });
  });

  it('scales the whole grid with cellSize', () => {
    const cellSize = 20;
    const { toJSON } = render(
      <GridMatrix route={[]} onPointSelect={jest.fn()} cellSize={cellSize} />
    );
    const box = gridBox(toJSON());

    expect(box.props.style).toMatchObject({
      width: GRID_SIZE * cellSize,
      height: GRID_SIZE * cellSize,
    });

    // El último punto debe caer dentro de la caja, no desbordarla.
    const dots = box.children ?? [];
    expect(dots).toHaveLength(GRID_SIZE * GRID_SIZE);
    const last = dots[dots.length - 1].props.style;
    expect(last.left + last.width).toBeLessThanOrEqual(GRID_SIZE * cellSize);
    expect(last.top + last.height).toBeLessThanOrEqual(GRID_SIZE * cellSize);
  });

  it('matches snapshot with empty route', () => {
    const { toJSON } = render(<GridMatrix route={[]} onPointSelect={jest.fn()} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
