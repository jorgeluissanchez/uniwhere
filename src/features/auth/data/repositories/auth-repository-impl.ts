import { ILocalPreferences } from "@/core/storage/i-local-preferences";
import { LocalPreferencesAsyncStorage } from "@/core/storage/local-preferences-async-storage";
import { AuthRemoteDataSource } from "@/features/auth/data/datasources/auth-remote-data-source";
import { AuthUser } from "@/features/auth/domain/entities/auth-user";
import { AuthRepository } from "@/features/auth/domain/repositories/auth-repository";

export class AuthRepositoryImpl implements AuthRepository {
  private dataSource: AuthRemoteDataSource;
  private prefs: ILocalPreferences;

  constructor(dataSource: AuthRemoteDataSource) {
    this.dataSource = dataSource;
    this.prefs = LocalPreferencesAsyncStorage.getInstance();
  }

  async login(email: string, password: string): Promise<void> {
    return this.dataSource.login(email, password);
  }

  async signup(email: string, password: string, name: string, role: string): Promise<void> {
    return this.dataSource.signUp(email, password, name, role);
  }

  async logout(): Promise<void> {
    return this.dataSource.logOut();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const userId = await this.prefs.retrieveData<string>("userId");
      const email = await this.prefs.retrieveData<string>("email");
      if (!userId || !email) return null;
      const role = await this.prefs.retrieveData<string>("role").catch(() => null);
      const name = await this.prefs.retrieveData<string>("name").catch(() => undefined);
      return { userId, email, role, name: name ?? undefined };
    } catch {
      return null;
    }
  }

  async refreshUserProfile(): Promise<void> {
    return this.dataSource.refreshUserProfile();
  }

  async forgotPassword(email: string): Promise<void> {
    return this.dataSource.forgotPassword(email);
  }
}