# UniWhere — Project Architecture Reference

## What This Is

UniWhere is a cross-platform mobile/web app (Expo SDK 55 / React Native 0.83) that lets users submit photos for 3D reconstruction, manage their scans, view the resulting point clouds in a 3D viewer, localize themselves within a 3D model via ACE (Absolute Camera Estimation), and explore 3D mesh files with gyroscope-driven camera rotation. It connects to **Roble**, an OpenLab platform from Universidad del Norte.

**Package manager:** `pnpm` (requires Node ≥ 20 — use `nvm use 20`)  
**Run:** `pnpm start` or `npx expo start --port 8083` (Expo dev server)  
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
├── app.json                    Expo config (scheme: "uniwhere", android.package: com.uninorte.uniwhere)
├── eas.json                    EAS build profiles (preview → APK, production → AAB)
├── package.json                Dependencies
├── tailwind.config.js          NativeWind theme
├── metro.config.js             Metro + NativeWind bundler config + three-shim resolver
├── three-shim.js               Silences THREE.Clock deprecation; forces single Three.js instance
├── tsconfig.json               Path alias: @/ → src/
│
├── assets/
│   ├── fonts/                  Cal Sans (headings), ABeeZee (body)
│   ├── svgs/                   Inline SVG data as TS export strings
│   │   ├── studentsRafiki.ts   Login + signup top illustration
│   │   ├── undrawRightDirection.ts  Welcome screen illustration
│   │   ├── curiousCuate.ts     Settings/profile character illustration
│   │   ├── layeredWaves.ts     Login/signup bottom wave + welcome top wave
│   │   ├── lowPolyGrid.ts      Settings background texture
│   │   ├── blob.ts             Forgot-password full background
│   │   ├── bg.ts               Landing screen background (mobile)
│   │   ├── hombre.ts           Landing screen character (male)
│   │   ├── mujer.ts            Landing screen character (female)
│   │   └── welcome.ts          (legacy, replaced by undrawRightDirection)
│   ├── svgs/newsvgs/           Source SVG files (raw, not imported directly)
│   └── 3d_objects/
│       └── Baguette.glb        3D breadcrumb model used in AR feature
│
└── src/
    ├── app/                    Expo Router file-based routing
    │   ├── _layout.tsx         Root layout (see Provider Stack below)
    │   ├── index.tsx           Auth guard: redirects to /scan or /landing
    │   ├── (auth)/             landing, login, signup, forgot-password
    │   └── (app)/
    │       ├── (tabs)/         scan.tsx, demo.tsx, settings.tsx
    │       │   └── _layout.tsx Responsive tabs (bottom < 768px, sidebar ≥ 768px)
    │       ├── viewer.tsx      3D PLY viewer
    │       ├── localization.tsx        Localization form screen
    │       ├── localization-result.tsx Localization result + 3D marker screen
    │       └── welcome.tsx     Post-signup welcome
    │
    ├── core/
    │   ├── components/ui/      react-native-reusables component library (NativeWind styled)
    │   ├── constants/
    │   │   ├── tokens.ts       DI symbols (see Features below for per-feature tokens)
    │   │   └── theme.ts        Navigation theme
    │   ├── di/
    │   │   ├── container.ts    Simple Map-based IoC container
    │   │   └── di-provider.tsx Wires all implementations; exposes useDI()
    │   ├── hooks/
    │   │   ├── use-theme.ts
    │   │   └── use-color-scheme.ts
    │   ├── lib/utils.ts        cn() helper (clsx + tailwind-merge)
    │   └── storage/
    │       ├── i-local-preferences.ts
    │       └── local-preferences-async-storage.ts  Singleton, wraps AsyncStorage
    │
    └── features/
        ├── auth/
        ├── scan/
        ├── reconstruction/
        ├── viewer/
        ├── localization/
        ├── mesh-viewer/
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
- `src/features/auth/data/datasources/auth-remote-data-source-impl.ts`
- `src/features/auth/presentation/context/auth-context.tsx` — `AuthProvider`, `useAuth()`

**Screen SVGs:**
- Login + Signup: `studentsRafiki` (top illustration in flow) + `layeredWaves` (bottom wave, signup only)
- Forgot password: `blob` (full-screen background)

---

### scan

Manages a user's list of 3D scans stored in the Roble DB (`scan` table). Also fetches and caches thumbnail images (portadas) per serie.

**Entity:** `Scan { _id, userId, jobId, serie, tipo: 'dense'|'splat', localUri, createdAt }`

**DB columns:** `_id, user_id, job_id, serie, tipo, local_uri, created_at`

**`ScanContext` exposes:** `scans`, `portadas`, `loading`, `error`, `saveScan()`, `updateScan()`, `deleteScan()`, `refresh()`

**`portadas`:** `Record<string, string>` — maps `serie → local image URI`. Loaded in background on refresh and after saveScan. Cached to `Paths.cache/portada_{serie}.jpg` and tracked in AsyncStorage under key `portada_cache_{serie}`.

**Portada API:** `GET {RECONSTRUCTION_API_URL}/{serie}/portada` → image binary. 404 means no portada exists. On web, returns the URL directly (no caching).

**Key flow (ScanScreen):**
1. Cards show portada thumbnail (120px height) when available
2. FAB (+) → `NewScanDrawer` (submits reconstruction + saves scan record)
3. Tap card → "Ver Detalles" drawer → "Ver Modelo" downloads/caches PLY → navigates to `/viewer`
4. "Probar VPS" in drawer → resets LocalizationContext, pre-selects scan, navigates to `/localization`

Local caching: PLY written to `Paths.document/{jobId}_{tipo}.ply`, `localUri` updated in DB.

**DI tokens:** `ScanRemoteDS`, `ScanRepo`

---

### reconstruction

Submits photo sets to the reconstruction API and polls for job status.

**Entity:** `ReconstructionJob { jobId, serie, status: 'pending'|'running'|'done'|'error'|'timeout', progress: string[], error }`

**API:** `EXPO_PUBLIC_RECONSTRUCTION_API_URL`
- `POST /reconstruct` — multipart form with `serie`, `infer_gs`, `fotos[]` → returns `{ job_id }`
- `GET /status/{jobId}` → `ReconstructionJob`
- `GET /download/{jobId}?tipo=dense|splat` → PLY binary
- `GET /{serie}/portada` → image binary (used by scan feature)
- `POST /{serie}/localize` → localization result (used by localization feature)

**`ReconstructionContext` exposes:** `submitting`, `error`, `startJob()`

**DI tokens:** `ReconstructionRemoteDS`, `ReconstructionRepo`

---

### viewer

Parses and renders PLY point cloud files in 3D. Also used by the localization feature to display the 3D model with a position marker.

**Entity:**
```typescript
PlyCloud {
  geometry: THREE.BufferGeometry;
  vertexCount: number;
  originalVertexCount: number;
  hasColors: boolean;
  boundingBox: THREE.Box3;
  centeringOffset: THREE.Vector3;  // offset captured BEFORE geometry.center() is called
}
```

**`centeringOffset` is critical:** `PlyRepositoryImpl.parse()` calls `computeBoundingBox()` → `getCenter(centeringOffset)` → `geometry.center()`. The offset is stored so localization result coordinates can be adjusted: `markerPoint = rawXYZ.sub(centeringOffset)`.

**PLY parser:** Binary format only. Web: Cache API (`ply-models`). Native: `expo-file-system` File API, 80k-vertex chunks. Downsamples when vertex count > `maxPoints`. Reads `x,y,z` + optional `red,green,blue` (normalized 0–1).

**Rendering stack:** `@react-three/fiber/native` Canvas → `OrbitControls` → `PointCloud3D` → `THREE.Points`

**`PointCloud3D` props:** accepts `focusPoint?: THREE.Vector3`. When set, camera is placed at `(fx, fy + dist×0.45, fz + dist)` looking at `focusPoint`. Otherwise defaults to `z = sphere.radius × 2.5`.

**`PointCloudCanvas` props:** accepts `markerPoint?: THREE.Vector3`. When set, renders `<LocatedMarker>` sphere with pulse animation and passes `focusPoint` to `PointCloud3D`. Marker radius = `max(bounding box dims) × 0.06`.

**`ViewerContext` exposes:**
```typescript
cloud: PlyCloud | null
loading: boolean
error: string | null
loadFile(): Promise<boolean>       // file picker; returns false if cancelled
loadFromPath(uri: string): Promise<boolean>
```

**DI tokens:** `ViewerRepo`, `ViewerStreamingDS`

---

### localization

ACE (Absolute Camera Estimation) localization feature. User picks a query image, the API compares it against a trained model for the serie, and returns a 3D position. The result is displayed as a pulsing sphere marker on the point cloud.

**Entry point:** "Probar VPS" button in the scan details drawer (ScanScreen). This button:
1. Calls `locCtx.reset()`
2. Calls `locCtx.setSelectedScan(selectedScan)` — pre-selects the scan
3. Closes the drawer
4. Navigates to `/localization`

**Entity:**
```typescript
LocalizationResult { x: number; y: number; z: number; success: boolean; inlier_count: number; }
```

**API:** `POST {RECONSTRUCTION_API_URL}/{encodeURIComponent(serie)}/localize`
- Form field: `foto` (image file — NOT `image`)
- Serie is in the URL path, NOT in the FormData
- Response: `{ success, inlier_count, translation: [x, y, z], rotation, pose }`
- Parsing: `translation[0]→x, translation[1]→y, translation[2]→z`
- 404 → "No hay modelo ACE entrenado para esta serie"
- 422 → "La imagen no es válida o no pudo procesarse"
- 30s timeout via AbortController

**`LocalizationContext` exposes:**
```typescript
selectedScan: Scan | null
image: LocalizationImageParam | null   // { uri, name, type }
submitting: boolean
error: string | null
result: LocalizationResult | null
setSelectedScan(scan): void
setImage(img): void
submit(): Promise<boolean>
reset(): void
```

**`LocalizationFormScreen`:**
- Shows read-only info-box with pre-selected serie name (no picker — serie always comes from scan drawer)
- Image picker (DocumentPicker, `image/*`)
- On submit: calls `submit()` → `loadFromPath(selectedScan.localUri)` → navigates to `/localization-result`

**`LocalizationResultScreen`:**
- Reads `result` from LocalizationContext, `cloud` from ViewerContext
- `markerPoint = new THREE.Vector3(result.x, result.y, result.z).sub(cloud.centeringOffset)`
- Renders `<PointCloudCanvas markerPoint={markerPoint} />`
- "Usted se encuentra aquí" badge (top-left, red dot)
- Yellow warning banner when `result.success === false`
- HUD: X/Y/Z coords + inlier count + confidence label

**`LocatedMarker` component:** R3F `<mesh>` sphere, `useFrame` pulse (scale oscillates 0.8–1.5), color `#ef4444`.

**DI tokens:** `Localization_RemoteDS`, `Localization_Repo`

---

### settings

Profile screen. No dedicated domain/data layer — reads from `AuthContext`.

**SVGs:** `curiousCuate` (character, `width * 1.275` size) + `lowPolyGrid` (background texture, 35% opacity) over `bg-blue-900`.

---

### mesh-viewer

Gyroscope-driven 3D mesh viewer. User picks an OBJ, GLB, or GLTF file from local storage; the file is loaded into Three.js and rendered with a camera that follows device orientation via DeviceMotion (Euler order YXZ).

**Accessed via:** "Visor 3D" tab (demo.tsx), icon `Box` from lucide-react-native.

**Domain:**
```typescript
MeshModel { scene: THREE.Group; boundingBox: THREE.Box3; }
IMeshRepository { pickAndLoad(): Promise<MeshModel | null> }  // null = user cancelled
```

**Data:**
```
datasources/
  mesh-file-picker-data-source.ts          interface: pickFile() → uri (throws 'cancelado')
  mesh-file-picker-data-source-impl.ts     DocumentPicker, copyToCacheDirectory: true (required for Android content:// URIs)
  mesh-loader-data-source.ts               interface: loadOBJ / loadGLTF → THREE.Group
  mesh-loader-data-source-impl.ts          File.text() for OBJ, File.arrayBuffer() for GLB/GLTF
repositories/mesh-repository-impl.ts       detects ext, calls correct loader, computes bounding box
```

**CRITICAL — file reading:** Use the new `expo-file-system` `File` class (NOT `readAsStringAsync`, NOT `fetch()`):
- `fetch(file://)` fails on Android with "Network request failed"
- `readAsStringAsync` is deprecated
- Correct: `import { File } from 'expo-file-system'`; then `new File(uri).text()` (OBJ) or `new File(uri).arrayBuffer()` (GLB)

**CRITICAL — large file loading:** `GLTFLoader.parse()` and `OBJLoader.parse()` block the JS thread synchronously. Always yield before calling parse:
```typescript
await new Promise<void>(resolve => setTimeout(resolve, 50));
```
This lets the loading indicator render before the thread freezes.

**Presentation:**
```
context/mesh-viewer-context.tsx   MeshViewerProvider / useMeshViewer()
  exposes: mesh, loading, error, loadMesh()
hooks/use-mesh-gyroscope.ts       DeviceMotion subscription; returns eulerRef + available
  - Uses DeviceMotion from expo-sensors (~55.0.15 for SDK 55)
  - Captures offset on first event; subsequent events subtract offset
  - eulerRef is a useRef (no re-renders at 60fps)
components/mesh-canvas.tsx        R3F Canvas; CameraController reads eulerRef in useFrame
screens/mesh-viewer-screen.tsx    4 states: idle / loading / error / ready-with-mesh
```

**Gyroscope notes:**
- `DeviceMotion.setUpdateInterval(16)` for ~60fps target
- Euler order `'YXZ'` for first-person camera rotation
- **Emulator limitation:** Android emulator's Extended Controls (3D phone rotation UI) does NOT update the Rotation Vector Sensor. Gyroscope ONLY works on a physical device. Console injection (`sensor set orientation`) updates the sensor but fires a single event — not continuous.
- On physical device: gyroscope works smoothly; large file parse still freezes JS thread for several seconds but resolves on its own.

**DI tokens:** `MeshPickerDS`, `MeshLoaderDS`, `MeshRepo`

**Android memory:**  
Large meshes (134MB GLB) require elevated heap. `plugins/withLargeHeap.js` sets `android:largeHeap="true"` in the manifest via Expo config plugin (registered in `app.json`). Emulator AVD should have at least 7168MB RAM and 512MB VM heap (`~/.android/avd/Pixel_6a.avd/config.ini`).

---

## Backend APIs

| Variable | Default | Purpose |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | `https://roble-api.openlab.uninorte.edu.co` | Auth + DB |
| `EXPO_PUBLIC_ROBLE_PROJECT_ID` | (required) | Scopes all Roble calls |
| `EXPO_PUBLIC_RECONSTRUCTION_API_URL` | (required) | 3D reconstruction + localization service |

**Auth endpoints:** `/auth/{projectId}/login`, `/signup-direct`, `/logout`, `/refresh-token`, `/verify-token`  
**DB endpoints:** `/database/{projectId}/read`, `/insert`, `/update`, `/delete`  
**Reconstruction API:**
- `POST /reconstruct` — submit photos
- `GET /status/{jobId}` — poll job
- `GET /download/{jobId}?tipo=dense|splat` — download PLY
- `GET /{serie}/portada` — thumbnail image for serie
- `POST /{serie}/localize` — ACE localization (FormData field: `foto`)

All reconstruction API requests require header `ngrok-skip-browser-warning: 1` on native.

---

## UI System

- **Component library:** `react-native-reusables` in `src/core/components/ui/`
- **Styling:** NativeWind v4 (Tailwind CSS via `className`)
- **Icons:** `lucide-react-native`
- **Fonts:** Cal Sans (headings), ABeeZee (body)
- **SVGs:** `react-native-svg` + `SvgXml` — all SVGs stored as TS template literal strings in `assets/svgs/*.ts`
- **Images:** `expo-image` (used for portada thumbnails in scan cards)
- **Theme:** dark/light via `useColorScheme`
- **Responsive layout:** `useWindowDimensions()` — tabs bottom bar < 768px, left sidebar ≥ 768px

---

## Provider Stack (Root Layout)

```
DIProvider
  └── AuthProvider
        └── ViewerProvider
              └── LocalizationProvider     ← added
                    └── ReconstructionProvider
                          └── ScanProvider
                                └── ThemeProvider
                                      └── ToastProvider
                                            └── Stack (Expo Router)
                                                  └── PortalHost
```

`MeshViewerProvider` is mounted locally in `demo.tsx` only.

---

## Metro / Three.js Setup

`metro.config.js`:
1. Adds `glb` and `gltf` to `assetExts`
2. Forces all `three` imports through `three-shim.js` (single instance + Clock patch)
3. Bypasses the empty `exports` map of `@react-three/fiber/native` with a direct `require.resolve`

---

## Building an APK (local)

**Use the build script — don't run steps manually:**

```bash
./scripts/build-android.sh
# Output: android/app/build/outputs/apk/release/app-release.apk (~118 MB)
# Install: adb install -r android/app/build/outputs/apk/release/app-release.apk
```

The script handles everything: Node 20 activation, `~/bin/node` wrapper (Gradle can't inherit shell PATH), `expo prebuild --clean`, restoring `android/local.properties` (`NODE_BINARY`), appending ProGuard rules, and `./gradlew assembleRelease --no-daemon`.

**Why the script is needed after every `prebuild --clean`:**  
`--clean` regenerates `android/` from scratch, wiping both `local.properties` (which Gradle needs to find Node 20) and `proguard-rules.pro` (which prevents R8 from stripping Expo internal Kotlin classes).

**ProGuard rules that must always be present** (`android/app/proguard-rules.pro`):
```
-keep class expo.modules.** { *; }
-keep interface expo.modules.** { *; }
-keepattributes *Annotation*, Signature, RuntimeVisibleAnnotations, EnclosingMethod, InnerClasses
```
Without these, release builds crash at launch with `NoClassDefFoundError: TypeDescriptor` because R8 strips `expo.modules.kotlin.types.descriptors.TypeDescriptor` used by expo module definitions at runtime.

**Version compatibility:** All `expo-*` packages must match SDK 55. Run `npx expo install --check` to detect mismatches. Known past issues:
- `expo-linear-gradient@56` (incompatible with SDK 55) caused TypeDescriptor crash — must stay at `~55.0.14`
- `expo-sensors@14.0.2` is wrong for SDK 55 — must be `~55.0.15` (DeviceMotion will silently fail otherwise)

The `android/` directory is generated — do not commit it. `eas.json` defines `preview` (APK) and `production` (AAB) profiles for cloud builds via `eas build`.

---

## Conventions

- Path alias `@/` maps to `src/` (configured in `tsconfig.json` and `babel.config.js`)
- All DI tokens are `Symbol` values in `TOKENS` — never use strings
- Repository interfaces in `domain/repositories/`, implementations in `data/repositories/`
- Contexts throw if used outside their Provider: `if (!ctx) throw new Error(...)`
- `LocalPreferencesAsyncStorage` is a singleton — always use `.getInstance()`
- SVGs are stored as TS template literals (`export const X_SVG = \`...\``) and rendered with `<SvgXml xml={X_SVG} .../>`
- Raw source SVGs live in `assets/svgs/newsvgs/` — to use them, generate a `.ts` wrapper: `echo "export const X_SVG = \`$(cat file.svg)\`;" > assets/svgs/x.ts`
- No test suite exists yet; app runs on Expo Go / dev builds
- Expo server port 8081 may conflict — use `--port 8083`
- Git commits must NOT include `Co-Authored-By` lines
