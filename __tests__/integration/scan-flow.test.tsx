import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { ScanProvider, useScan } from '@/features/scan/presentation/context/scan-context';
import { AuthProvider } from '@/features/auth/presentation/context/auth-context';
import { DIProvider } from '@/core/di/di-provider';
import { LocalPreferencesAsyncStorage } from '@/core/storage/local-preferences-async-storage';
import { FAKE_TOKEN, FAKE_USER_ID } from '../setup/handlers/auth.handlers';

const prefs = LocalPreferencesAsyncStorage.getInstance();

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <DIProvider>
      <AuthProvider>
        <ScanProvider>{children}</ScanProvider>
      </AuthProvider>
    </DIProvider>
  );
}

describe('Scan integration — full flow with real data source + MSW', () => {
  beforeEach(async () => {
    await prefs.storeData('token', FAKE_TOKEN);
    await prefs.storeData('userId', FAKE_USER_ID);
    await prefs.storeData('email', 'test@example.com');
    await prefs.storeData('role', 'student');
    await prefs.storeData('name', 'Test User');
  });

  afterEach(async () => {
    await prefs.removeData('token');
    await prefs.removeData('userId');
    await prefs.removeData('email');
    await prefs.removeData('role');
    await prefs.removeData('name');
  });

  it('loads scans on mount via MSW-intercepted DB read', async () => {
    const { result } = renderHook(() => useScan(), { wrapper: Wrapper });
    // Wait for scans to load (ScanProvider waits for loggedUser from AuthProvider)
    await waitFor(() => expect(result.current.scans.length).toBeGreaterThanOrEqual(1), { timeout: 5000 });

    expect(result.current.scans[0]._id).toBe('scan-1');
    expect(result.current.scans[0].userId).toBe(FAKE_USER_ID);
  });

  it('saveScan calls DB insert and refreshes the list', async () => {
    const { result } = renderHook(() => useScan(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.saveScan({
        userId: FAKE_USER_ID,
        jobId: 'new-job',
        serie: 'new-serie',
        tipo: 'dense',
        localUri: '',
      });
    });

    // After save, getScansByUser is called again; MSW returns the same mock row
    expect(result.current.error).toBeNull();
  });

  it('deleteScan calls DB delete and removes item from list', async () => {
    const { result } = renderHook(() => useScan(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.scans.length).toBeGreaterThanOrEqual(1), { timeout: 5000 });

    await act(async () => { await result.current.deleteScan('scan-1'); });

    // After delete, the scan is removed from local state
    expect(result.current.scans.find(s => s._id === 'scan-1')).toBeUndefined();
  });
});
