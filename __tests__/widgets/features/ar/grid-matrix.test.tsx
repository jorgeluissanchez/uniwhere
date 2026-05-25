import React from 'react';
import { render } from '@testing-library/react-native';
import { GridMatrix } from '@/features/ar/presentation/components/grid-matrix';

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

  it('matches snapshot with empty route', () => {
    const { toJSON } = render(<GridMatrix route={[]} onPointSelect={jest.fn()} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
