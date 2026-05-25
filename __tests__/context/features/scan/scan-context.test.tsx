import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { ScanProvider, useScan } from '@/features/scan/presentation/context/scan-context';
import { AuthProvider } from '@/features/auth/presentation/context/auth-context';
import { DIProvider } from '@/core/di/di-provider';
import { TOKENS } from '@/core/constants/tokens';

const MOCK_USER = { userId: 'user-1', email: 'a@b.com', role: 'student', name: 'Alice' };
const MOCK_SCAN = { _id: 's1', userId: 'user-1', jobId: 'j1', serie: 'se1', tipo: 'dense' as const, localUri: '', createdAt: '2026-01-01' };

const makeScanRepo = (overrides = {}) => ({
  getScansByUser: jest.fn().mockResolvedValue([MOCK_SCAN]),
  saveScan: jest.fn().mockResolvedValue(undefined),
  updateScan: jest.fn().mockResolvedValue(undefined),
  deleteScan: jest.fn().mockResolvedValue(undefined),
  fetchPortada: jest.fn().mockResolvedValue(null),
  ...overrides,
});

const makeAuthRepo = (user = MOCK_USER) => ({
  login: jest.fn(), signup: jest.fn(), logout: jest.fn(),
  forgotPassword: jest.fn(), refreshUserProfile: jest.fn(),
  getCurrentUser: jest.fn().mockResolvedValue(user),
});

function makeWrapper(scanRepo: ReturnType<typeof makeScanRepo>, authUser = MOCK_USER) {
  const authRepo = makeAuthRepo(authUser);
  const overrides = new Map<symbol, unknown>([
    [TOKENS.ScanRepo, scanRepo],
    [TOKENS.AuthRepo, authRepo],
  ]);
  return ({ children }: { children: React.ReactNode }) => (
    <DIProvider overrides={overrides}>
      <AuthProvider>
        <ScanProvider>{children}</ScanProvider>
      </AuthProvider>
    </DIProvider>
  );
}

describe('ScanContext', () => {
  it('refresh loads scans on mount once loggedUser is set', async () => {
    const repo = makeScanRepo();
    const { result } = renderHook(() => useScan(), { wrapper: makeWrapper(repo) });
    // Wait for scans to actually load (AuthProvider resolves async, then ScanProvider loads)
    await waitFor(() => expect(result.current.scans).toHaveLength(1));
    expect(result.current.scans[0]._id).toBe('s1');
  });

  it('saveScan calls repo and refreshes list', async () => {
    const repo = makeScanRepo();
    const { result } = renderHook(() => useScan(), { wrapper: makeWrapper(repo) });
    await waitFor(() => expect(result.current.scans).toHaveLength(1));

    await act(async () => {
      await result.current.saveScan({ userId: 'u1', jobId: 'j2', serie: 'se2', tipo: 'dense', localUri: '' });
    });

    expect(repo.saveScan).toHaveBeenCalled();
    // getScansByUser called once on mount, once after save
    expect(repo.getScansByUser).toHaveBeenCalledTimes(2);
  });

  it('deleteScan removes item from scans list', async () => {
    const repo = makeScanRepo();
    const { result } = renderHook(() => useScan(), { wrapper: makeWrapper(repo) });
    await waitFor(() => expect(result.current.scans).toHaveLength(1));

    await act(async () => { await result.current.deleteScan('s1'); });
    expect(result.current.scans.find(s => s._id === 's1')).toBeUndefined();
  });

  it('sets error when getScansByUser fails', async () => {
    const repo = makeScanRepo({ getScansByUser: jest.fn().mockRejectedValue(new Error('Network error')) });
    const { result } = renderHook(() => useScan(), { wrapper: makeWrapper(repo) });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.loading).toBe(false);
  });
});
