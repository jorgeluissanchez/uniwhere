// __tests__/context/features/auth/auth-context.test.tsx
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/features/auth/presentation/context/auth-context';
import { DIProvider } from '@/core/di/di-provider';
import { TOKENS } from '@/core/constants/tokens';

const makeAuthRepo = (overrides = {}) => ({
  login: jest.fn().mockResolvedValue(undefined),
  signup: jest.fn().mockResolvedValue(undefined),
  logout: jest.fn().mockResolvedValue(undefined),
  getCurrentUser: jest.fn().mockResolvedValue(null),
  refreshUserProfile: jest.fn().mockResolvedValue(undefined),
  forgotPassword: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

function makeWrapper(repo: ReturnType<typeof makeAuthRepo>) {
  const overrides = new Map<symbol, unknown>([[TOKENS.AuthRepo, repo]]);
  return ({ children }: { children: React.ReactNode }) => (
    <DIProvider overrides={overrides}>
      <AuthProvider>{children}</AuthProvider>
    </DIProvider>
  );
}

describe('AuthContext', () => {
  it('loggedUser is null on mount when getCurrentUser returns null', async () => {
    const repo = makeAuthRepo();
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(repo) });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.loggedUser).toBeNull();
    expect(result.current.isLoggedIn).toBe(false);
  });

  it('on mount calls getCurrentUser and sets loggedUser', async () => {
    const user = { userId: 'u1', email: 'a@b.com', role: 'student', name: 'Alice' };
    const repo = makeAuthRepo({ getCurrentUser: jest.fn().mockResolvedValue(user) });
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(repo) });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.loggedUser).toEqual(user);
    expect(result.current.isLoggedIn).toBe(true);
  });

  it('on mount calls refreshUserProfile when name is missing', async () => {
    const userWithoutName = { userId: 'u1', email: 'a@b.com', role: 'student', name: undefined };
    const repo = makeAuthRepo({ getCurrentUser: jest.fn().mockResolvedValue(userWithoutName) });
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(repo) });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(repo.refreshUserProfile).toHaveBeenCalled();
  });

  it('login success populates loggedUser and clears error', async () => {
    const user = { userId: 'u1', email: 'a@b.com', role: 'student', name: 'Alice' };
    const repo = makeAuthRepo({ getCurrentUser: jest.fn().mockResolvedValue(user) });
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(repo) });

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.login('a@b.com', 'pass'); });

    expect(result.current.loggedUser).toEqual(user);
    expect(result.current.error).toBeNull();
  });

  it('login failure sets error and leaves loggedUser null', async () => {
    const repo = makeAuthRepo({
      login: jest.fn().mockRejectedValue(new Error('Credenciales inválidas')),
      getCurrentUser: jest.fn().mockResolvedValue(null),
    });
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(repo) });

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.login('bad@b.com', 'wrong'); });

    expect(result.current.error).toBe('Credenciales inválidas');
    expect(result.current.loggedUser).toBeNull();
  });

  it('logout clears loggedUser and isLoggedIn', async () => {
    const user = { userId: 'u1', email: 'a@b.com', role: 'student', name: 'Alice' };
    const repo = makeAuthRepo({ getCurrentUser: jest.fn().mockResolvedValue(user) });
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(repo) });

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.logout(); });

    expect(result.current.loggedUser).toBeNull();
    expect(result.current.isLoggedIn).toBe(false);
  });
});
