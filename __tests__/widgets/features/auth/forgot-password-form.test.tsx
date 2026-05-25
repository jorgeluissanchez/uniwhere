import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TextInput } from 'react-native';
import { ForgotPasswordForm } from '@/features/auth/presentation/components/forgot-password-form';
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

function renderForm(ctx: AuthContextType) {
  return render(
    <AuthContext.Provider value={ctx}>
      <ForgotPasswordForm />
    </AuthContext.Provider>
  );
}

describe('ForgotPasswordForm', () => {
  it('renders the submit button', () => {
    const { getByText } = renderForm(makeAuthCtx());
    expect(getByText('Enviar enlace de restablecimiento')).toBeTruthy();
  });

  it('shows validation error when email is empty', async () => {
    const { getByText } = renderForm(makeAuthCtx());
    fireEvent.press(getByText('Enviar enlace de restablecimiento'));
    await waitFor(() => expect(getByText('Ingresa tu correo')).toBeTruthy());
  });

  it('shows validation error for invalid email', async () => {
    const result = renderForm(makeAuthCtx());
    const input = result.UNSAFE_getByType(TextInput);
    fireEvent.changeText(input, 'bad-email');
    fireEvent.press(result.getByText('Enviar enlace de restablecimiento'));
    await waitFor(() => expect(result.getByText('Ingresa un correo válido')).toBeTruthy());
  });

  it('calls forgotPassword with trimmed email on valid submit', async () => {
    const forgotMock = jest.fn().mockResolvedValue(undefined);
    const ctx = makeAuthCtx({ forgotPassword: forgotMock });
    const result = renderForm(ctx);
    const input = result.UNSAFE_getByType(TextInput);
    fireEvent.changeText(input, ' user@example.com ');
    fireEvent.press(result.getByText('Enviar enlace de restablecimiento'));
    await waitFor(() => expect(forgotMock).toHaveBeenCalledWith('user@example.com'));
  });

  it('displays auth error from context', () => {
    const { getByText } = renderForm(makeAuthCtx({ error: 'Usuario no encontrado' }));
    expect(getByText('Usuario no encontrado')).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = renderForm(makeAuthCtx());
    expect(toJSON()).toMatchSnapshot();
  });
});
