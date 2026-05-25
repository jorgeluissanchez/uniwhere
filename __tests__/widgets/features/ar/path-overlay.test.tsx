import React from 'react';
import { render } from '@testing-library/react-native';
import { PathOverlay } from '@/features/ar/presentation/components/path-overlay';

describe('PathOverlay', () => {
  it('renders without crashing when route is empty', () => {
    const { toJSON } = render(<PathOverlay route={[]} size={288} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders without crashing with a single point (no lines)', () => {
    const { toJSON } = render(<PathOverlay route={[{ row: 0, col: 0 }]} size={288} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with a multi-point route', () => {
    const route = [{ row: 0, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 2 }];
    const { toJSON } = render(<PathOverlay route={route} size={288} />);
    expect(toJSON()).toBeTruthy();
  });

  it('matches snapshot', () => {
    const route = [{ row: 0, col: 0 }, { row: 1, col: 1 }];
    const { toJSON } = render(<PathOverlay route={route} size={288} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
