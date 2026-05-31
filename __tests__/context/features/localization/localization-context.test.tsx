import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { LocalizationProvider, useLocalization } from '@/features/localization/presentation/context/localization-context';
import { DIProvider } from '@/core/di/di-provider';
import { TOKENS } from '@/core/constants/tokens';

const MOCK_SCAN = { _id: 's1', userId: 'u1', jobId: 'j1', serie: 'se1', tipo: 'dense' as const, localUri: '', createdAt: '' };
const MOCK_IMAGE = { uri: 'file://img.jpg', name: 'img.jpg', type: 'image/jpeg' };
const MOCK_RESULT = { x: 1, y: 2, z: 3, success: true, inlier_count: 10 };

const makeRepo = (overrides = {}) => ({
  localize: jest.fn().mockResolvedValue(MOCK_RESULT),
  ...overrides,
});

function makeWrapper(repo: ReturnType<typeof makeRepo>) {
  const overrides = new Map<symbol, unknown>([[TOKENS.Localization_Repo, repo]]);
  return ({ children }: { children: React.ReactNode }) => (
    <DIProvider overrides={overrides}><LocalizationProvider>{children}</LocalizationProvider></DIProvider>
  );
}

describe('LocalizationContext', () => {
  it('submit returns false and does not call repo when selectedScan is null', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useLocalization(), { wrapper: makeWrapper(repo) });

    let returnVal: boolean | undefined;
    await act(async () => { returnVal = await result.current.submit(); });
    expect(returnVal).toBe(false);
    expect(repo.localize).not.toHaveBeenCalled();
  });

  it('submit returns false when image is null', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useLocalization(), { wrapper: makeWrapper(repo) });
    act(() => result.current.setSelectedScan(MOCK_SCAN));

    let returnVal: boolean | undefined;
    await act(async () => { returnVal = await result.current.submit(); });
    expect(returnVal).toBe(false);
  });

  it('submit success sets result', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useLocalization(), { wrapper: makeWrapper(repo) });
    act(() => {
      result.current.setSelectedScan(MOCK_SCAN);
      result.current.setImage(MOCK_IMAGE);
    });

    await act(async () => { await result.current.submit(); });
    expect(result.current.result).toEqual(MOCK_RESULT);
    expect(result.current.error).toBeNull();
  });

  it('submit error sets error string', async () => {
    const repo = makeRepo({ localize: jest.fn().mockRejectedValue(new Error('Fallo de red')) });
    const { result } = renderHook(() => useLocalization(), { wrapper: makeWrapper(repo) });
    act(() => {
      result.current.setSelectedScan(MOCK_SCAN);
      result.current.setImage(MOCK_IMAGE);
    });

    await act(async () => { await result.current.submit(); });
    expect(result.current.error).toBe('Fallo de red');
  });

  it('reset clears all fields', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useLocalization(), { wrapper: makeWrapper(repo) });
    act(() => {
      result.current.setSelectedScan(MOCK_SCAN);
      result.current.setImage(MOCK_IMAGE);
    });

    act(() => result.current.reset());
    expect(result.current.selectedScan).toBeNull();
    expect(result.current.image).toBeNull();
    expect(result.current.result).toBeNull();
  });
});
