import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { ARRouteProvider, useARRoute } from '@/features/ar/presentation/context/ar-route-context';
import { DIProvider } from '@/core/di/di-provider';
import { TOKENS } from '@/core/constants/tokens';

const ROUTE = [{ row: 0, col: 0 }, { row: 1, col: 1 }];

const makeRepo = (overrides = {}) => ({
  saveRoute: jest.fn().mockResolvedValue(undefined),
  loadRoute: jest.fn().mockResolvedValue(ROUTE),
  clearRoute: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

function makeWrapper(repo: ReturnType<typeof makeRepo>) {
  const overrides = new Map<symbol, unknown>([[TOKENS.AR_RouteRepo, repo]]);
  return ({ children }: { children: React.ReactNode }) => (
    <DIProvider overrides={overrides}><ARRouteProvider>{children}</ARRouteProvider></DIProvider>
  );
}

describe('ARRouteContext', () => {
  it('loadSavedRoute is called on mount and sets savedRoute', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useARRoute(), { wrapper: makeWrapper(repo) });
    await waitFor(() => expect(result.current.savedRoute).toEqual(ROUTE));
  });

  it('saveRoute calls repo with current route points', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useARRoute(), { wrapper: makeWrapper(repo) });

    act(() => result.current.addPoint({ row: 0, col: 0 }));
    await act(async () => { await result.current.saveRoute(); });
    expect(repo.saveRoute).toHaveBeenCalledWith([{ row: 0, col: 0 }]);
  });

  it('loadSavedRoute calls repo loadRoute', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useARRoute(), { wrapper: makeWrapper(repo) });
    await act(async () => { await result.current.loadSavedRoute(); });
    expect(repo.loadRoute).toHaveBeenCalled();
  });

  it('addPoint adds a point to route', () => {
    const repo = makeRepo({ loadRoute: jest.fn().mockResolvedValue(null) });
    const { result } = renderHook(() => useARRoute(), { wrapper: makeWrapper(repo) });
    act(() => result.current.addPoint({ row: 2, col: 3 }));
    expect(result.current.route).toContainEqual({ row: 2, col: 3 });
  });

  it('resetRoute clears the route', () => {
    const repo = makeRepo({ loadRoute: jest.fn().mockResolvedValue(null) });
    const { result } = renderHook(() => useARRoute(), { wrapper: makeWrapper(repo) });
    act(() => result.current.addPoint({ row: 0, col: 0 }));
    act(() => result.current.resetRoute());
    expect(result.current.route).toHaveLength(0);
  });
});
