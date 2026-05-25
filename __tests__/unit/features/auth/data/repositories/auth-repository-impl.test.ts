// __tests__/unit/features/auth/data/repositories/auth-repository-impl.test.ts
import { AuthRepositoryImpl } from '@/features/auth/data/repositories/auth-repository-impl';
import { LocalPreferencesAsyncStorage } from '@/core/storage/local-preferences-async-storage';

const prefs = LocalPreferencesAsyncStorage.getInstance();

const mockDS = {
  login: jest.fn(),
  signUp: jest.fn(),
  logOut: jest.fn(),
  refreshToken: jest.fn(),
  refreshUserProfile: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  verifyToken: jest.fn(),
};

describe('AuthRepositoryImpl', () => {
  let repo: AuthRepositoryImpl;

  beforeEach(() => {
    repo = new AuthRepositoryImpl(mockDS as any);
    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('returns null when no userId in storage', async () => {
      await prefs.removeData('userId');
      await prefs.removeData('email');
      const user = await repo.getCurrentUser();
      expect(user).toBeNull();
    });

    it('reconstructs AuthUser from AsyncStorage', async () => {
      await prefs.storeData('userId', 'user-123');
      await prefs.storeData('email', 'test@example.com');
      await prefs.storeData('role', 'student');
      await prefs.storeData('name', 'Test User');

      const user = await repo.getCurrentUser();
      expect(user).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'student',
        name: 'Test User',
      });
    });
  });

  it('login delegates to datasource', async () => {
    mockDS.login.mockResolvedValue(undefined);
    await repo.login('a@b.com', 'pass');
    expect(mockDS.login).toHaveBeenCalledWith('a@b.com', 'pass');
  });

  it('logout delegates to datasource', async () => {
    mockDS.logOut.mockResolvedValue(undefined);
    await repo.logout();
    expect(mockDS.logOut).toHaveBeenCalled();
  });
});
