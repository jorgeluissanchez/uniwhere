# Test Suite Design — UniWhere

**Date:** 2026-05-24  
**Status:** Approved

---

## Context

UniWhere is an Expo SDK 55 / React Native 0.83 app using Clean Architecture + Feature-Sliced design. It has 7 features (auth, scan, reconstruction, viewer, localization, settings, ar), React Context for state management, and a manual DI container. No test suite exists yet.

---

## Goals

- Unit tests for pure domain/data logic
- Context tests for React Context providers (use-case layer)
- Widget tests for UI components (snapshot + interaction)
- Integration tests for full datasource → repo → context chains with HTTP mocks
- Uniform coverage across all 7 features

---

## Stack

| Package | Purpose |
|---|---|
| `jest-expo` | Jest preset for Expo — transforms, native module stubs |
| `@testing-library/react-native` | render, fireEvent, waitFor for component tests |
| `@testing-library/jest-native` | Custom matchers: toBeVisible, toHaveText, etc. |
| `msw` | HTTP mocking via `msw/node` setupServer in Jest |
| `@types/jest` | TypeScript types |

**Native module mocks:**
- `@react-native-async-storage/async-storage/jest/async-storage-mock` (official)
- `expo-file-system`, `expo-document-picker`, `expo-image-picker`, `expo-constants` — mocked via `jest.mock` in `native-mocks.ts`
- `jest-expo` stubs remaining Expo modules automatically

---

## Directory Structure

```
__tests__/
  setup/
    jest.setup.ts              # server.listen/resetHandlers/close + native mocks
    msw-server.ts              # setupServer() combining all handlers
    handlers/
      auth.handlers.ts         # Roble auth endpoints
      scan.handlers.ts         # Roble DB read/insert/update/delete for scans
      reconstruction.handlers.ts  # /reconstruct, /status/:jobId, /:serie/portada
      localization.handlers.ts    # /:serie/localize
    native-mocks.ts            # global jest.mock for native modules

  unit/
    core/
      di/
        container.test.ts
    features/
      auth/
        data/datasources/auth-remote-data-source-impl.test.ts
        data/repositories/auth-repository-impl.test.ts
      scan/
        data/datasources/scan-remote-data-source-impl.test.ts
        data/repositories/scan-repository-impl.test.ts
      reconstruction/
        data/datasources/reconstruction-remote-data-source-impl.test.ts
        data/repositories/reconstruction-repository-impl.test.ts
      viewer/
        data/repositories/ply-repository-impl.test.ts
      localization/
        data/datasources/localization-remote-data-source-impl.test.ts
        data/repositories/localization-repository-impl.test.ts
      ar/
        data/repositories/route-repository-impl.test.ts
        utils/grid-to-world.test.ts

  context/
    features/
      auth/auth-context.test.tsx
      scan/scan-context.test.tsx
      reconstruction/reconstruction-context.test.tsx
      viewer/viewer-context.test.tsx
      localization/localization-context.test.tsx
      ar/ar-route-context.test.tsx

  widgets/
    features/
      auth/
        login-form.test.tsx
        signup-form.test.tsx
        forgot-password-form.test.tsx
        logout-button.test.tsx
      scan/
        new-scan-drawer.test.tsx
      reconstruction/
        reconstruction-form.test.tsx
        job-progress.test.tsx
        serie-input.test.tsx
      viewer/
        hud.test.tsx
        fps-counter.test.tsx
      localization/
        localization-form-screen.test.tsx
        localization-result-screen.test.tsx
      ar/
        grid-matrix.test.tsx
        path-overlay.test.tsx
      settings/
        settings-screen.test.tsx

  integration/
    auth-flow.test.tsx
    scan-flow.test.tsx
    reconstruction-flow.test.tsx
    localization-flow.test.tsx
    ar-route-flow.test.ts
```

---

## Section 1 — Unit Tests

Isolated tests for pure logic. Dependencies mocked with `jest.mock`.

### Core

**`core/di/container.test.ts`**
- `bind` registers a token; `get` returns the bound value
- `isBound` returns true/false correctly
- `get` on unbound token throws

### auth

**`auth-remote-data-source-impl.test.ts`**
- `login()` calls `POST /auth/{projectId}/login` with correct body and headers
- `login()` on 401 throws with appropriate message
- `signup()` calls `POST /auth/{projectId}/signup-direct`
- `refreshToken()` calls `POST /auth/{projectId}/refresh-token`

**`auth-repository-impl.test.ts`**
- `login()` maps DTO → `AuthUser` correctly
- `login()` persists access token and refresh token to AsyncStorage
- `logout()` clears all stored keys
- `getCurrentUser()` reads from AsyncStorage and reconstructs `AuthUser`

### scan

**`scan-remote-data-source-impl.test.ts`**
- `getScans(userId)` calls read endpoint with correct `where` clause
- `createScan()` calls insert endpoint with snake_case columns
- `updateScan()` calls update with correct `_id` filter
- `deleteScan()` calls delete with correct `_id` filter

**`scan-repository-impl.test.ts`**
- DB row (`snake_case`) maps to `Scan` entity (`camelCase`) correctly
- `getPortada(serie)` returns cached URI if available in AsyncStorage
- `getPortada(serie)` calls API and writes file when not cached
- 404 on portada returns `null` without error

### reconstruction

**`reconstruction-remote-data-source-impl.test.ts`**
- `startJob()` sends multipart FormData with `serie`, `infer_gs`, `fotos[]`
- `pollStatus()` GET `/status/{jobId}` returns `ReconstructionJob` with correct fields
- `pollStatus()` maps error status correctly

**`reconstruction-repository-impl.test.ts`**
- `startJob()` returns `jobId` from response
- Status DTO maps to entity `status` enum

### viewer

**`ply-repository-impl.test.ts`**
- Parser reads `x, y, z` float32 values correctly from binary PLY buffer
- Parser reads optional `red, green, blue` uint8 values and normalizes to 0–1
- `centeringOffset` is captured before `geometry.center()` is called
- Downsampling triggers when vertex count exceeds `maxPoints`
- Invalid PLY header throws with descriptive error

### localization

**`localization-remote-data-source-impl.test.ts`**
- `localize()` sends `POST /{encodeURIComponent(serie)}/localize`
- FormData field is `foto`, not `image`
- Serie is in URL path, not in FormData body
- Response `translation[0..2]` maps to `{x, y, z}`
- 404 throws "No hay modelo ACE entrenado para esta serie"
- 422 throws "La imagen no es válida o no pudo procesarse"
- Request is aborted after 30s via AbortController

**`localization-repository-impl.test.ts`**
- `localize()` passes through `LocalizationResult` from datasource

### ar

**`route-repository-impl.test.ts`**
- `saveRoute(points)` serializes to JSON and writes to AsyncStorage key `ar_route`
- `loadRoute()` parses JSON and returns `RoutePoint[]`
- `loadRoute()` on missing key returns `[]`
- `clearRoute()` removes the key from AsyncStorage

**`ar/utils/grid-to-world.test.ts`**
- `col` maps to X axis with correct `SPACING`
- `row` maps to Z axis with correct `SPACING`
- Y is fixed at `ELEVATION`
- `DEPTH` offset applied correctly

---

## Section 2 — Context Tests

Mount the real provider with mocked repositories injected via DI. Verify state transitions.

> **DI override requirement:** `DIProvider` needs an optional `overrides?: Partial<Container>` prop added for test use. Production behavior unchanged when omitted.

### Pattern

```tsx
const mockAuthRepo = { login: jest.fn(), logout: jest.fn(), getCurrentUser: jest.fn() };
const wrapper = ({ children }) => (
  <DIProvider overrides={{ [TOKENS.AuthRepo]: mockAuthRepo }}>
    <AuthProvider>{children}</AuthProvider>
  </DIProvider>
);
const { result } = renderHook(() => useAuth(), { wrapper });
```

### Per-context cases

**`auth-context.test.tsx`**
- `login()` success → `user` populated, `error` null
- `login()` failure → `error` set, `user` null
- `logout()` → `user` null
- `restoreSession()` → calls `getCurrentUser()`, sets `user`

**`scan-context.test.tsx`**
- `refresh()` → `scans` loaded, `portadas` populated
- `saveScan()` → calls repo, adds to `scans`
- `deleteScan(id)` → removes from `scans`
- `loading` is true during async operations

**`reconstruction-context.test.tsx`**
- `startJob()` → `submitting` true during call, false after
- `startJob()` on repo error → `error` set
- Success clears `error`

**`viewer-context.test.tsx`**
- `loadFromPath(uri)` → calls repo with uri, sets `cloud`
- Repo parse error → `error` set, `cloud` null
- `loading` transitions correctly

**`localization-context.test.tsx`**
- `submit()` without `selectedScan` → returns false, no repo call
- `submit()` without `image` → returns false, no repo call
- `submit()` success → `result` set, `submitting` false
- `submit()` error → `error` set
- `reset()` → all fields back to null

**`ar-route-context.test.tsx`**
- `save(route)` → calls repo `saveRoute`
- `load()` → calls repo `loadRoute`, sets `route`
- `clear()` → calls repo `clearRoute`, empties `route`

---

## Section 3 — Widget Tests

Use `@testing-library/react-native`. Context provided via mock wrapper.

### Excluded components

| Component | Reason |
|---|---|
| `PointCloud3D`, `PointCloudCanvas` | Requires WebGL / @react-three/fiber |
| `BreadcrumbModel` | Requires GLTFLoader + WebGL |
| `ARRouteScreen` | Requires expo-camera CameraView (native) |
| `LocatedMarker` | R3F mesh with useFrame — requires WebGL renderer |

### Per-component

**auth/**
- `LoginForm` (interaction): email/password fields update on change; submit calls `login()`; error message visible when context has error
- `SignupForm` (interaction): all fields; submit calls `signup()`
- `ForgotPasswordForm` (snapshot + interaction): renders correctly; submit calls callback
- `LogoutButton` (interaction): tap calls `logout()` from AuthContext

**scan/**
- `NewScanDrawer` (interaction): opens/closes; submit calls `saveScan()`

**reconstruction/**
- `ReconstructionForm` (interaction): photo picker triggers; submit calls `startJob()`
- `JobProgress` (snapshot + interaction): renders progress bars per status; `done` shows success state
- `SerieInput` (snapshot): renders correctly

**viewer/**
- `HUD` (snapshot): renders vertex count and coordinates
- `FpsCounter` (snapshot): renders FPS value

**localization/**
- `LocalizationFormScreen` (interaction): info-box shows serie name; image picker works; submit disabled without image
- `LocalizationResultScreen` (snapshot): "Usted se encuentra aquí" badge present; yellow banner when `success=false`; HUD shows x/y/z and inlier count

**ar/**
- `GridMatrix` (interaction): tap on cell selects point; selection state updates
- `PathOverlay` (snapshot): renders SVG lines between given points

**settings/**
- `SettingsScreen` (snapshot): displays user name and email from AuthContext

---

## Section 4 — Integration Tests

Real datasource + real repository + real context. MSW intercepts HTTP. Native I/O (AsyncStorage, file system) mocked globally.

### MSW server setup

```ts
// __tests__/setup/msw-server.ts
import { setupServer } from 'msw/node';
export const server = setupServer(...authHandlers, ...scanHandlers, ...reconstructionHandlers, ...localizationHandlers);

// jest.setup.ts
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Flows

**`auth-flow.test.tsx`**
- Login → tokens written to AsyncStorage → `restoreSession` reads them → `AuthUser` reconstructed with correct fields
- Login with 401 → `error` in context; AsyncStorage not written

**`scan-flow.test.tsx`**
- `refresh()` → DB read returns scan rows → portada GET per serie → `portadas` record populated
- `saveScan(scan)` → DB insert → `scans` list updated

**`reconstruction-flow.test.tsx`**
- `startJob()` → POST `/reconstruct` → repeated GET `/status/{jobId}` → final status `done`
- Error status from API → `error` exposed in context

**`localization-flow.test.tsx`**
- `submit()` → POST `/{serie}/localize` → `result.x/y/z` from `translation[0..2]`
- 404 response → error message "No hay modelo ACE entrenado para esta serie"
- 422 response → error message "La imagen no es válida"
- AbortController cancels request after 30s

**`ar-route-flow.test.ts`**
- `save(route)` → AsyncStorage → `load()` returns same route
- `clear()` → `load()` returns `[]`

---

## jest.config.js

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterFramework: ['<rootDir>/__tests__/setup/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  collectCoverageFrom: [
    'src/features/**/*.{ts,tsx}',
    'src/core/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: { lines: 70, functions: 70 },
  },
};
```

---

## Constraints & Notes

- PLY parser test uses a manually constructed binary buffer (ArrayBuffer with correct header + float32 vertices)
- Three.js geometry (`THREE.BufferGeometry`, `THREE.Box3`, `THREE.Vector3`) must be mocked in widget/context tests that indirectly import viewer code
- `msw/node` requires Node ≥ 18; Expo SDK 55 mandates Node ≥ 20 — no conflict
- The `DIProvider.overrides` prop addition is a prerequisite for all context tests
- Widget tests for screens that use `expo-router` `useRouter`/`useLocalSearchParams` require mocking `expo-router`
