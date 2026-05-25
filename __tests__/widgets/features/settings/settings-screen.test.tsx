import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '@/features/settings/presentation/screens/settings-screen';
import { AuthContext, AuthContextType } from '@/features/auth/presentation/context/auth-context';
import { AppThemeContext, AppThemeContextValue } from '@/core/hooks/use-app-theme';
import { TOKENS } from '@/core/constants/theme';

jest.mock('nativewind', () => ({ vars: jest.fn(() => ({})), cssInterop: jest.fn() }));

const makeAuthCtx = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
  loggedUser: { userId: '1', email: 'test@test.com', role: 'user', name: 'Test User' },
  isLoggedIn: true, loading: false, error: null,
  clearError: jest.fn(), login: jest.fn(), signup: jest.fn(), logout: jest.fn(),
  expireSession: jest.fn(), forgotPassword: jest.fn(), getLoggedUser: jest.fn(),
  ...overrides,
});

const makeThemeCtx = (overrides: Partial<AppThemeContextValue> = {}): AppThemeContextValue => ({
  colorTheme: 'indigo', schemeOverride: 'system', resolvedScheme: 'light',
  tokens: TOKENS.indigo.light,
  setColorTheme: jest.fn(), setSchemeOverride: jest.fn(),
  ...overrides,
});

function renderSettings(themeCtx?: Partial<AppThemeContextValue>) {
  return render(
    <AppThemeContext.Provider value={makeThemeCtx(themeCtx)}>
      <AuthContext.Provider value={makeAuthCtx()}>
        <SettingsScreen />
      </AuthContext.Provider>
    </AppThemeContext.Provider>
  );
}

describe('SettingsScreen — Appearance card', () => {
  it('renders the Apariencia section', () => {
    const { getByTestId } = renderSettings();
    expect(getByTestId('appearance-card')).toBeTruthy();
  });

  it('renders mode toggle with Auto selected by default', () => {
    const { getByTestId } = renderSettings();
    expect(getByTestId('mode-toggle-system')).toBeTruthy();
  });

  it('renders theme toggle with Índigo selected by default', () => {
    const { getByTestId } = renderSettings();
    expect(getByTestId('theme-toggle-indigo')).toBeTruthy();
  });

  it('calls setSchemeOverride("dark") when Oscuro is pressed', async () => {
    const setSchemeOverride = jest.fn();
    const { getByTestId } = renderSettings({ setSchemeOverride });
    fireEvent.press(getByTestId('mode-toggle-dark'));
    await waitFor(() => expect(setSchemeOverride).toHaveBeenCalledWith('dark'));
  });

  it('calls setSchemeOverride("light") when Claro is pressed', async () => {
    const setSchemeOverride = jest.fn();
    const { getByTestId } = renderSettings({ setSchemeOverride });
    fireEvent.press(getByTestId('mode-toggle-light'));
    await waitFor(() => expect(setSchemeOverride).toHaveBeenCalledWith('light'));
  });

  it('calls setColorTheme("teal") when Teal is pressed', async () => {
    const setColorTheme = jest.fn();
    const { getByTestId } = renderSettings({ setColorTheme });
    fireEvent.press(getByTestId('theme-toggle-teal'));
    await waitFor(() => expect(setColorTheme).toHaveBeenCalledWith('teal'));
  });
});
