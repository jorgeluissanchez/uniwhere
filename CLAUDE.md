# UniWhere — Project Architecture Reference

## What This Is

UniWhere is a cross-platform mobile/web app (Expo SDK 55 / React Native 0.83) that lets users submit photos for 3D reconstruction, manage their scans, and view the resulting point clouds in a 3D viewer. It connects to **Roble**, an OpenLab platform from Universidad del Norte.

**Package manager:** `pnpm`  
**Run:** `pnpm start` (Expo dev server)  
**Platforms:** Android, iOS, Web (static output via Metro)

---

## Architecture

**Clean Architecture + Feature-Sliced.** Every feature lives in `src/features/<name>/` with three layers:

```
src/features/<feature>/
  data/
    datasources/    ← interface + impl (HTTP calls, file I/O)
    repositories/   ← impl (bridges data ↔ domain)
  domain/
    entities/       ← plain TypeScript types
    repositories/   ← interface only
  presentation/
    components/     ← UI pieces
    screens/        ← full-screen composites
    context/        ← React Context for state
```

**State management:** React Context API (no Redux, no Zustand). Each feature has one context provider.

**DI container:** Manual, symbol-keyed singleton map in `src/core/di/`. All implementations are wired once in `DIProvider` and injected via `useDI()`. Tokens live in `src/core/constants/tokens.ts`.

---

## Directory Map

```
/
├── app.json                    Expo config (scheme: "uniwhere")
├── package.json                Dependencies
├── tailwind.config.js          NativeWind theme
├── metro.config.js             Metro + NativeWind bundler config
├── tsconfig.json               Path alias: @/ → src/
│
├── assets/
│   ├── fonts/                  Cal Sans (headings), ABeeZee (body)
│   └── svgs/                   Inline SVG data as TS strings
│
└── src/
    ├── app/                    Expo Router file-based routing
    │   ├── _layout.tsx         Root layout: DIProvider > AuthProvider > ViewerProvider > ReconstructionProvider > ScanProvider > ThemeProvider > ToastProvider
    │   ├── index.tsx           Auth guard: redirects to /scan or /landing
    │   ├── (auth)/             landing, login, signup, forgot-password
    │   └── (app)/
    │       ├── (tabs)/         scan.tsx, settings.tsx
    │       │   └── _layout.tsx Responsive tabs (bottom < 768px, sidebar ≥ 768px)
    │       ├── viewer.tsx      3D PLY viewer
    │       └── welcome.tsx     Post-signup welcome
    │
    ├── core/
    │   ├── components/ui/      react-native-reusables component library (NativeWind styled)
    │   ├── constants/
    │   │   ├── tokens.ts       DI symbols: AuthRemoteDS, AuthRepo, ViewerRepo, …
    │   │   └── theme.ts        Navigation theme
    │   ├── di/
    │   │   ├── container.ts    Simple Map-based IoC container
    │   │   └── di-provider.tsx Wires all implementations; exposes useDI()
    │   ├── hooks/
    │   │   ├── use-theme.ts    Dark/light theme hook
    │   │   └── use-color-scheme.ts
    │   ├── lib/utils.ts        cn() helper (clsx + tailwind-merge)
    │   └── storage/
    │       ├── i-local-preferences.ts          Interface
    │       └── local-preferences-async-storage.ts  Singleton, wraps AsyncStorage
    │
    └── features/
        ├── auth/
        ├── scan/
        ├── reconstruction/
        ├── viewer/
        └── settings/
```

---

## Features

### auth

Authentication against the Roble API using JWT (access + refresh tokens).

**Entities:** `AuthUser { userId, email, role, name? }`

**Local storage keys:** `token`, `refreshToken`, `userId`, `email`, `role`, `name`

**Flows:**
- Login → POST `/auth/{projectId}/login` → decode JWT → fetch user row from DB → store in AsyncStorage
- Signup → POST `/auth/{projectId}/signup-direct` → auto-login with retry → INSERT into `user` table
- Token refresh → POST `/auth/{projectId}/refresh-token` (called automatically on 401)
- Session restore → `authRepo.getCurrentUser()` reads AsyncStorage on app start

**Key files:**
- `src/features/auth/data/datasources/auth-remote-data-source-impl.ts` — all HTTP calls
- `src/features/auth/presentation/context/auth-context.tsx` — `AuthProvider`, `useAuth()`

---

### scan

Manages a user's list of 3D scans stored in the Roble DB (`scan` table).

**Entity:** `Scan { _id, userId, jobId, serie, tipo: 'dense'|'splat', localUri, createdAt }`

**DB columns:** `_id, user_id, job_id, serie, tipo, local_uri, created_at`

**CRUD via:** `ScanRemoteDataSourceImpl` → `fetchAuth()` helper that handles token refresh on 401

**`ScanContext` exposes:** `scans`, `loading`, `error`, `saveScan()`, `updateScan()`, `deleteScan()`, `refresh()`

**Key flow (ScanScreen):**
1. List scans sorted by `createdAt` DESC
2. FAB (+) → `NewScanDrawer` (submits reconstruction + saves scan record)
3. Tap card → "Ver Detalles" drawer → "Ver Modelo" downloads/caches PLY → navigates to `/viewer`

Local caching: on native, downloaded PLY is written to `Paths.document/{jobId}_{tipo}.ply` and the `localUri` is updated in the DB.

---

### reconstruction

Submits photo sets to the reconstruction API and polls for job status.

**Entity:** `ReconstructionJob { jobId, serie, status: 'pending'|'running'|'done'|'error'|'timeout', progress: string[], error }`

**API:** `EXPO_PUBLIC_RECONSTRUCTION_API_URL`
- `POST /reconstruct` — multipart form with `serie`, `infer_gs`, `fotos[]` → returns `{ job_id }`
- `GET /status/{jobId}` → `ReconstructionJob`
- `GET /download/{jobId}?tipo=dense|splat` → PLY binary

**Photo handling:**
- Web: fetch blob URL → `new File([blob], name, { type })` for FormData
- Native: pass `{ uri, name, type }` object directly to FormData

**`ReconstructionContext` exposes:** `submitting`, `error`, `startJob()`

**`NewScanDrawer`** combines reconstruction + scan in one action: starts job → saves scan record.

---

### viewer

Parses and renders PLY point cloud files in 3D.

**Entity:** `PlyCloud { geometry: THREE.BufferGeometry, vertexCount, originalVertexCount, hasColors, boundingBox }`

**PLY parser (`PlyStreamingParserDataSourceImpl`):**
- Binary format only (ASCII throws an error)
- Web: fetches URL → uses `Cache API` (`ply-models` cache) for offline reuse
- Native: uses `expo-file-system` File API with 80k-vertex chunks
- Downsamples automatically when vertex count exceeds `maxPoints`
- Reads `x, y, z` (required) + `red, green, blue` (optional, normalized 0–1)

**Rendering stack:** `@react-three/fiber/native` Canvas → `OrbitControls` (r3f-native-orbitcontrols) → `PointCloud3D` → `THREE.Points` with `THREE.PointsMaterial`

**`ViewerContext` exposes:** `cloud`, `loading`, `error`, `loadFile()` (file picker), `loadFromPath(uri)` (direct path)

---

### settings

Simple profile screen. No dedicated domain/data layer — reads from `AuthContext`.

---

## Backend APIs

| Variable | Default | Purpose |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | `https://roble-api.openlab.uninorte.edu.co` | Auth + DB |
| `EXPO_PUBLIC_ROBLE_PROJECT_ID` | (required) | Scopes all Roble calls |
| `EXPO_PUBLIC_RECONSTRUCTION_API_URL` | (required) | 3D reconstruction service |

**Auth endpoints:** `/auth/{projectId}/login`, `/signup-direct`, `/logout`, `/refresh-token`, `/verify-token`  
**DB endpoints:** `/database/{projectId}/read`, `/insert`, `/update`, `/delete`  
**Reconstruction:** `/reconstruct`, `/status/{jobId}`, `/download/{jobId}?tipo=dense|splat`

---

## UI System

- **Component library:** `react-native-reusables` (Radix-equivalent primitives for RN) in `src/core/components/ui/`
- **Styling:** NativeWind v4 (Tailwind CSS classes on RN components via `className`)
- **Icons:** `lucide-react-native`
- **Fonts:** Cal Sans (display/headings), ABeeZee (body text)
- **Theme:** dark/light via `useColorScheme`, custom theme tokens in `src/core/constants/theme.ts`
- **Responsive layout:** `useWindowDimensions()` — tabs are bottom bar < 768px, left sidebar ≥ 768px

---

## Provider Stack (Root Layout)

```
DIProvider
  └── AuthProvider
        └── ViewerProvider
              └── ReconstructionProvider
                    └── ScanProvider
                          └── ThemeProvider
                                └── ToastProvider
                                      └── Stack (Expo Router)
                                            └── PortalHost
```

All feature contexts depend on `DIProvider` (via `useDI()`) and most depend on `AuthProvider` (for `loggedUser`).

---

## Conventions

- Path alias `@/` maps to `src/` (configured in `tsconfig.json` and `babel.config.js`)
- All DI tokens are `Symbol` values in `TOKENS` — never use strings
- Repository interfaces live in `domain/repositories/`, implementations in `data/repositories/`
- Contexts throw if used outside their Provider (guard with `if (!ctx) throw`)
- `LocalPreferencesAsyncStorage` is a singleton — always use `.getInstance()`
- No test suite exists yet; the app runs on Expo Go / dev builds
