// __tests__/context/features/reconstruction/reconstruction-context.test.tsx
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { ReconstructionProvider, useReconstruction } from '@/features/reconstruction/presentation/context/reconstruction-context';
import { DIProvider } from '@/core/di/di-provider';
import { TOKENS } from '@/core/constants/tokens';

const makeRepo = (overrides = {}) => ({
  startJob: jest.fn().mockResolvedValue({ jobId: 'job-1', serie: 'serie-x' }),
  getStatus: jest.fn().mockResolvedValue({ jobId: 'job-1', serie: 'serie-x', status: 'done', progress: [], error: null }),
  ...overrides,
});

function makeWrapper(repo: ReturnType<typeof makeRepo>) {
  const overrides = new Map<symbol, unknown>([[TOKENS.ReconstructionRepo, repo]]);
  return ({ children }: { children: React.ReactNode }) => (
    <DIProvider overrides={overrides}><ReconstructionProvider>{children}</ReconstructionProvider></DIProvider>
  );
}

describe('ReconstructionContext', () => {
  it('startJob sets submitting to true then false', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useReconstruction(), { wrapper: makeWrapper(repo) });

    await act(async () => { await result.current.startJob({ serie: 's', inferGs: false, photos: [] }); });
    expect(result.current.submitting).toBe(false);
    expect(repo.startJob).toHaveBeenCalled();
  });

  it('startJob on error sets error state', async () => {
    const repo = makeRepo({ startJob: jest.fn().mockRejectedValue(new Error('Server error')) });
    const { result } = renderHook(() => useReconstruction(), { wrapper: makeWrapper(repo) });

    // startJob re-throws after setting error state; catch the rejection here
    await act(async () => {
      await result.current.startJob({ serie: 's', inferGs: false, photos: [] }).catch(() => {});
    });
    expect(result.current.error).toBe('Server error');
  });
});
