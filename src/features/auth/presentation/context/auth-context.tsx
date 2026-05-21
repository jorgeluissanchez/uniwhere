import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-provider";
import { LocalPreferencesAsyncStorage } from "@/core/storage/local-preferences-async-storage";
import { AuthUser } from "@/features/auth/domain/entities/auth-user";
import { AuthRepository } from "@/features/auth/domain/repositories/auth-repository";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AuthContextType = {
  loggedUser: AuthUser | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: string) => Promise<boolean>;
  logout: () => Promise<void>;
  expireSession: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  getLoggedUser: () => Promise<any | null>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const di = useDI();

  const authRepo = useMemo(() => di.resolve<AuthRepository>(TOKENS.AuthRepo), [di]);
  const prefs = useMemo(() => LocalPreferencesAsyncStorage.getInstance(), []);

  const [loggedUser, setLoggedUser] = useState<AuthUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const clearLocalSession = async () => {
    await Promise.all([
      prefs.removeData("token"),
      prefs.removeData("refreshToken"),
      prefs.removeData("userId"),
      prefs.removeData("email"),
    ]);
    setLoggedUser(null);
    setIsLoggedIn(false);
  };

  useEffect(() => {
    authRepo.getCurrentUser()
      .then(async (user) => {
        if (user && !user.name) {
          await authRepo.refreshUserProfile().catch(() => {});
          const refreshed = await authRepo.getCurrentUser().catch(() => user);
          setLoggedUser(refreshed);
          setIsLoggedIn(!!refreshed);
        } else {
          setLoggedUser(user);
          setIsLoggedIn(!!user);
        }
      })
      .catch(() => setIsLoggedIn(false))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    clearError();
    try {
      setLoading(true);
      await authRepo.login(email, password);
      const user = await authRepo.getCurrentUser();
      setLoggedUser(user);
      setIsLoggedIn(true);
    } catch (err: any) {
      setError(err?.message ?? "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, role: string) => {
    clearError();
    try {
      setLoading(true);
      await authRepo.signup(email, password, name, role);
      const user = await authRepo.getCurrentUser();
      setLoggedUser(user);
      setIsLoggedIn(true);
      return true;
    } catch (err: any) {
      setError(err?.message ?? "Error al registrar la cuenta");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    clearError();
    try {
      setLoading(true);
      await authRepo.logout();
    } catch (err: any) {
      setError(err?.message ?? "Error al cerrar sesión");
    } finally {
      await clearLocalSession();
      setLoading(false);
    }
  };

  const expireSession = async () => {
    clearError();
    await clearLocalSession();
    setLoading(false);
  };

  const forgotPassword = async (email: string) => {
    clearError();
    try {
      setLoading(true);
      await authRepo.forgotPassword(email);
    } catch (err: any) {
      setError(err?.message ?? "No se pudo enviar el enlace de restablecimiento");
    } finally {
      setLoading(false);
    }
  };

  const getLoggedUser = async () => {
    try {
      return await authRepo.getCurrentUser();
    } catch (err) {
      return null;
    }
  }

  return (
    <AuthContext.Provider value={{ loggedUser, isLoggedIn, loading, error, clearError, login, signup, logout, expireSession, forgotPassword, getLoggedUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}