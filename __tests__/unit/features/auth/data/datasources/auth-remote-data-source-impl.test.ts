// __tests__/unit/features/auth/data/datasources/auth-remote-data-source-impl.test.ts
import { AuthRemoteDataSourceImpl } from '@/features/auth/data/datasources/auth-remote-data-source-impl';

// A valid JWT whose payload decodes to {"sub":"user-123"}
const FAKE_TOKEN = `fake-header.eyJzdWIiOiJ1c2VyLTEyMyJ9.fake-sig`;
const FAKE_REFRESH = 'fake-refresh-token';

function mockFetchOk(body: unknown) {
  return jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
    arrayBuffer: async () => new ArrayBuffer(0),
  } as Response);
}

function mockFetchError(status: number, body: unknown) {
  return jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: false,
    status,
    json: async () => body,
  } as Response);
}

describe('AuthRemoteDataSourceImpl', () => {
  let ds: AuthRemoteDataSourceImpl;

  beforeEach(() => {
    ds = new AuthRemoteDataSourceImpl('test-project');
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('login', () => {
    it('calls POST /auth/test-project/login with email and password', async () => {
      // First call: login endpoint. Second call: DB read for user profile.
      mockFetchOk({ accessToken: FAKE_TOKEN, refreshToken: FAKE_REFRESH });
      const fetchSpy = jest.spyOn(global, 'fetch')
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ accessToken: FAKE_TOKEN, refreshToken: FAKE_REFRESH }) } as Response)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [{ role: 'student', name: 'Test' }] } as Response);

      await ds.login('test@example.com', 'password123');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/auth/test-project/login'),
        expect.objectContaining({ method: 'POST', body: expect.stringContaining('test@example.com') }),
      );
    });

    it('throws when login returns 401', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false, status: 401, json: async () => ({ message: 'Invalid credentials' }),
      } as Response);

      await expect(ds.login('bad@example.com', 'wrong')).rejects.toThrow();
    });
  });

  describe('signUp', () => {
    it('calls POST /auth/test-project/signup-direct then retries login', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch')
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) } as Response) // signup
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ accessToken: FAKE_TOKEN, refreshToken: FAKE_REFRESH }) } as Response) // login retry
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) } as Response); // DB insert

      await ds.signUp('new@example.com', 'pass123', 'New User', 'student');

      expect(fetchSpy.mock.calls[0][0]).toContain('signup-direct');
    });
  });

  describe('refreshToken', () => {
    it('calls POST /auth/test-project/refresh-token', async () => {
      // Pre-seed AsyncStorage with a refresh token via prefs mock
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true, status: 200, json: async () => ({ accessToken: FAKE_TOKEN }),
      } as Response);

      // The datasource reads refreshToken from AsyncStorage; AsyncStorage mock is in-memory
      const { LocalPreferencesAsyncStorage } = require('@/core/storage/local-preferences-async-storage');
      await LocalPreferencesAsyncStorage.getInstance().storeData('refreshToken', FAKE_REFRESH);

      const result = await ds.refreshToken();
      expect(result).toBe(true);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('refresh-token'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });
});
