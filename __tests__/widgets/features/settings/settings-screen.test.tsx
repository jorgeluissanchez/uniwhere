import React from 'react';
import { render } from '@testing-library/react-native';
import SettingsScreen from '@/features/settings/presentation/screens/settings-screen';
import { AuthContext, AuthContextType } from '@/features/auth/presentation/context/auth-context';

const makeAuthCtx = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
  loggedUser: null,
  isLoggedIn: false,
  loading: false,
  error: null,
  clearError: jest.fn(),
  login: jest.fn().mockResolvedValue(undefined),
  signup: jest.fn().mockResolvedValue(false),
  logout: jest.fn().mockResolvedValue(undefined),
  expireSession: jest.fn().mockResolvedValue(undefined),
  forgotPassword: jest.fn().mockResolvedValue(undefined),
  getLoggedUser: jest.fn().mockResolvedValue(null),
  ...overrides,
});

function renderScreen(ctx: AuthContextType) {
  return render(
    <AuthContext.Provider value={ctx}>
      <SettingsScreen />
    </AuthContext.Provider>
  );
}

describe('SettingsScreen', () => {
  it('renders user name when logged in', () => {
    const ctx = makeAuthCtx({
      loggedUser: { userId: 'u1', name: 'alice smith', email: 'alice@example.com', role: 'student' },
    });
    const { getByText } = renderScreen(ctx);
    expect(getByText('Alice Smith')).toBeTruthy();
  });

  it('renders email when logged in', () => {
    const ctx = makeAuthCtx({
      loggedUser: { userId: 'u1', name: 'Alice', email: 'alice@example.com', role: 'student' },
    });
    const { getByText } = renderScreen(ctx);
    expect(getByText('alice@example.com')).toBeTruthy();
  });

  it('shows admin greeting for admin role', () => {
    const ctx = makeAuthCtx({
      loggedUser: { userId: 'u1', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
    });
    const { getByText } = renderScreen(ctx);
    expect(getByText('Panel de Administrador')).toBeTruthy();
  });

  it('shows profile greeting for non-admin role', () => {
    const ctx = makeAuthCtx({
      loggedUser: { userId: 'u1', name: 'Alice', email: 'alice@example.com', role: 'student' },
    });
    const { getByText } = renderScreen(ctx);
    expect(getByText('Mi Perfil')).toBeTruthy();
  });

  it('falls back to "Usuario" when loggedUser is null', () => {
    const { getAllByText } = renderScreen(makeAuthCtx());
    // "Usuario" appears as displayName and as the role badge when user is null
    expect(getAllByText('Usuario').length).toBeGreaterThanOrEqual(1);
  });

  it('matches snapshot', () => {
    const ctx = makeAuthCtx({
      loggedUser: { userId: 'u1', name: 'Alice', email: 'alice@example.com', role: 'student' },
    });
    const { toJSON } = renderScreen(ctx);
    expect(toJSON()).toMatchSnapshot();
  });
});
