// __tests__/widgets/features/auth/login-form.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginForm } from '@/features/auth/presentation/components/login-form';
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
      <LoginForm />
    </AuthContext.Provider>
  );
}

describe('LoginForm', () => {
  it('renders email and password inputs', () => {
    const { getByTestId } = renderWithAuth(makeAuthCtx());
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
  });

  it('renders the login button', () => {
    const { getByTestId } = renderWithAuth(makeAuthCtx());
    expect(getByTestId('login-button')).toBeTruthy();
  });

  it('shows validation error when email is empty on submit', async () => {
    const { getByTestId, getByText } = renderWithAuth(makeAuthCtx());
    fireEvent.press(getByTestId('login-button'));
    await waitFor(() => expect(getByText('Ingresa tu correo')).toBeTruthy());
  });

  it('shows validation error for invalid email format', async () => {
    const { getByTestId, getByText } = renderWithAuth(makeAuthCtx());
    fireEvent.changeText(getByTestId('email-input'), 'not-an-email');
    fireEvent.changeText(getByTestId('password-input'), 'pass123');
    fireEvent.press(getByTestId('login-button'));
    await waitFor(() => expect(getByText('Ingresa un correo válido')).toBeTruthy());
  });

  it('shows validation error when password is empty', async () => {
    const { getByTestId, getByText } = renderWithAuth(makeAuthCtx());
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.press(getByTestId('login-button'));
    await waitFor(() => expect(getByText('Ingresa tu contraseña')).toBeTruthy());
  });

  it('shows validation error when password is too short', async () => {
    const { getByTestId, getByText } = renderWithAuth(makeAuthCtx());
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), '123');
    fireEvent.press(getByTestId('login-button'));
    await waitFor(() => expect(getByText('Mínimo 6 caracteres')).toBeTruthy());
  });

  it('calls login() with trimmed email and password on valid submit', async () => {
    const loginMock = jest.fn().mockResolvedValue(undefined);
    const ctx = makeAuthCtx({ login: loginMock });
    const { getByTestId } = renderWithAuth(ctx);

    fireEvent.changeText(getByTestId('email-input'), '  test@example.com  ');
    fireEvent.changeText(getByTestId('password-input'), 'pass123');
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => expect(loginMock).toHaveBeenCalledWith('test@example.com', 'pass123'));
  });

  it('displays error message from AuthContext', () => {
    const ctx = makeAuthCtx({ error: 'Credenciales inválidas' });
    const { getByText } = renderWithAuth(ctx);
    expect(getByText('Credenciales inválidas')).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = renderWithAuth(makeAuthCtx());
    expect(toJSON()).toMatchSnapshot();
  });
});
