import { AuthUser } from "@/features/auth/domain/entities/auth-user";

export interface AuthRepository {
  login(email: string, password: string): Promise<void>;
  signup(email: string, password: string, name: string, role: string): Promise<void>;
  refreshUserProfile(): Promise<void>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  forgotPassword(email: string): Promise<void>;
}