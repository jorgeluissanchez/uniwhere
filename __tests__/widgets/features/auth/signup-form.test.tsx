import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SignupForm } from '@/features/auth/presentation/components/signup-form';
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

function renderWithAuth(ctx: AuthContextType) {
  return render(
    <AuthContext.Provider value={ctx}>
      <SignupForm />
    </AuthContext.Provider>
  );
}

describe('SignupForm', () => {
  it('renders all four inputs and the submit button', () => {
    const { getByTestId } = renderWithAuth(makeAuthCtx());
    expect(getByTestId('signup-name-input')).toBeTruthy();
    expect(getByTestId('signup-email-input')).toBeTruthy();
    expect(getByTestId('signup-password-input')).toBeTruthy();
    expect(getByTestId('signup-confirm-password-input')).toBeTruthy();
    expect(getByTestId('signup-button')).toBeTruthy();
  });

  it('shows error when name is empty on submit', async () => {
    const { getByTestId, getByText } = renderWithAuth(makeAuthCtx());
    fireEvent.press(getByTestId('signup-button'));
    await waitFor(() => expect(getByText('Ingresa tu nombre')).toBeTruthy());
  });

  it('shows error for invalid email', async () => {
    const { getByTestId, getByText } = renderWithAuth(makeAuthCtx());
    fireEvent.changeText(getByTestId('signup-name-input'), 'Alice');
    fireEvent.changeText(getByTestId('signup-email-input'), 'not-an-email');
    fireEvent.changeText(getByTestId('signup-password-input'), 'pass123');
    fireEvent.changeText(getByTestId('signup-confirm-password-input'), 'pass123');
    fireEvent.press(getByTestId('signup-button'));
    await waitFor(() => expect(getByText('Ingresa un correo válido')).toBeTruthy());
  });

  it('shows error when passwords do not match', async () => {
    const { getByTestId, getByText } = renderWithAuth(makeAuthCtx());
    fireEvent.changeText(getByTestId('signup-name-input'), 'Alice');
    fireEvent.changeText(getByTestId('signup-email-input'), 'alice@example.com');
    fireEvent.changeText(getByTestId('signup-password-input'), 'pass123');
    fireEvent.changeText(getByTestId('signup-confirm-password-input'), 'different');
    fireEvent.press(getByTestId('signup-button'));
    await waitFor(() => expect(getByText('Las contraseñas no coinciden')).toBeTruthy());
  });

  it('calls signup() with correct args on valid submit', async () => {
    const signupMock = jest.fn().mockResolvedValue(false);
    const ctx = makeAuthCtx({ signup: signupMock });
    const { getByTestId } = renderWithAuth(ctx);

    fireEvent.changeText(getByTestId('signup-name-input'), '  Alice  ');
    fireEvent.changeText(getByTestId('signup-email-input'), ' alice@example.com ');
    fireEvent.changeText(getByTestId('signup-password-input'), 'pass123');
    fireEvent.changeText(getByTestId('signup-confirm-password-input'), 'pass123');
    fireEvent.press(getByTestId('signup-button'));

    await waitFor(() =>
      expect(signupMock).toHaveBeenCalledWith('alice@example.com', 'pass123', 'Alice', 'user')
    );
  });

  it('displays auth error from context', () => {
    const ctx = makeAuthCtx({ error: 'El correo ya existe' });
    const { getByText } = renderWithAuth(ctx);
    expect(getByText('El correo ya existe')).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = renderWithAuth(makeAuthCtx());
    expect(toJSON()).toMatchSnapshot();
  });
});
