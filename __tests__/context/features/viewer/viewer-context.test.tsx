import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { ViewerProvider, useViewer } from '@/features/viewer/presentation/context/viewer-context';
import { DIProvider } from '@/core/di/di-provider';
import { TOKENS } from '@/core/constants/tokens';
import * as THREE from 'three';

const mockCloud = {
  geometry: new THREE.BufferGeometry(),
  vertexCount: 100,
  originalVertexCount: 100,
  hasColors: false,
  boundingBox: new THREE.Box3(),
  centeringOffset: new THREE.Vector3(),
};

const makeRepo = (overrides = {}) => ({
  loadFromFile: jest.fn().mockResolvedValue(mockCloud),
  loadFromPath: jest.fn().mockResolvedValue(mockCloud),
  ...overrides,
});

function makeWrapper(repo: ReturnType<typeof makeRepo>) {
  const overrides = new Map<symbol, unknown>([[TOKENS.ViewerRepo, repo]]);
  return ({ children }: { children: React.ReactNode }) => (
    <DIProvider overrides={overrides}><ViewerProvider>{children}</ViewerProvider></DIProvider>
  );
}

describe('ViewerContext', () => {
  it('cloud is null before loading', () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useViewer(), { wrapper: makeWrapper(repo) });
    expect(result.current.cloud).toBeNull();
  });

  it('loadFromPath calls repo and sets cloud', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useViewer(), { wrapper: makeWrapper(repo) });

    await act(async () => { await result.current.loadFromPath('file://my.ply'); });
    expect(repo.loadFromPath).toHaveBeenCalledWith('file://my.ply');
    expect(result.current.cloud).toBe(mockCloud);
  });

  it('loadFromPath on error sets error string', async () => {
    const repo = makeRepo({ loadFromPath: jest.fn().mockRejectedValue(new Error('Parse failed')) });
    const { result } = renderHook(() => useViewer(), { wrapper: makeWrapper(repo) });

    await act(async () => { await result.current.loadFromPath('bad.ply'); });
    expect(result.current.error).toContain('Parse failed');
    expect(result.current.cloud).toBeNull();
  });

  it('loadFile delegates to repo', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useViewer(), { wrapper: makeWrapper(repo) });
    await act(async () => { await result.current.loadFile(); });
    expect(repo.loadFromFile).toHaveBeenCalled();
  });
});
