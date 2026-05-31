import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LogoutButton } from '@/features/auth/presentation/components/logout-button';
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

describe('LogoutButton', () => {
  it('renders with testID and label', () => {
    const { getByTestId, getByText } = render(
      <AuthContext.Provider value={makeAuthCtx()}>
        <LogoutButton />
      </AuthContext.Provider>
    );
    expect(getByTestId('logout-button')).toBeTruthy();
    expect(getByText('Cerrar sesión')).toBeTruthy();
  });

  it('calls logout() when pressed', () => {
    const logoutMock = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(
      <AuthContext.Provider value={makeAuthCtx({ logout: logoutMock })}>
        <LogoutButton />
      </AuthContext.Provider>
    );
    fireEvent.press(getByTestId('logout-button'));
    expect(logoutMock).toHaveBeenCalled();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(
      <AuthContext.Provider value={makeAuthCtx()}>
        <LogoutButton />
      </AuthContext.Provider>
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
