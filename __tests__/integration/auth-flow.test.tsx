import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/features/auth/presentation/context/auth-context';
import { DIProvider } from '@/core/di/di-provider';
import { LocalPreferencesAsyncStorage } from '@/core/storage/local-preferences-async-storage';
import { FAKE_TOKEN, FAKE_USER_ID } from '../setup/handlers/auth.handlers';

const prefs = LocalPreferencesAsyncStorage.getInstance();

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <DIProvider>
      <AuthProvider>{children}</AuthProvider>
    </DIProvider>
  );
}

describe('Auth integration — login flow with real data source + MSW', () => {
  beforeEach(async () => {
    await prefs.removeData('token');
    await prefs.removeData('refreshToken');
    await prefs.removeData('userId');
    await prefs.removeData('email');
    await prefs.removeData('role');
    await prefs.removeData('name');
  });

  it('login populates loggedUser from MSW-intercepted HTTP response', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.loggedUser?.email).toBe('test@example.com');
    expect(result.current.loggedUser?.userId).toBe(FAKE_USER_ID);
    expect(result.current.error).toBeNull();
  });

  it('getCurrentUser returns null when no stored credentials', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.loggedUser).toBeNull();
    expect(result.current.isLoggedIn).toBe(false);
  });

  it('logout clears session after successful login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.login('test@example.com', 'password123'); });
    expect(result.current.isLoggedIn).toBe(true);

    await act(async () => { await result.current.logout(); });
    expect(result.current.loggedUser).toBeNull();
    expect(result.current.isLoggedIn).toBe(false);
  });

  it('session restores from stored credentials on mount', async () => {
    // Pre-populate AsyncStorage as if a prior login succeeded
    await prefs.storeData('token', FAKE_TOKEN);
    await prefs.storeData('userId', FAKE_USER_ID);
    await prefs.storeData('email', 'stored@example.com');
    await prefs.storeData('role', 'student');
    await prefs.storeData('name', 'Stored User');

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.loggedUser?.email).toBe('stored@example.com');
  });
});
