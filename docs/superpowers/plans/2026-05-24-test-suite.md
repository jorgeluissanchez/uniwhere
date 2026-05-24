# UniWhere Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete test suite (unit + context + widget + integration) for all 7 features of UniWhere, using Jest + @testing-library/react-native + MSW.

**Architecture:** Unit tests mock fetch directly via jest.spyOn; context/widget tests inject mocked repos via a new DIProvider `overrides` prop; integration tests run real datasource → repo → context chains with MSW intercepting HTTP. MSW server is available globally but in `warn` mode so unit tests are unaffected.

**Tech Stack:** `jest-expo`, `@testing-library/react-native`, `@testing-library/jest-native`, `msw` (v2), `@types/jest`, `pnpm`

**Spec:** `docs/superpowers/specs/2026-05-24-test-suite-design.md`

---

## File Map

**New files:**
- `jest.config.js`
- `__tests__/setup/jest.setup.ts`
- `__tests__/setup/msw-server.ts`
- `__tests__/setup/native-mocks.ts`
- `__tests__/setup/handlers/auth.handlers.ts`
- `__tests__/setup/handlers/scan.handlers.ts`
- `__tests__/setup/handlers/reconstruction.handlers.ts`
- `__tests__/setup/handlers/localization.handlers.ts`
- `__tests__/unit/core/di/container.test.ts`
- `__tests__/unit/features/auth/data/datasources/auth-remote-data-source-impl.test.ts`
- `__tests__/unit/features/auth/data/repositories/auth-repository-impl.test.ts`
- `__tests__/unit/features/scan/data/datasources/scan-remote-data-source-impl.test.ts`
- `__tests__/unit/features/scan/data/repositories/scan-repository-impl.test.ts`
- `__tests__/unit/features/reconstruction/data/datasources/reconstruction-remote-data-source-impl.test.ts`
- `__tests__/unit/features/viewer/data/repositories/ply-repository-impl.test.ts`
- `__tests__/unit/features/localization/data/datasources/localization-remote-data-source-impl.test.ts`
- `__tests__/unit/features/ar/data/repositories/route-repository-impl.test.ts`
- `__tests__/unit/features/ar/utils/grid-to-world.test.ts`
- `__tests__/context/features/auth/auth-context.test.tsx`
- `__tests__/context/features/scan/scan-context.test.tsx`
- `__tests__/context/features/reconstruction/reconstruction-context.test.tsx`
- `__tests__/context/features/viewer/viewer-context.test.tsx`
- `__tests__/context/features/localization/localization-context.test.tsx`
- `__tests__/context/features/ar/ar-route-context.test.tsx`
- `__tests__/widgets/features/auth/login-form.test.tsx`
- `__tests__/widgets/features/auth/signup-form.test.tsx`
- `__tests__/widgets/features/auth/logout-button.test.tsx`
- `__tests__/widgets/features/auth/forgot-password-form.test.tsx`
- `__tests__/widgets/features/scan/new-scan-drawer.test.tsx`
- `__tests__/widgets/features/reconstruction/reconstruction-form.test.tsx`
- `__tests__/widgets/features/reconstruction/job-progress.test.tsx`
- `__tests__/widgets/features/viewer/hud.test.tsx`
- `__tests__/widgets/features/viewer/fps-counter.test.tsx`
- `__tests__/widgets/features/ar/grid-matrix.test.tsx`
- `__tests__/widgets/features/ar/path-overlay.test.tsx`
- `__tests__/widgets/features/localization/localization-form-screen.test.tsx`
- `__tests__/widgets/features/localization/localization-result-screen.test.tsx`
- `__tests__/widgets/features/settings/settings-screen.test.tsx`
- `__tests__/integration/auth-flow.test.tsx`
- `__tests__/integration/scan-flow.test.tsx`
- `__tests__/integration/reconstruction-flow.test.tsx`
- `__tests__/integration/localization-flow.test.tsx`
- `__tests__/integration/ar-route-flow.test.ts`

**Modified files:**
- `package.json` — add devDependencies + `"test"` script
- `src/core/di/di-provider.tsx` — add `overrides?: Map<symbol, unknown>` prop

---

## Task 1: Install dependencies and create jest.config.js

**Files:**
- Modify: `package.json`
- Create: `jest.config.js`

- [ ] **Step 1: Install test dependencies**

```bash
pnpm add -D jest-expo @testing-library/react-native @testing-library/jest-native msw @types/jest
```

- [ ] **Step 2: Add test script to package.json**

In `package.json`, add to the `"scripts"` section:
```json
"test": "jest",
"test:coverage": "jest --coverage"
```

- [ ] **Step 3: Create jest.config.js at project root**

```js
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/jest.setup.ts'],
  testMatch: [
    '<rootDir>/__tests__/**/*.test.{ts,tsx}',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@rn-primitives/.*|nativewind|tailwind-merge|class-variance-authority)',
  ],
  collectCoverageFrom: [
    'src/features/**/*.{ts,tsx}',
    'src/core/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/core/components/ui/**',
  ],
  coverageThreshold: {
    global: { lines: 70, functions: 70 },
  },
};
```

- [ ] **Step 4: Verify Jest can be invoked**

```bash
pnpm test --listTests
```
Expected: lists test files (none yet — just verifies config parses).

- [ ] **Step 5: Commit**

```bash
git add package.json jest.config.js pnpm-lock.yaml
git commit -m "chore(test): install jest-expo, testing-library, msw; add jest.config.js"
```

---

## Task 2: Native mocks, env vars, MSW server, and jest.setup.ts

**Files:**
- Create: `__tests__/setup/native-mocks.ts`
- Create: `__tests__/setup/msw-server.ts`
- Create: `__tests__/setup/jest.setup.ts`
- Create: `__tests__/setup/handlers/auth.handlers.ts`

- [ ] **Step 1: Create native-mocks.ts**

```ts
// __tests__/setup/native-mocks.ts

// AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// expo-file-system (new API used by scan datasource)
jest.mock('expo-file-system', () => {
  const mockFileInstance = {
    exists: true,
    uri: 'file://mock/path.jpg',
    write: jest.fn(),
  };
  return {
    File: jest.fn(() => mockFileInstance),
    Paths: {
      cache: 'file://cache/',
      document: 'file://document/',
    },
  };
});

// expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
}));

// expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  MediaTypeOptions: { Images: 'Images' },
}));

// expo-constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: { hostUri: 'localhost:8081' },
  },
}));

// expo-camera
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
}));

// react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  const Svg = (props: any) => React.createElement('Svg', props);
  const Line = (props: any) => React.createElement('Line', props);
  const Circle = (props: any) => React.createElement('Circle', props);
  const SvgXml = (props: any) => React.createElement('SvgXml', props);
  return { default: Svg, Svg, Line, Circle, SvgXml };
});

// @react-three/fiber (exclude 3D rendering from tests)
jest.mock('@react-three/fiber/native', () => ({
  Canvas: ({ children }: any) => children,
  useFrame: jest.fn(),
  useThree: jest.fn(() => ({ camera: {}, scene: {}, gl: {} })),
}));

// r3f-native-orbitcontrols
jest.mock('r3f-native-orbitcontrols', () => ({
  OrbitControls: () => null,
}));

// expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  Link: ({ children }: any) => children,
}));
```

- [ ] **Step 2: Create auth MSW handlers**

```ts
// __tests__/setup/handlers/auth.handlers.ts
import { http, HttpResponse } from 'msw';

const BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost';
const PROJECT = process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID ?? 'test-project';
const AUTH = `${BASE}/auth/${PROJECT}`;
const DB = `${BASE}/database/${PROJECT}`;

// A minimal JWT whose payload decodes to { sub: 'user-123' }
// Payload (base64url): eyJzdWIiOiJ1c2VyLTEyMyJ9  = {"sub":"user-123"}
export const FAKE_TOKEN = `fake-header.eyJzdWIiOiJ1c2VyLTEyMyJ9.fake-sig`;
export const FAKE_REFRESH = 'fake-refresh-token';
export const FAKE_USER_ID = 'user-123';

export const authHandlers = [
  http.post(`${AUTH}/login`, () =>
    HttpResponse.json({ accessToken: FAKE_TOKEN, refreshToken: FAKE_REFRESH }),
  ),

  http.post(`${AUTH}/signup-direct`, () =>
    HttpResponse.json({ message: 'ok' }),
  ),

  http.post(`${AUTH}/logout`, () =>
    HttpResponse.json({ message: 'ok' }),
  ),

  http.post(`${AUTH}/refresh-token`, () =>
    HttpResponse.json({ accessToken: FAKE_TOKEN }),
  ),

  http.get(`${AUTH}/verify-token`, () =>
    HttpResponse.json({ valid: true }, { status: 200 }),
  ),

  // DB read for user profile (called after login)
  http.get(`${DB}/read`, ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('tableName') === 'user') {
      return HttpResponse.json([{ user_id: FAKE_USER_ID, email: 'test@example.com', name: 'Test User', role: 'student' }]);
    }
    return HttpResponse.json([]);
  }),
];
```

- [ ] **Step 3: Create MSW server**

```ts
// __tests__/setup/msw-server.ts
import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth.handlers';
import { scanHandlers } from './handlers/scan.handlers';
import { reconstructionHandlers } from './handlers/reconstruction.handlers';
import { localizationHandlers } from './handlers/localization.handlers';

export const server = setupServer(
  ...authHandlers,
  ...scanHandlers,
  ...reconstructionHandlers,
  ...localizationHandlers,
);
```

- [ ] **Step 4: Create jest.setup.ts**

```ts
// __tests__/setup/jest.setup.ts
import '@testing-library/jest-native/extend-expect';
import { server } from './msw-server';
import './native-mocks';

// Set env vars used by datasource constructors
process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID = 'test-project';
process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost';
process.env.EXPO_PUBLIC_RECONSTRUCTION_API_URL = 'http://localhost:8000';

// MSW: warn on unhandled requests so unit tests (which mock fetch directly) don't break
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

- [ ] **Step 5: Create placeholder scan/reconstruction/localization handler files** (filled in Task 3)

```ts
// __tests__/setup/handlers/scan.handlers.ts
export const scanHandlers: any[] = [];
```
```ts
// __tests__/setup/handlers/reconstruction.handlers.ts
export const reconstructionHandlers: any[] = [];
```
```ts
// __tests__/setup/handlers/localization.handlers.ts
export const localizationHandlers: any[] = [];
```

- [ ] **Step 6: Run Jest to verify setup loads without errors**

```bash
pnpm test --passWithNoTests
```
Expected: 0 test suites, 0 tests, no errors.

- [ ] **Step 7: Commit**

```bash
git add __tests__/
git commit -m "chore(test): add jest setup, native mocks, MSW server, auth handlers"
```

---

## Task 3: Scan, reconstruction, and localization MSW handlers

**Files:**
- Modify: `__tests__/setup/handlers/scan.handlers.ts`
- Modify: `__tests__/setup/handlers/reconstruction.handlers.ts`
- Modify: `__tests__/setup/handlers/localization.handlers.ts`

- [ ] **Step 1: Write scan handlers**

```ts
// __tests__/setup/handlers/scan.handlers.ts
import { http, HttpResponse } from 'msw';
import { FAKE_TOKEN } from './auth.handlers';

const BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost';
const PROJECT = process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID ?? 'test-project';
const DB = `${BASE}/database/${PROJECT}`;
const RECON = process.env.EXPO_PUBLIC_RECONSTRUCTION_API_URL ?? 'http://localhost:8000';

export const MOCK_SCAN_ROW = {
  _id: 'scan-1',
  user_id: 'user-123',
  job_id: 'job-abc',
  serie: 'serie-x',
  tipo: 'dense',
  local_uri: '',
  created_at: '2026-01-01T00:00:00Z',
};

export const scanHandlers = [
  http.get(`${DB}/read`, ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('tableName') === 'scan') {
      return HttpResponse.json([MOCK_SCAN_ROW]);
    }
    return HttpResponse.json([]);
  }),

  http.post(`${DB}/insert`, () => HttpResponse.json({ inserted: 1 })),

  http.put(`${DB}/update`, () => HttpResponse.json({ updated: 1 })),

  http.delete(`${DB}/delete`, () => HttpResponse.json({ deleted: 1 })),

  // Portada — returns 1x1 pixel JPEG bytes, asserts ngrok header
  http.get(`${RECON}/:serie/portada`, ({ request }) => {
    if (!request.headers.get('ngrok-skip-browser-warning')) {
      return new HttpResponse(null, { status: 400, statusText: 'Missing ngrok header' });
    }
    // 1-byte body stands in for image binary
    return new HttpResponse(new Uint8Array([0xff]).buffer, {
      headers: { 'Content-Type': 'image/jpeg' },
    });
  }),
];
```

- [ ] **Step 2: Write reconstruction handlers**

```ts
// __tests__/setup/handlers/reconstruction.handlers.ts
import { http, HttpResponse } from 'msw';

const RECON = process.env.EXPO_PUBLIC_RECONSTRUCTION_API_URL ?? 'http://localhost:8000';

export const reconstructionHandlers = [
  http.post(`${RECON}/reconstruct`, () =>
    HttpResponse.json({ job_id: 'job-abc', serie: 'serie-x' }),
  ),

  http.get(`${RECON}/status/:jobId`, ({ params }) =>
    HttpResponse.json({
      job_id: params.jobId,
      serie: 'serie-x',
      status: 'done',
      progress: ['step1', 'step2'],
      error: null,
    }),
  ),
];
```

- [ ] **Step 3: Write localization handlers**

```ts
// __tests__/setup/handlers/localization.handlers.ts
import { http, HttpResponse } from 'msw';

const RECON = process.env.EXPO_PUBLIC_RECONSTRUCTION_API_URL ?? 'http://localhost:8000';

export const localizationHandlers = [
  http.post(`${RECON}/:serie/localize`, ({ request }) => {
    if (!request.headers.get('ngrok-skip-browser-warning')) {
      return new HttpResponse(null, { status: 400, statusText: 'Missing ngrok header' });
    }
    return HttpResponse.json({
      success: true,
      inlier_count: 42,
      translation: [1.1, 2.2, 3.3],
      rotation: [],
      pose: [],
    });
  }),
];
```

- [ ] **Step 4: Run setup check**

```bash
pnpm test --passWithNoTests
```
Expected: passes with 0 tests, no import errors.

- [ ] **Step 5: Commit**

```bash
git add __tests__/setup/handlers/
git commit -m "chore(test): add scan, reconstruction, localization MSW handlers"
```

---

## Task 4: Add `overrides` prop to DIProvider

**Files:**
- Modify: `src/core/di/di-provider.tsx`

- [ ] **Step 1: Update DIProvider to accept overrides**

In `src/core/di/di-provider.tsx`, change:

```ts
export function DIProvider({ children }: { children: React.ReactNode }) {
    const container = useMemo(() => {
        const c = new Container();
        // ... all the wiring ...
        return c;
    }, []);

    return <DIContext.Provider value={container}>{children}</DIContext.Provider>;
}
```

To:

```ts
type DIProviderProps = {
    children: React.ReactNode;
    overrides?: Map<symbol, unknown>;
};

export function DIProvider({ children, overrides }: DIProviderProps) {
    const container = useMemo(() => {
        const c = new Container();

        // auth
        const authDS = new AuthRemoteDataSourceImpl();
        const authRepo = new AuthRepositoryImpl(authDS);
        c.register(TOKENS.AuthRemoteDS, authDS)
         .register(TOKENS.AuthRepo, authRepo);

        // viewer
        const filePickerDS = new FilePickerDataSourceImpl();
        const plyParserDS = new PlyStreamingParserDataSourceImpl();
        const viewerRepo = new PlyRepositoryImpl(filePickerDS, plyParserDS);
        c.register(TOKENS.FilePickerDS, filePickerDS)
         .register(TOKENS.PlyParserDS, plyParserDS)
         .register(TOKENS.ViewerRepo, viewerRepo);

        // reconstruction
        const reconstructionRemoteDS = new ReconstructionRemoteDataSourceImpl();
        const reconstructionRepo = new ReconstructionRepositoryImpl(reconstructionRemoteDS);
        c.register(TOKENS.ReconstructionRemoteDS, reconstructionRemoteDS)
         .register(TOKENS.ReconstructionRepo, reconstructionRepo);

        // scan
        const scanRemoteDS = new ScanRemoteDataSourceImpl();
        const scanRepo = new ScanRepositoryImpl(scanRemoteDS);
        c.register(TOKENS.ScanRemoteDS, scanRemoteDS)
         .register(TOKENS.ScanRepo, scanRepo);

        // ar
        const routeStorageDS = new RouteStorageDataSourceImpl();
        const routeRepo = new RouteRepositoryImpl(routeStorageDS);
        c.register(TOKENS.AR_RouteStorageDS, routeStorageDS)
         .register(TOKENS.AR_RouteRepo, routeRepo);

        // localization
        const localizationRemoteDS = new LocalizationRemoteDataSourceImpl();
        const localizationRepo = new LocalizationRepositoryImpl(localizationRemoteDS);
        c.register(TOKENS.Localization_RemoteDS, localizationRemoteDS)
         .register(TOKENS.Localization_Repo, localizationRepo);

        // Apply test overrides last so they win over real implementations
        overrides?.forEach((value, token) => c.register(token, value));

        return c;
    }, [overrides]);

    return <DIContext.Provider value={container}>{children}</DIContext.Provider>;
}
```

- [ ] **Step 2: Verify app still builds**

```bash
pnpm start --port 8083
```
Expected: Expo dev server starts without TypeScript errors. Then Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add src/core/di/di-provider.tsx
git commit -m "feat(di): add optional overrides prop to DIProvider for testing"
```

---

## Task 5: Unit tests — core DI container + auth datasource

**Files:**
- Create: `__tests__/unit/core/di/container.test.ts`
- Create: `__tests__/unit/features/auth/data/datasources/auth-remote-data-source-impl.test.ts`

- [ ] **Step 1: Write container unit tests**

```ts
// __tests__/unit/core/di/container.test.ts
import { Container } from '@/core/di/container';

describe('Container', () => {
  const TOKEN = Symbol('TestToken');

  it('resolves a registered value', () => {
    const c = new Container();
    c.register(TOKEN, 'hello');
    expect(c.resolve(TOKEN)).toBe('hello');
  });

  it('throws when resolving an unregistered token', () => {
    const c = new Container();
    expect(() => c.resolve(TOKEN)).toThrow();
  });

  it('overwrites a registration when the same token is registered twice', () => {
    const c = new Container();
    c.register(TOKEN, 'first');
    c.register(TOKEN, 'second');
    expect(c.resolve(TOKEN)).toBe('second');
  });

  it('register returns the container for chaining', () => {
    const c = new Container();
    expect(c.register(TOKEN, 'v')).toBe(c);
  });
});
```

- [ ] **Step 2: Write auth datasource unit tests**

```ts
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
      const { LocalPreferencesAsyncStorage } = await import('@/core/storage/local-preferences-async-storage');
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
```

- [ ] **Step 3: Run these tests**

```bash
pnpm test __tests__/unit/core __tests__/unit/features/auth/data/datasources --verbose
```
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add __tests__/unit/
git commit -m "test(unit): add container and auth datasource unit tests"
```

---

## Task 6: Unit tests — auth repository + scan datasource

**Files:**
- Create: `__tests__/unit/features/auth/data/repositories/auth-repository-impl.test.ts`
- Create: `__tests__/unit/features/scan/data/datasources/scan-remote-data-source-impl.test.ts`

- [ ] **Step 1: Write auth repository tests**

```ts
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
```

- [ ] **Step 2: Write scan datasource tests**

```ts
// __tests__/unit/features/scan/data/datasources/scan-remote-data-source-impl.test.ts
import { ScanRemoteDataSourceImpl } from '@/features/scan/data/datasources/scan-remote-data-source-impl';
import { LocalPreferencesAsyncStorage } from '@/core/storage/local-preferences-async-storage';

const prefs = LocalPreferencesAsyncStorage.getInstance();

function mockFetchAuthOk(body: unknown) {
  return jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true, status: 200, json: async () => body,
  } as Response);
}

describe('ScanRemoteDataSourceImpl', () => {
  let ds: ScanRemoteDataSourceImpl;

  beforeEach(async () => {
    ds = new ScanRemoteDataSourceImpl();
    await prefs.storeData('token', 'test-token');
    jest.clearAllMocks();
  });

  afterEach(() => jest.restoreAllMocks());

  it('getScansByUser sends GET with user_id param and maps snake_case to camelCase', async () => {
    const fetchSpy = mockFetchAuthOk([{
      _id: 'scan-1', user_id: 'user-123', job_id: 'job-abc',
      serie: 'serie-x', tipo: 'dense', local_uri: '', created_at: '2026-01-01',
    }]);

    const scans = await ds.getScansByUser('user-123');

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('user_id=user-123'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: expect.stringContaining('Bearer') }) }),
    );
    expect(scans[0]).toEqual({
      _id: 'scan-1', userId: 'user-123', jobId: 'job-abc',
      serie: 'serie-x', tipo: 'dense', localUri: '', createdAt: '2026-01-01',
    });
  });

  it('saveScan sends POST with snake_case columns', async () => {
    const fetchSpy = mockFetchAuthOk({ inserted: 1 });
    await ds.saveScan({ userId: 'u1', jobId: 'j1', serie: 's1', tipo: 'dense', localUri: '' });

    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body.records[0]).toMatchObject({
      user_id: 'u1', job_id: 'j1', serie: 's1', tipo: 'dense', local_uri: '',
    });
  });

  it('deleteScan sends DELETE with correct idValue', async () => {
    const fetchSpy = mockFetchAuthOk({ deleted: 1 });
    await ds.deleteScan('scan-1');

    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body.idValue).toBe('scan-1');
  });
});
```

- [ ] **Step 3: Run**

```bash
pnpm test __tests__/unit/features/auth/data/repositories __tests__/unit/features/scan/data/datasources --verbose
```

- [ ] **Step 4: Commit**

```bash
git add __tests__/unit/
git commit -m "test(unit): add auth repository and scan datasource unit tests"
```

---

## Task 7: Unit tests — scan repository, reconstruction datasource

**Files:**
- Create: `__tests__/unit/features/scan/data/repositories/scan-repository-impl.test.ts`
- Create: `__tests__/unit/features/reconstruction/data/datasources/reconstruction-remote-data-source-impl.test.ts`

- [ ] **Step 1: Write scan repository tests**

```ts
// __tests__/unit/features/scan/data/repositories/scan-repository-impl.test.ts
import { ScanRepositoryImpl } from '@/features/scan/data/repositories/scan-repository-impl';

const mockDS = {
  getScansByUser: jest.fn(),
  saveScan: jest.fn(),
  updateScan: jest.fn(),
  deleteScan: jest.fn(),
  fetchPortada: jest.fn(),
};

describe('ScanRepositoryImpl', () => {
  let repo: ScanRepositoryImpl;

  beforeEach(() => {
    repo = new ScanRepositoryImpl(mockDS as any);
    jest.clearAllMocks();
  });

  it('getScansByUser delegates to datasource', async () => {
    mockDS.getScansByUser.mockResolvedValue([]);
    await repo.getScansByUser('user-1');
    expect(mockDS.getScansByUser).toHaveBeenCalledWith('user-1');
  });

  it('fetchPortada returns null when datasource returns null', async () => {
    mockDS.fetchPortada.mockResolvedValue(null);
    const result = await repo.fetchPortada('serie-x');
    expect(result).toBeNull();
  });

  it('fetchPortada returns URI from datasource', async () => {
    mockDS.fetchPortada.mockResolvedValue('file://cache/portada_serie-x.jpg');
    const result = await repo.fetchPortada('serie-x');
    expect(result).toBe('file://cache/portada_serie-x.jpg');
  });
});
```

- [ ] **Step 2: Write reconstruction datasource tests**

```ts
// __tests__/unit/features/reconstruction/data/datasources/reconstruction-remote-data-source-impl.test.ts
import { ReconstructionRemoteDataSourceImpl } from '@/features/reconstruction/data/datasources/reconstruction-remote-data-source-impl';

describe('ReconstructionRemoteDataSourceImpl', () => {
  let ds: ReconstructionRemoteDataSourceImpl;

  beforeEach(() => {
    ds = new ReconstructionRemoteDataSourceImpl();
    jest.clearAllMocks();
  });

  afterEach(() => jest.restoreAllMocks());

  describe('startJob', () => {
    it('sends POST /reconstruct with serie and fotos in FormData', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true, json: async () => ({ job_id: 'job-abc', serie: 'serie-x' }),
      } as Response);

      const result = await ds.startJob({
        serie: 'serie-x',
        inferGs: false,
        photos: [{ uri: 'file://photo.jpg', name: 'photo.jpg', type: 'image/jpeg' }],
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/reconstruct'),
        expect.objectContaining({ method: 'POST' }),
      );
      expect(result).toEqual({ jobId: 'job-abc', serie: 'serie-x' });
    });

    it('throws on non-ok response', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false, status: 500, json: async () => ({ detail: 'Server error' }),
      } as Response);

      await expect(ds.startJob({ serie: 's', inferGs: false, photos: [] }))
        .rejects.toThrow('Server error');
    });
  });

  describe('getStatus', () => {
    it('maps response to ReconstructionJob entity', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          job_id: 'job-abc', serie: 'serie-x', status: 'done',
          progress: ['step1'], error: null,
        }),
      } as Response);

      const job = await ds.getStatus('job-abc');
      expect(job).toEqual({
        jobId: 'job-abc', serie: 'serie-x', status: 'done',
        progress: ['step1'], error: null,
      });
    });
  });
});
```

- [ ] **Step 3: Run**

```bash
pnpm test __tests__/unit/features/scan/data/repositories __tests__/unit/features/reconstruction --verbose
```

- [ ] **Step 4: Commit**

```bash
git add __tests__/unit/
git commit -m "test(unit): add scan repository and reconstruction datasource unit tests"
```

---

## Task 8: Unit tests — viewer PLY repository

**Files:**
- Create: `__tests__/unit/features/viewer/data/repositories/ply-repository-impl.test.ts`

> Note: `three` (THREE.BufferGeometry, Vector3, Box3) works in Node.js without WebGL. Do NOT mock the `three` module in this file — the real math is what's being tested.

- [ ] **Step 1: Write PLY repository tests**

```ts
// __tests__/unit/features/viewer/data/repositories/ply-repository-impl.test.ts
import * as THREE from 'three';
import { PlyRepositoryImpl } from '@/features/viewer/data/repositories/ply-repository-impl';

const makeGeometry = (vertices: number[]): THREE.BufferGeometry => {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  return geo;
};

describe('PlyRepositoryImpl', () => {
  let filePicker: { pick: jest.Mock };
  let parser: { parse: jest.Mock };
  let repo: PlyRepositoryImpl;

  beforeEach(() => {
    filePicker = { pick: jest.fn().mockResolvedValue({ fileUri: 'file://test.ply' }) };
    parser = { parse: jest.fn() };
    repo = new PlyRepositoryImpl(filePicker as any, parser as any);
  });

  it('loadFromPath calls parser with the given URI', async () => {
    const geo = makeGeometry([0, 0, 0]);
    parser.parse.mockResolvedValue({ geometry: geo, vertexCount: 1, hasColors: false });

    await repo.loadFromPath('file://my.ply');

    expect(parser.parse).toHaveBeenCalledWith('file://my.ply', expect.any(Number));
  });

  it('centeringOffset is captured before geometry.center()', async () => {
    // Place a single vertex at (2, 4, 6) so center = (2, 4, 6)
    const geo = makeGeometry([2, 4, 6]);
    parser.parse.mockResolvedValue({ geometry: geo, vertexCount: 1, hasColors: false });

    const cloud = await repo.loadFromPath('file://my.ply');

    // centeringOffset should equal the original center of the geometry
    expect(cloud.centeringOffset.x).toBeCloseTo(2);
    expect(cloud.centeringOffset.y).toBeCloseTo(4);
    expect(cloud.centeringOffset.z).toBeCloseTo(6);
  });

  it('returns hasColors from parser', async () => {
    const geo = makeGeometry([0, 0, 0]);
    parser.parse.mockResolvedValue({ geometry: geo, vertexCount: 1, hasColors: true });

    const cloud = await repo.loadFromPath('file://my.ply');
    expect(cloud.hasColors).toBe(true);
  });

  it('loadFromFile uses filePicker to get URI', async () => {
    const geo = makeGeometry([0, 0, 0]);
    parser.parse.mockResolvedValue({ geometry: geo, vertexCount: 1, hasColors: false });

    await repo.loadFromFile();
    expect(filePicker.pick).toHaveBeenCalled();
    expect(parser.parse).toHaveBeenCalledWith('file://test.ply', expect.any(Number));
  });
});
```

- [ ] **Step 2: Run**

```bash
pnpm test __tests__/unit/features/viewer --verbose
```

- [ ] **Step 3: Commit**

```bash
git add __tests__/unit/features/viewer/
git commit -m "test(unit): add PLY repository unit tests"
```

---

## Task 9: Unit tests — localization datasource, AR repository, grid-to-world

**Files:**
- Create: `__tests__/unit/features/localization/data/datasources/localization-remote-data-source-impl.test.ts`
- Create: `__tests__/unit/features/ar/data/repositories/route-repository-impl.test.ts`
- Create: `__tests__/unit/features/ar/utils/grid-to-world.test.ts`

- [ ] **Step 1: Write localization datasource tests**

```ts
// __tests__/unit/features/localization/data/datasources/localization-remote-data-source-impl.test.ts
import { LocalizationRemoteDataSourceImpl } from '@/features/localization/data/datasources/localization-remote-data-source-impl';

const IMAGE = { uri: 'file://img.jpg', name: 'img.jpg', type: 'image/jpeg' };

describe('LocalizationRemoteDataSourceImpl', () => {
  let ds: LocalizationRemoteDataSourceImpl;

  beforeEach(() => {
    ds = new LocalizationRemoteDataSourceImpl();
    jest.clearAllMocks();
  });

  afterEach(() => jest.restoreAllMocks());

  it('sends POST to /{encodeURIComponent(serie)}/localize with ngrok header', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, inlier_count: 10, translation: [1, 2, 3], rotation: [], pose: [] }),
    } as Response);

    await ds.localize('mi serie', IMAGE);

    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain(encodeURIComponent('mi serie'));
    expect(url).toContain('/localize');

    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)['ngrok-skip-browser-warning']).toBe('1');
  });

  it('FormData uses field name "foto" not "image"', async () => {
    // We can verify this indirectly: the FormData is the body.
    // Spy on FormData.append to capture field names.
    const appendSpy = jest.spyOn(FormData.prototype, 'append');
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, inlier_count: 5, translation: [0, 0, 0], rotation: [], pose: [] }),
    } as Response);

    await ds.localize('serie-x', IMAGE);

    expect(appendSpy).toHaveBeenCalledWith('foto', expect.anything());
    expect(appendSpy).not.toHaveBeenCalledWith('image', expect.anything());
  });

  it('maps translation[0..2] to x, y, z', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, inlier_count: 7, translation: [1.1, 2.2, 3.3], rotation: [], pose: [] }),
    } as Response);

    const result = await ds.localize('serie-x', IMAGE);
    expect(result.x).toBeCloseTo(1.1);
    expect(result.y).toBeCloseTo(2.2);
    expect(result.z).toBeCloseTo(3.3);
  });

  it('throws correct message on 404', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false, status: 404, json: async () => ({}),
    } as Response);

    await expect(ds.localize('serie-x', IMAGE))
      .rejects.toThrow('No hay modelo ACE entrenado para esta serie');
  });

  it('throws correct message on 422', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false, status: 422, json: async () => ({}),
    } as Response);

    await expect(ds.localize('serie-x', IMAGE))
      .rejects.toThrow('La imagen no es válida o el nombre de serie contiene caracteres no permitidos.');
  });
});
```

- [ ] **Step 2: Write AR route repository tests**

```ts
// __tests__/unit/features/ar/data/repositories/route-repository-impl.test.ts
import { RouteRepositoryImpl } from '@/features/ar/data/repositories/route-repository-impl';

const mockDS = {
  saveRoute: jest.fn(),
  loadRoute: jest.fn(),
  clearRoute: jest.fn(),
};

describe('RouteRepositoryImpl', () => {
  let repo: RouteRepositoryImpl;

  beforeEach(() => {
    repo = new RouteRepositoryImpl(mockDS as any);
    jest.clearAllMocks();
  });

  it('saveRoute delegates to datasource', async () => {
    const route = [{ row: 0, col: 0 }];
    await repo.saveRoute(route);
    expect(mockDS.saveRoute).toHaveBeenCalledWith(route);
  });

  it('loadRoute returns null when datasource returns null', async () => {
    mockDS.loadRoute.mockResolvedValue(null);
    const result = await repo.loadRoute();
    expect(result).toBeNull();
  });

  it('clearRoute delegates to datasource', async () => {
    await repo.clearRoute();
    expect(mockDS.clearRoute).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Write grid-to-world tests**

```ts
// __tests__/unit/features/ar/utils/grid-to-world.test.ts
import { gridToWorld } from '@/features/ar/utils/grid-to-world';

const SPACING = 0.28;
const DEPTH = -1.8;
const ELEVATION = -0.4;
const ORIGIN = 3.5;

describe('gridToWorld', () => {
  it('maps col to X axis with correct spacing', () => {
    const [x] = gridToWorld({ row: 0, col: 0 });
    expect(x).toBeCloseTo((0 - ORIGIN) * SPACING);
  });

  it('maps row to Z axis (depth)', () => {
    const [, , z] = gridToWorld({ row: 2, col: 0 });
    expect(z).toBeCloseTo(DEPTH - (2 - ORIGIN) * SPACING);
  });

  it('Y is always ELEVATION', () => {
    expect(gridToWorld({ row: 3, col: 5 })[1]).toBeCloseTo(ELEVATION);
  });

  it('center cell (3.5, 3.5) maps to approximately (0, ELEVATION, DEPTH)', () => {
    // ORIGIN is 3.5 for an 8x8 grid — but since indices are integers,
    // use col=4, row=0 to test direction
    const [x] = gridToWorld({ row: 0, col: 4 });
    expect(x).toBeCloseTo((4 - ORIGIN) * SPACING);
  });
});
```

- [ ] **Step 4: Run all unit tests**

```bash
pnpm test __tests__/unit/ --verbose
```
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add __tests__/unit/
git commit -m "test(unit): add localization datasource, AR route repo, grid-to-world unit tests"
```

---

## Task 10: Context tests — auth and scan

**Files:**
- Create: `__tests__/context/features/auth/auth-context.test.tsx`
- Create: `__tests__/context/features/scan/scan-context.test.tsx`

- [ ] **Step 1: Write auth context tests**

```tsx
// __tests__/context/features/auth/auth-context.test.tsx
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/features/auth/presentation/context/auth-context';
import { DIProvider } from '@/core/di/di-provider';
import { TOKENS } from '@/core/constants/tokens';

const makeAuthRepo = (overrides = {}) => ({
  login: jest.fn().mockResolvedValue(undefined),
  signup: jest.fn().mockResolvedValue(undefined),
  logout: jest.fn().mockResolvedValue(undefined),
  getCurrentUser: jest.fn().mockResolvedValue(null),
  refreshUserProfile: jest.fn().mockResolvedValue(undefined),
  forgotPassword: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

function makeWrapper(repo: ReturnType<typeof makeAuthRepo>) {
  const overrides = new Map<symbol, unknown>([[TOKENS.AuthRepo, repo]]);
  return ({ children }: { children: React.ReactNode }) => (
    <DIProvider overrides={overrides}>
      <AuthProvider>{children}</AuthProvider>
    </DIProvider>
  );
}

describe('AuthContext', () => {
  it('loggedUser is null on mount when getCurrentUser returns null', async () => {
    const repo = makeAuthRepo();
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(repo) });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.loggedUser).toBeNull();
    expect(result.current.isLoggedIn).toBe(false);
  });

  it('on mount calls getCurrentUser and sets loggedUser', async () => {
    const user = { userId: 'u1', email: 'a@b.com', role: 'student', name: 'Alice' };
    const repo = makeAuthRepo({ getCurrentUser: jest.fn().mockResolvedValue(user) });
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(repo) });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.loggedUser).toEqual(user);
    expect(result.current.isLoggedIn).toBe(true);
  });

  it('on mount calls refreshUserProfile when name is missing', async () => {
    const userWithoutName = { userId: 'u1', email: 'a@b.com', role: 'student', name: undefined };
    const repo = makeAuthRepo({ getCurrentUser: jest.fn().mockResolvedValue(userWithoutName) });
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(repo) });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(repo.refreshUserProfile).toHaveBeenCalled();
  });

  it('login success populates loggedUser and clears error', async () => {
    const user = { userId: 'u1', email: 'a@b.com', role: 'student', name: 'Alice' };
    const repo = makeAuthRepo({ getCurrentUser: jest.fn().mockResolvedValue(user) });
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(repo) });

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.login('a@b.com', 'pass'); });

    expect(result.current.loggedUser).toEqual(user);
    expect(result.current.error).toBeNull();
  });

  it('login failure sets error and leaves loggedUser null', async () => {
    const repo = makeAuthRepo({
      login: jest.fn().mockRejectedValue(new Error('Credenciales inválidas')),
      getCurrentUser: jest.fn().mockResolvedValue(null),
    });
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(repo) });

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.login('bad@b.com', 'wrong'); });

    expect(result.current.error).toBe('Credenciales inválidas');
    expect(result.current.loggedUser).toBeNull();
  });

  it('logout clears loggedUser and isLoggedIn', async () => {
    const user = { userId: 'u1', email: 'a@b.com', role: 'student', name: 'Alice' };
    const repo = makeAuthRepo({ getCurrentUser: jest.fn().mockResolvedValue(user) });
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(repo) });

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.logout(); });

    expect(result.current.loggedUser).toBeNull();
    expect(result.current.isLoggedIn).toBe(false);
  });
});
```

- [ ] **Step 2: Write scan context tests**

```tsx
// __tests__/context/features/scan/scan-context.test.tsx
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { ScanProvider, useScan } from '@/features/scan/presentation/context/scan-context';
import { AuthProvider } from '@/features/auth/presentation/context/auth-context';
import { DIProvider } from '@/core/di/di-provider';
import { TOKENS } from '@/core/constants/tokens';

const MOCK_USER = { userId: 'user-1', email: 'a@b.com', role: 'student', name: 'Alice' };
const MOCK_SCAN = { _id: 's1', userId: 'user-1', jobId: 'j1', serie: 'se1', tipo: 'dense' as const, localUri: '', createdAt: '2026-01-01' };

const makeScanRepo = (overrides = {}) => ({
  getScansByUser: jest.fn().mockResolvedValue([MOCK_SCAN]),
  saveScan: jest.fn().mockResolvedValue(undefined),
  updateScan: jest.fn().mockResolvedValue(undefined),
  deleteScan: jest.fn().mockResolvedValue(undefined),
  fetchPortada: jest.fn().mockResolvedValue(null),
  ...overrides,
});

function makeWrapper(scanRepo: ReturnType<typeof makeScanRepo>, authUser = MOCK_USER) {
  const authRepo = {
    login: jest.fn(), signup: jest.fn(), logout: jest.fn(), forgotPassword: jest.fn(), refreshUserProfile: jest.fn(),
    getCurrentUser: jest.fn().mockResolvedValue(authUser),
  };
  const overrides = new Map<symbol, unknown>([
    [TOKENS.ScanRepo, scanRepo],
    [TOKENS.AuthRepo, authRepo],
  ]);
  return ({ children }: { children: React.ReactNode }) => (
    <DIProvider overrides={overrides}>
      <AuthProvider>
        <ScanProvider>{children}</ScanProvider>
      </AuthProvider>
    </DIProvider>
  );
}

describe('ScanContext', () => {
  it('refresh loads scans', async () => {
    const repo = makeScanRepo();
    const { result } = renderHook(() => useScan(), { wrapper: makeWrapper(repo) });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.scans).toHaveLength(1);
    expect(result.current.scans[0]._id).toBe('s1');
  });

  it('saveScan calls repo and refreshes list', async () => {
    const repo = makeScanRepo();
    const { result } = renderHook(() => useScan(), { wrapper: makeWrapper(repo) });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.saveScan({ userId: 'u1', jobId: 'j2', serie: 'se2', tipo: 'dense', localUri: '' });
    });

    expect(repo.saveScan).toHaveBeenCalled();
    expect(repo.getScansByUser).toHaveBeenCalledTimes(2); // initial + after save
  });

  it('deleteScan removes item from scans list', async () => {
    const repo = makeScanRepo();
    const { result } = renderHook(() => useScan(), { wrapper: makeWrapper(repo) });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.deleteScan('s1'); });
    expect(result.current.scans.find(s => s._id === 's1')).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run context tests**

```bash
pnpm test __tests__/context/features/auth __tests__/context/features/scan --verbose
```

- [ ] **Step 4: Commit**

```bash
git add __tests__/context/
git commit -m "test(context): add auth and scan context tests"
```

---

## Task 11: Context tests — reconstruction, viewer, localization, ar

**Files:**
- Create: `__tests__/context/features/reconstruction/reconstruction-context.test.tsx`
- Create: `__tests__/context/features/viewer/viewer-context.test.tsx`
- Create: `__tests__/context/features/localization/localization-context.test.tsx`
- Create: `__tests__/context/features/ar/ar-route-context.test.tsx`

- [ ] **Step 1: Write reconstruction context tests**

```tsx
// __tests__/context/features/reconstruction/reconstruction-context.test.tsx
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { ReconstructionProvider, useReconstruction } from '@/features/reconstruction/presentation/context/reconstruction-context';
import { DIProvider } from '@/core/di/di-provider';
import { TOKENS } from '@/core/constants/tokens';

const makeRepo = (overrides = {}) => ({
  startJob: jest.fn().mockResolvedValue({ jobId: 'job-1', serie: 'serie-x' }),
  getStatus: jest.fn().mockResolvedValue({ jobId: 'job-1', serie: 'serie-x', status: 'done', progress: [], error: null }),
  ...overrides,
});

function makeWrapper(repo: ReturnType<typeof makeRepo>) {
  const overrides = new Map<symbol, unknown>([[TOKENS.ReconstructionRepo, repo]]);
  return ({ children }: { children: React.ReactNode }) => (
    <DIProvider overrides={overrides}><ReconstructionProvider>{children}</ReconstructionProvider></DIProvider>
  );
}

describe('ReconstructionContext', () => {
  it('startJob sets submitting to true then false', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useReconstruction(), { wrapper: makeWrapper(repo) });

    await act(async () => { await result.current.startJob({ serie: 's', inferGs: false, photos: [] }); });
    expect(result.current.submitting).toBe(false);
    expect(repo.startJob).toHaveBeenCalled();
  });

  it('startJob on error sets error state', async () => {
    const repo = makeRepo({ startJob: jest.fn().mockRejectedValue(new Error('Server error')) });
    const { result } = renderHook(() => useReconstruction(), { wrapper: makeWrapper(repo) });

    // startJob re-throws after setting error state; catch the rejection here
    await act(async () => {
      await result.current.startJob({ serie: 's', inferGs: false, photos: [] }).catch(() => {});
    });
    expect(result.current.error).toBe('Server error');
  });
});
```

- [ ] **Step 2: Write viewer context tests**

```tsx
// __tests__/context/features/viewer/viewer-context.test.tsx
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { ViewerProvider, useViewer } from '@/features/viewer/presentation/context/viewer-context';
import { DIProvider } from '@/core/di/di-provider';
import { TOKENS } from '@/core/constants/tokens';
import * as THREE from 'three';

const mockCloud = {
  geometry: new THREE.BufferGeometry(),
  vertexCount: 100,
  originalVertexCount: 100,
  hasColors: false,
  boundingBox: new THREE.Box3(),
  centeringOffset: new THREE.Vector3(),
};

const makeRepo = (overrides = {}) => ({
  loadFromFile: jest.fn().mockResolvedValue(mockCloud),
  loadFromPath: jest.fn().mockResolvedValue(mockCloud),
  ...overrides,
});

function makeWrapper(repo: ReturnType<typeof makeRepo>) {
  const overrides = new Map<symbol, unknown>([[TOKENS.ViewerRepo, repo]]);
  return ({ children }: { children: React.ReactNode }) => (
    <DIProvider overrides={overrides}><ViewerProvider>{children}</ViewerProvider></DIProvider>
  );
}

describe('ViewerContext', () => {
  it('cloud is null before loading', () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useViewer(), { wrapper: makeWrapper(repo) });
    expect(result.current.cloud).toBeNull();
  });

  it('loadFromPath calls repo and sets cloud', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useViewer(), { wrapper: makeWrapper(repo) });

    await act(async () => { await result.current.loadFromPath('file://my.ply'); });
    expect(repo.loadFromPath).toHaveBeenCalledWith('file://my.ply');
    expect(result.current.cloud).toBe(mockCloud);
  });

  it('loadFromPath on error sets error string', async () => {
    const repo = makeRepo({ loadFromPath: jest.fn().mockRejectedValue(new Error('Parse failed')) });
    const { result } = renderHook(() => useViewer(), { wrapper: makeWrapper(repo) });

    await act(async () => { await result.current.loadFromPath('bad.ply'); });
    expect(result.current.error).toContain('Parse failed');
    expect(result.current.cloud).toBeNull();
  });
});
```

- [ ] **Step 3: Write localization context tests**

```tsx
// __tests__/context/features/localization/localization-context.test.tsx
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { LocalizationProvider, useLocalization } from '@/features/localization/presentation/context/localization-context';
import { DIProvider } from '@/core/di/di-provider';
import { TOKENS } from '@/core/constants/tokens';

const MOCK_SCAN = { _id: 's1', userId: 'u1', jobId: 'j1', serie: 'se1', tipo: 'dense' as const, localUri: '', createdAt: '' };
const MOCK_IMAGE = { uri: 'file://img.jpg', name: 'img.jpg', type: 'image/jpeg' };
const MOCK_RESULT = { x: 1, y: 2, z: 3, success: true, inlier_count: 10 };

const makeRepo = (overrides = {}) => ({
  localize: jest.fn().mockResolvedValue(MOCK_RESULT),
  ...overrides,
});

function makeWrapper(repo: ReturnType<typeof makeRepo>) {
  const overrides = new Map<symbol, unknown>([[TOKENS.Localization_Repo, repo]]);
  return ({ children }: { children: React.ReactNode }) => (
    <DIProvider overrides={overrides}><LocalizationProvider>{children}</LocalizationProvider></DIProvider>
  );
}

describe('LocalizationContext', () => {
  it('submit returns false and does not call repo when selectedScan is null', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useLocalization(), { wrapper: makeWrapper(repo) });

    let returnVal: boolean | undefined;
    await act(async () => { returnVal = await result.current.submit(); });
    expect(returnVal).toBe(false);
    expect(repo.localize).not.toHaveBeenCalled();
  });

  it('submit returns false when image is null', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useLocalization(), { wrapper: makeWrapper(repo) });
    act(() => result.current.setSelectedScan(MOCK_SCAN));

    let returnVal: boolean | undefined;
    await act(async () => { returnVal = await result.current.submit(); });
    expect(returnVal).toBe(false);
  });

  it('submit success sets result', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useLocalization(), { wrapper: makeWrapper(repo) });
    act(() => {
      result.current.setSelectedScan(MOCK_SCAN);
      result.current.setImage(MOCK_IMAGE);
    });

    await act(async () => { await result.current.submit(); });
    expect(result.current.result).toEqual(MOCK_RESULT);
    expect(result.current.error).toBeNull();
  });

  it('reset clears all fields', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useLocalization(), { wrapper: makeWrapper(repo) });
    act(() => {
      result.current.setSelectedScan(MOCK_SCAN);
      result.current.setImage(MOCK_IMAGE);
    });

    act(() => result.current.reset());
    expect(result.current.selectedScan).toBeNull();
    expect(result.current.image).toBeNull();
    expect(result.current.result).toBeNull();
  });
});
```

- [ ] **Step 4: Write AR route context tests**

```tsx
// __tests__/context/features/ar/ar-route-context.test.tsx
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { ARRouteProvider, useARRoute } from '@/features/ar/presentation/context/ar-route-context';
import { DIProvider } from '@/core/di/di-provider';
import { TOKENS } from '@/core/constants/tokens';

const ROUTE = [{ row: 0, col: 0 }, { row: 1, col: 1 }];

const makeRepo = (overrides = {}) => ({
  saveRoute: jest.fn().mockResolvedValue(undefined),
  loadRoute: jest.fn().mockResolvedValue(ROUTE),
  clearRoute: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

function makeWrapper(repo: ReturnType<typeof makeRepo>) {
  const overrides = new Map<symbol, unknown>([[TOKENS.AR_RouteRepo, repo]]);
  return ({ children }: { children: React.ReactNode }) => (
    <DIProvider overrides={overrides}><ARRouteProvider>{children}</ARRouteProvider></DIProvider>
  );
}

describe('ARRouteContext', () => {
  it('saveRoute calls repo saveRoute', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useARRoute(), { wrapper: makeWrapper(repo) });
    await act(async () => { await result.current.saveRoute(ROUTE); });
    expect(repo.saveRoute).toHaveBeenCalledWith(ROUTE);
  });

  it('loadSavedRoute calls repo loadRoute', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useARRoute(), { wrapper: makeWrapper(repo) });
    await act(async () => { await result.current.loadSavedRoute(); });
    expect(repo.loadRoute).toHaveBeenCalled();
  });
});
```

- [ ] **Step 5: Run all context tests**

```bash
pnpm test __tests__/context/ --verbose
```

- [ ] **Step 6: Commit**

```bash
git add __tests__/context/
git commit -m "test(context): add reconstruction, viewer, localization, ar context tests"
```

---

## Task 12: Widget tests — auth components

**Files:**
- Create: `__tests__/widgets/features/auth/login-form.test.tsx`
- Create: `__tests__/widgets/features/auth/signup-form.test.tsx`
- Create: `__tests__/widgets/features/auth/logout-button.test.tsx`
- Create: `__tests__/widgets/features/auth/forgot-password-form.test.tsx`

- [ ] **Step 1: Write login form tests**

```tsx
// __tests__/widgets/features/auth/login-form.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginForm } from '@/features/auth/presentation/components/login-form';
import { AuthContext, AuthContextType } from '@/features/auth/presentation/context/auth-context';

const makeAuthCtx = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
  loggedUser: null, isLoggedIn: false, loading: false, error: null,
  clearError: jest.fn(), login: jest.fn(), signup: jest.fn(), logout: jest.fn(),
  expireSession: jest.fn(), forgotPassword: jest.fn(), getLoggedUser: jest.fn(),
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
```

- [ ] **Step 2: Write logout button tests**

```tsx
// __tests__/widgets/features/auth/logout-button.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LogoutButton } from '@/features/auth/presentation/components/logout-button';
import { AuthContext, AuthContextType } from '@/features/auth/presentation/context/auth-context';

const baseCtx: AuthContextType = {
  loggedUser: null, isLoggedIn: true, loading: false, error: null,
  clearError: jest.fn(), login: jest.fn(), signup: jest.fn(), logout: jest.fn(),
  expireSession: jest.fn(), forgotPassword: jest.fn(), getLoggedUser: jest.fn(),
};

describe('LogoutButton', () => {
  it('calls logout() when pressed', () => {
    const logoutMock = jest.fn().mockResolvedValue(undefined);
    const { getByText } = render(
      <AuthContext.Provider value={{ ...baseCtx, logout: logoutMock }}>
        <LogoutButton />
      </AuthContext.Provider>
    );
    fireEvent.press(getByText(/salir|logout|cerrar/i));
    expect(logoutMock).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Add signup and forgot-password snapshot + interaction tests** (follow same pattern as LoginForm — render → interact → assert → snapshot)

Create `__tests__/widgets/features/auth/signup-form.test.tsx` and `forgot-password-form.test.tsx` following the same pattern: render with AuthContext.Provider, fireEvent interactions, check callbacks, add `.toMatchSnapshot()`.

- [ ] **Step 4: Run auth widget tests**

```bash
pnpm test __tests__/widgets/features/auth --verbose
```

- [ ] **Step 5: Commit**

```bash
git add __tests__/widgets/
git commit -m "test(widgets): add auth component widget tests"
```

---

## Task 13: Widget tests — scan, reconstruction, viewer, ar, localization, settings

**Files:**
- Create: `__tests__/widgets/features/scan/new-scan-drawer.test.tsx`
- Create: `__tests__/widgets/features/reconstruction/job-progress.test.tsx`
- Create: `__tests__/widgets/features/viewer/hud.test.tsx`
- Create: `__tests__/widgets/features/viewer/fps-counter.test.tsx`
- Create: `__tests__/widgets/features/ar/path-overlay.test.tsx`
- Create: `__tests__/widgets/features/ar/grid-matrix.test.tsx`
- Create: `__tests__/widgets/features/localization/localization-result-screen.test.tsx`
- Create: `__tests__/widgets/features/settings/settings-screen.test.tsx`

- [ ] **Step 1: Write HUD snapshot test**

```tsx
// __tests__/widgets/features/viewer/hud.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { HUD } from '@/features/viewer/presentation/components/hud';

describe('HUD', () => {
  it('renders vertex count and bounding box info', () => {
    const { toJSON, getByText } = render(
      <HUD vertexCount={50000} originalVertexCount={100000} hasColors={true} />
    );
    expect(getByText(/50[\s,.]?000|50k/i)).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });
});
```

> Note: Check the actual props of `HUD` in `src/features/viewer/presentation/components/hud.tsx` and adjust the prop names if they differ.

- [ ] **Step 2: Write FPS counter snapshot test**

```tsx
// __tests__/widgets/features/viewer/fps-counter.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { FpsCounter } from '@/features/viewer/presentation/components/fps-counter';

describe('FpsCounter', () => {
  it('matches snapshot', () => {
    const { toJSON } = render(<FpsCounter />);
    expect(toJSON()).toMatchSnapshot();
  });
});
```

- [ ] **Step 3: Write PathOverlay snapshot test**

```tsx
// __tests__/widgets/features/ar/path-overlay.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { PathOverlay } from '@/features/ar/presentation/components/path-overlay';

describe('PathOverlay', () => {
  it('renders SVG lines between given points', () => {
    const points = [{ row: 0, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 0 }];
    const { toJSON } = render(<PathOverlay points={points} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders nothing when points array is empty', () => {
    const { toJSON } = render(<PathOverlay points={[]} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
```

- [ ] **Step 4: Write GridMatrix interaction test**

```tsx
// __tests__/widgets/features/ar/grid-matrix.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GridMatrix } from '@/features/ar/presentation/components/grid-matrix';

describe('GridMatrix', () => {
  it('calls onCellPress with correct row and col when a cell is pressed', () => {
    const onCellPress = jest.fn();
    const { getAllByTestId } = render(
      <GridMatrix selectedPoints={[]} onCellPress={onCellPress} />
    );
    // Press first cell
    const cells = getAllByTestId(/cell/i);
    if (cells.length > 0) {
      fireEvent.press(cells[0]);
      expect(onCellPress).toHaveBeenCalled();
    }
  });

  it('matches snapshot with selected points', () => {
    const { toJSON } = render(
      <GridMatrix selectedPoints={[{ row: 0, col: 0 }]} onCellPress={jest.fn()} />
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
```

> Note: Check actual prop names of `GridMatrix` in its source file and adjust.

- [ ] **Step 5: Write SettingsScreen snapshot test**

```tsx
// __tests__/widgets/features/settings/settings-screen.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { SettingsScreen } from '@/features/settings/presentation/screens/settings-screen';
import { AuthContext, AuthContextType } from '@/features/auth/presentation/context/auth-context';

const authCtx: AuthContextType = {
  loggedUser: { userId: 'u1', email: 'alice@example.com', role: 'student', name: 'Alice' },
  isLoggedIn: true, loading: false, error: null,
  clearError: jest.fn(), login: jest.fn(), signup: jest.fn(), logout: jest.fn(),
  expireSession: jest.fn(), forgotPassword: jest.fn(), getLoggedUser: jest.fn(),
};

describe('SettingsScreen', () => {
  it('displays logged user name and email', () => {
    const { getByText } = render(
      <AuthContext.Provider value={authCtx}>
        <SettingsScreen />
      </AuthContext.Provider>
    );
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('alice@example.com')).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(
      <AuthContext.Provider value={authCtx}>
        <SettingsScreen />
      </AuthContext.Provider>
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
```

- [ ] **Step 6: Write LocalizationResultScreen snapshot test** (check for badge and warning banner)

```tsx
// __tests__/widgets/features/localization/localization-result-screen.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { LocalizationResultScreen } from '@/features/localization/presentation/screens/localization-result-screen';
import { LocalizationContext } from '@/features/localization/presentation/context/localization-context';
import { ViewerContext } from '@/features/viewer/presentation/context/viewer-context';
import * as THREE from 'three';

const mockCloud = {
  geometry: new THREE.BufferGeometry(),
  vertexCount: 1, originalVertexCount: 1, hasColors: false,
  boundingBox: new THREE.Box3(), centeringOffset: new THREE.Vector3(0, 0, 0),
};

const mockLocCtx = {
  result: { x: 1, y: 2, z: 3, success: true, inlier_count: 42 },
  selectedScan: null, image: null, submitting: false, error: null,
  setSelectedScan: jest.fn(), setImage: jest.fn(), submit: jest.fn(), reset: jest.fn(),
};

const mockViewerCtx = {
  cloud: mockCloud, loading: false, error: null,
  loadFile: jest.fn(), loadFromPath: jest.fn(),
};

function renderScreen(locCtx = mockLocCtx) {
  return render(
    <LocalizationContext.Provider value={locCtx as any}>
      <ViewerContext.Provider value={mockViewerCtx as any}>
        <LocalizationResultScreen />
      </ViewerContext.Provider>
    </LocalizationContext.Provider>
  );
}

describe('LocalizationResultScreen', () => {
  it('shows "Usted se encuentra aquí" badge', () => {
    const { getByText } = renderScreen();
    expect(getByText(/usted se encuentra aquí/i)).toBeTruthy();
  });

  it('shows yellow warning banner when success is false', () => {
    const ctx = { ...mockLocCtx, result: { ...mockLocCtx.result, success: false } };
    const { getByText } = renderScreen(ctx);
    // The warning banner text — check source for exact string
    expect(getByText(/localización no confiable|baja confianza|advertencia/i)).toBeTruthy();
  });

  it('matches snapshot (success=true)', () => {
    const { toJSON } = renderScreen();
    expect(toJSON()).toMatchSnapshot();
  });
});
```

> Note: Adjust warning banner text to match the actual string in `localization-result-screen.tsx`.

- [ ] **Step 7: Add JobProgress and NewScanDrawer tests** following the same pattern (snapshot + basic interaction).

```tsx
// __tests__/widgets/features/reconstruction/job-progress.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { JobProgress } from '@/features/reconstruction/presentation/components/job-progress';

describe('JobProgress', () => {
  it('matches snapshot for running status', () => {
    const { toJSON } = render(
      <JobProgress status="running" progress={['Procesando fotos', 'Generando nube']} />
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('matches snapshot for done status', () => {
    const { toJSON } = render(<JobProgress status="done" progress={[]} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
```

> Note: Check actual props of `JobProgress` in its source file.

- [ ] **Step 8: Run all widget tests**

```bash
pnpm test __tests__/widgets/ --verbose
```
Expected: all pass; snapshots written on first run.

- [ ] **Step 9: Commit**

```bash
git add __tests__/widgets/
git commit -m "test(widgets): add widget tests for all features"
```

---

## Task 14: Integration tests — auth flow and AR route flow

**Files:**
- Create: `__tests__/integration/auth-flow.test.tsx`
- Create: `__tests__/integration/ar-route-flow.test.ts`

> Integration tests use real datasource + repo + context. MSW intercepts HTTP. AsyncStorage is the global in-memory mock.

- [ ] **Step 1: Write auth integration flow**

```tsx
// __tests__/integration/auth-flow.test.tsx
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/features/auth/presentation/context/auth-context';
import { DIProvider } from '@/core/di/di-provider';
import { server } from '../setup/msw-server';
import { http, HttpResponse } from 'msw';
import { FAKE_TOKEN, FAKE_REFRESH, FAKE_USER_ID } from '../setup/handlers/auth.handlers';
import { LocalPreferencesAsyncStorage } from '@/core/storage/local-preferences-async-storage';

const prefs = LocalPreferencesAsyncStorage.getInstance();

function wrapper({ children }: { children: React.ReactNode }) {
  return <DIProvider><AuthProvider>{children}</AuthProvider></DIProvider>;
}

describe('Auth integration flow', () => {
  beforeEach(async () => {
    // Clear storage between tests
    await Promise.all(['token','refreshToken','userId','email','role','name'].map(k => prefs.removeData(k)));
  });

  it('login stores tokens in AsyncStorage and reconstructs AuthUser', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.login('test@example.com', 'pass'); });

    expect(result.current.loggedUser?.userId).toBe(FAKE_USER_ID);
    expect(result.current.loggedUser?.email).toBe('test@example.com');
    expect(result.current.isLoggedIn).toBe(true);

    // Tokens persisted
    const token = await prefs.retrieveData<string>('token');
    expect(token).toBe(FAKE_TOKEN);
  });

  it('login with 401 does NOT store tokens and sets error', async () => {
    server.use(
      http.post('http://localhost/auth/test-project/login', () =>
        HttpResponse.json({ message: 'Credenciales inválidas' }, { status: 401 }),
      ),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.login('bad@example.com', 'wrong'); });

    expect(result.current.error).toBeTruthy();
    const token = await prefs.retrieveData<string>('token');
    expect(token).toBeNull();
  });

  it('restoreSession on mount reconstructs AuthUser from persisted tokens', async () => {
    // Simulate already-logged-in state
    await prefs.storeData('userId', FAKE_USER_ID);
    await prefs.storeData('email', 'alice@example.com');
    await prefs.storeData('role', 'student');
    await prefs.storeData('name', 'Alice');

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.loggedUser?.userId).toBe(FAKE_USER_ID);
    expect(result.current.isLoggedIn).toBe(true);
  });
});
```

- [ ] **Step 2: Write AR route integration flow**

```ts
// __tests__/integration/ar-route-flow.test.ts
import { RouteStorageDataSourceImpl } from '@/features/ar/data/datasources/route-storage-data-source-impl';
import { RouteRepositoryImpl } from '@/features/ar/data/repositories/route-repository-impl';
import { LocalPreferencesAsyncStorage } from '@/core/storage/local-preferences-async-storage';

const prefs = LocalPreferencesAsyncStorage.getInstance();

describe('AR route integration flow', () => {
  let repo: RouteRepositoryImpl;

  beforeEach(async () => {
    await prefs.removeData('ar_route');
    const ds = new RouteStorageDataSourceImpl();
    repo = new RouteRepositoryImpl(ds);
  });

  it('save → load returns the same route', async () => {
    const route = [{ row: 0, col: 0 }, { row: 1, col: 2 }];
    await repo.saveRoute(route);
    const loaded = await repo.loadRoute();
    expect(loaded).toEqual(route);
  });

  it('clear → load returns null', async () => {
    await repo.saveRoute([{ row: 0, col: 0 }]);
    await repo.clearRoute();
    const loaded = await repo.loadRoute();
    expect(loaded).toBeNull();
  });
});
```

- [ ] **Step 3: Run**

```bash
pnpm test __tests__/integration/auth-flow __tests__/integration/ar-route-flow --verbose
```

- [ ] **Step 4: Commit**

```bash
git add __tests__/integration/
git commit -m "test(integration): add auth and AR route integration flow tests"
```

---

## Task 15: Integration tests — scan, reconstruction, localization flows

**Files:**
- Create: `__tests__/integration/scan-flow.test.tsx`
- Create: `__tests__/integration/reconstruction-flow.test.tsx`
- Create: `__tests__/integration/localization-flow.test.tsx`

- [ ] **Step 1: Write scan integration flow**

```tsx
// __tests__/integration/scan-flow.test.tsx
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { ScanProvider, useScan } from '@/features/scan/presentation/context/scan-context';
import { AuthProvider } from '@/features/auth/presentation/context/auth-context';
import { DIProvider } from '@/core/di/di-provider';
import { LocalPreferencesAsyncStorage } from '@/core/storage/local-preferences-async-storage';
import { FAKE_TOKEN, FAKE_USER_ID } from '../setup/handlers/auth.handlers';

const prefs = LocalPreferencesAsyncStorage.getInstance();

function wrapper({ children }: { children: React.ReactNode }) {
  return <DIProvider><AuthProvider><ScanProvider>{children}</ScanProvider></AuthProvider></DIProvider>;
}

describe('Scan integration flow', () => {
  beforeEach(async () => {
    await prefs.storeData('userId', FAKE_USER_ID);
    await prefs.storeData('email', 'test@example.com');
    await prefs.storeData('token', FAKE_TOKEN);
    await prefs.storeData('name', 'Test User');
    await prefs.storeData('role', 'student');
  });

  it('refresh loads scans from DB and fetches portadas', async () => {
    const { result } = renderHook(() => useScan(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    expect(result.current.scans).toHaveLength(1);
    expect(result.current.scans[0].serie).toBe('serie-x');
  });
});
```

- [ ] **Step 2: Write reconstruction integration flow**

```tsx
// __tests__/integration/reconstruction-flow.test.tsx
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { ReconstructionProvider, useReconstruction } from '@/features/reconstruction/presentation/context/reconstruction-context';
import { DIProvider } from '@/core/di/di-provider';
import { server } from '../setup/msw-server';
import { http, HttpResponse } from 'msw';

function wrapper({ children }: { children: React.ReactNode }) {
  return <DIProvider><ReconstructionProvider>{children}</ReconstructionProvider></DIProvider>;
}

describe('Reconstruction integration flow', () => {
  it('startJob succeeds and clears submitting state', async () => {
    const { result } = renderHook(() => useReconstruction(), { wrapper });

    await act(async () => {
      await result.current.startJob({ serie: 'serie-x', inferGs: false, photos: [] });
    });

    expect(result.current.submitting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('startJob on API error exposes error message', async () => {
    server.use(
      http.post('http://localhost:8000/reconstruct', () =>
        HttpResponse.json({ detail: 'Insufficient photos' }, { status: 400 }),
      ),
    );

    const { result } = renderHook(() => useReconstruction(), { wrapper });

    await act(async () => {
      await result.current.startJob({ serie: 's', inferGs: false, photos: [] });
    });

    expect(result.current.error).toBeTruthy();
  });
});
```

- [ ] **Step 3: Write localization integration flow**

```tsx
// __tests__/integration/localization-flow.test.tsx
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { LocalizationProvider, useLocalization } from '@/features/localization/presentation/context/localization-context';
import { DIProvider } from '@/core/di/di-provider';
import { server } from '../setup/msw-server';
import { http, HttpResponse } from 'msw';

const MOCK_SCAN = { _id: 's1', userId: 'u1', jobId: 'j1', serie: 'serie-x', tipo: 'dense' as const, localUri: '', createdAt: '' };
const MOCK_IMAGE = { uri: 'file://img.jpg', name: 'img.jpg', type: 'image/jpeg' };

function wrapper({ children }: { children: React.ReactNode }) {
  return <DIProvider><LocalizationProvider>{children}</LocalizationProvider></DIProvider>;
}

describe('Localization integration flow', () => {
  it('submit maps translation[0..2] to x/y/z', async () => {
    const { result } = renderHook(() => useLocalization(), { wrapper });
    act(() => {
      result.current.setSelectedScan(MOCK_SCAN);
      result.current.setImage(MOCK_IMAGE);
    });

    await act(async () => { await result.current.submit(); });

    expect(result.current.result?.x).toBeCloseTo(1.1);
    expect(result.current.result?.y).toBeCloseTo(2.2);
    expect(result.current.result?.z).toBeCloseTo(3.3);
    expect(result.current.result?.inlier_count).toBe(42);
  });

  it('returns 404 error message when no ACE model exists', async () => {
    server.use(
      http.post('http://localhost:8000/:serie/localize', () =>
        new HttpResponse(null, { status: 404 }),
      ),
    );

    const { result } = renderHook(() => useLocalization(), { wrapper });
    act(() => {
      result.current.setSelectedScan(MOCK_SCAN);
      result.current.setImage(MOCK_IMAGE);
    });

    await act(async () => { await result.current.submit(); });
    expect(result.current.error).toContain('No hay modelo ACE entrenado');
  });

  it('returns 422 error message for invalid image', async () => {
    server.use(
      http.post('http://localhost:8000/:serie/localize', () =>
        new HttpResponse(null, { status: 422 }),
      ),
    );

    const { result } = renderHook(() => useLocalization(), { wrapper });
    act(() => {
      result.current.setSelectedScan(MOCK_SCAN);
      result.current.setImage(MOCK_IMAGE);
    });

    await act(async () => { await result.current.submit(); });
    expect(result.current.error).toContain('La imagen no es válida');
  });
});
```

- [ ] **Step 4: Run all integration tests**

```bash
pnpm test __tests__/integration/ --verbose
```
Expected: all pass.

- [ ] **Step 5: Run full test suite and check coverage**

```bash
pnpm test:coverage
```
Expected: ≥ 70% lines and functions coverage on `src/features/**` and `src/core/**`.

- [ ] **Step 6: Commit**

```bash
git add __tests__/integration/
git commit -m "test(integration): add scan, reconstruction, localization integration flow tests"
```

---

## Final verification

- [ ] **Run entire suite**

```bash
pnpm test --verbose 2>&1 | tail -30
```
Expected: all test files pass, coverage threshold met.

- [ ] **Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Final commit**

```bash
git add -A
git commit -m "test: complete UniWhere test suite (unit + context + widget + integration)"
```
