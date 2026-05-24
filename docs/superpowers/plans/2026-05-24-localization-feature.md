# Localization Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to select a locally-downloaded PLY series, upload a single image, and receive a 3D coordinate from a localization API that is then highlighted as a pulsing sphere marker inside the existing PLY viewer.

**Architecture:** New `localization` feature following the same Clean Architecture + Feature-Sliced structure as the rest of the app. A new `LocalizationContext` (root-level provider) holds form state and the API result. The result screen reuses `ViewerContext` for PLY loading and extends `PointCloudCanvas` with an optional `markerPoint` prop rendered via a new `LocatedMarker` Three.js component.

**Tech Stack:** Expo SDK 55 / React Native 0.83, @react-three/fiber/native, THREE.js, NativeWind v4, expo-document-picker, react-native-reusables, lucide-react-native, expo-router.

---

## Architecture Overview

```
ScanScreen (FAB MapPin)
  └── /localization  (modal route)
        └── LocalizationFormScreen
              ├── SeriesPicker (lists scans with non-empty localUri)
              ├── ImagePicker (single image via expo-document-picker)
              └── Submit → POST /localize → { x, y, z }
                    └── loadFromPath(localUri) [ViewerContext]
                          └── /localization-result  (modal route)
                                └── LocalizationResultScreen
                                      └── PointCloudCanvas (cloud + markerPoint)
                                            ├── PointCloud3D  (unchanged)
                                            └── LocatedMarker (pulsing sphere at coordinate)
```

**Provider stack addition (root `_layout.tsx`):**
```
DIProvider
  └── AuthProvider
        └── ViewerProvider
              └── LocalizationProvider   ← NEW (wraps everything below)
                    └── ReconstructionProvider
                          └── ScanProvider
                                └── ...
```

**State held by `LocalizationContext`:**
- `selectedScan: Scan | null` — the scan the user selected
- `image: PickedImage | null` — single picked image
- `submitting: boolean`
- `error: string | null`
- `result: LocalizationResult | null` — `{ x, y, z }` from API
- `submit()` — multipart POST → sets result
- `reset()` — clears all state

---

## File Map

| Status | Path | Responsibility |
|--------|------|---------------|
| CREATE | `src/features/localization/domain/entities/localization-result.ts` | `LocalizationResult` type `{ x, y, z }` |
| CREATE | `src/features/localization/domain/repositories/localization-repository.ts` | Interface: `localize(serie, image) → LocalizationResult` |
| CREATE | `src/features/localization/data/datasources/localization-remote-data-source.ts` | Interface |
| CREATE | `src/features/localization/data/datasources/localization-remote-data-source-impl.ts` | HTTP POST multipart/form-data |
| CREATE | `src/features/localization/data/repositories/localization-repository-impl.ts` | Bridges DS → domain |
| CREATE | `src/features/localization/presentation/context/localization-context.tsx` | Provider + `useLocalization()` |
| CREATE | `src/features/localization/presentation/components/series-picker.tsx` | Renders filtered scan list |
| CREATE | `src/features/localization/presentation/screens/localization-form-screen.tsx` | Full form screen |
| CREATE | `src/features/localization/presentation/components/located-marker.tsx` | R3F sphere + pulse animation |
| CREATE | `src/features/localization/presentation/screens/localization-result-screen.tsx` | Viewer + marker overlay |
| CREATE | `src/app/(app)/localization.tsx` | Route file wrapping `LocalizationFormScreen` |
| CREATE | `src/app/(app)/localization-result.tsx` | Route file wrapping `LocalizationResultScreen` |
| MODIFY | `src/core/constants/tokens.ts` | Add `Localization_RemoteDS`, `Localization_Repo` |
| MODIFY | `src/core/di/di-provider.tsx` | Wire new DS + Repo |
| MODIFY | `src/app/_layout.tsx` | Add `LocalizationProvider` to provider stack |
| MODIFY | `src/features/viewer/domain/entities/ply-cloud.ts` | Add `centeringOffset: THREE.Vector3` |
| MODIFY | `src/features/viewer/data/repositories/ply-repository-impl.ts` | Center geometry + capture `centeringOffset` at parse time |
| MODIFY | `src/features/viewer/presentation/components/point-cloud-3d.tsx` | Remove `geometry.center()` call (geometry is now pre-centered) |
| MODIFY | `src/features/viewer/presentation/components/point-cloud-canvas.tsx` | Accept optional `markerPoint?: THREE.Vector3` |
| MODIFY | `src/features/scan/presentation/screens/scan-screen.tsx` | Add MapPin FAB → navigate to `/localization` |

---

## Task 1: Domain entities and repository interface

**Files:**
- Create: `src/features/localization/domain/entities/localization-result.ts`
- Create: `src/features/localization/domain/repositories/localization-repository.ts`

- [ ] **Step 1: Create `LocalizationResult` entity**

```typescript
// src/features/localization/domain/entities/localization-result.ts
export type LocalizationResult = {
  x: number;
  y: number;
  z: number;
};
```

- [ ] **Step 2: Create `LocalizationRepository` interface**

```typescript
// src/features/localization/domain/repositories/localization-repository.ts
import { LocalizationResult } from '@/features/localization/domain/entities/localization-result';

export type LocalizationImageParam = {
  uri: string;
  name: string;
  type: string;
};

export interface LocalizationRepository {
  localize(serie: string, image: LocalizationImageParam): Promise<LocalizationResult>;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/localization/
git commit -m "feat(localization): add domain entity and repository interface"
```

---

## Task 2: Data layer — remote datasource

**Files:**
- Create: `src/features/localization/data/datasources/localization-remote-data-source.ts`
- Create: `src/features/localization/data/datasources/localization-remote-data-source-impl.ts`
- Create: `src/features/localization/data/repositories/localization-repository-impl.ts`

The endpoint is `POST {EXPO_PUBLIC_RECONSTRUCTION_API_URL}/localize` receiving `multipart/form-data` with fields `image` (file) and `serie` (string). It returns `{ x: number, y: number, z: number }`.

- [ ] **Step 1: Create datasource interface**

```typescript
// src/features/localization/data/datasources/localization-remote-data-source.ts
import { LocalizationImageParam } from '@/features/localization/domain/repositories/localization-repository';
import { LocalizationResult } from '@/features/localization/domain/entities/localization-result';

export interface LocalizationRemoteDataSource {
  localize(serie: string, image: LocalizationImageParam): Promise<LocalizationResult>;
}
```

- [ ] **Step 2: Create datasource implementation**

```typescript
// src/features/localization/data/datasources/localization-remote-data-source-impl.ts
import { Platform } from 'react-native';
import { LocalizationRemoteDataSource } from './localization-remote-data-source';
import { LocalizationImageParam } from '@/features/localization/domain/repositories/localization-repository';
import { LocalizationResult } from '@/features/localization/domain/entities/localization-result';

const TIMEOUT_MS = 30_000;

export class LocalizationRemoteDataSourceImpl implements LocalizationRemoteDataSource {
  async localize(serie: string, image: LocalizationImageParam): Promise<LocalizationResult> {
    const formData = new FormData();
    formData.append('serie', serie);

    if (Platform.OS === 'web') {
      const res = await fetch(image.uri);
      const blob = await res.blob();
      formData.append('image', new File([blob], image.name, { type: image.type }));
    } else {
      // React Native FormData accepts { uri, name, type } directly
      formData.append('image', { uri: image.uri, name: image.name, type: image.type } as unknown as Blob);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(
        `${process.env.EXPO_PUBLIC_RECONSTRUCTION_API_URL}/localize`,
        {
          method: 'POST',
          body: formData,
          headers: { 'ngrok-skip-browser-warning': '1' },
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      if (response.status === 404) throw new Error('Serie no encontrada en el servidor.');
      if (response.status === 422) throw new Error('La imagen no es válida o no puede localizarse en este modelo.');
      throw new Error(`Error del servidor (HTTP ${response.status})`);
    }

    const body = await response.json() as { x: number; y: number; z: number };
    if (typeof body.x !== 'number' || typeof body.y !== 'number' || typeof body.z !== 'number') {
      throw new Error('Respuesta del servidor inválida: coordenadas faltantes.');
    }

    return { x: body.x, y: body.y, z: body.z };
  }
}
```

- [ ] **Step 3: Create repository implementation**

```typescript
// src/features/localization/data/repositories/localization-repository-impl.ts
import { LocalizationRemoteDataSource } from '@/features/localization/data/datasources/localization-remote-data-source';
import { LocalizationRepository, LocalizationImageParam } from '@/features/localization/domain/repositories/localization-repository';
import { LocalizationResult } from '@/features/localization/domain/entities/localization-result';

export class LocalizationRepositoryImpl implements LocalizationRepository {
  constructor(private readonly remoteDS: LocalizationRemoteDataSource) {}

  localize(serie: string, image: LocalizationImageParam): Promise<LocalizationResult> {
    return this.remoteDS.localize(serie, image);
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/features/localization/
git commit -m "feat(localization): add data layer (datasource + repository impl)"
```

---

## Task 3: DI tokens and wiring

**Files:**
- Modify: `src/core/constants/tokens.ts`
- Modify: `src/core/di/di-provider.tsx`

- [ ] **Step 1: Add tokens**

In `src/core/constants/tokens.ts`, add to the `TOKENS` object:

```typescript
  // localization
  Localization_RemoteDS: Symbol("Localization_RemoteDS"),
  Localization_Repo:     Symbol("Localization_Repo"),
```

- [ ] **Step 2: Wire in DIProvider**

In `src/core/di/di-provider.tsx`, add imports:

```typescript
import { LocalizationRemoteDataSourceImpl } from "@/features/localization/data/datasources/localization-remote-data-source-impl";
import { LocalizationRepositoryImpl } from "@/features/localization/data/repositories/localization-repository-impl";
```

Then inside the `useMemo` block, after the `ar` wiring block:

```typescript
        // localization
        const localizationRemoteDS = new LocalizationRemoteDataSourceImpl();
        const localizationRepo = new LocalizationRepositoryImpl(localizationRemoteDS);
        c.register(TOKENS.Localization_RemoteDS, localizationRemoteDS)
         .register(TOKENS.Localization_Repo, localizationRepo);
```

- [ ] **Step 3: Commit**

```bash
git add src/core/constants/tokens.ts src/core/di/di-provider.tsx
git commit -m "feat(localization): register DI tokens and wire implementations"
```

---

## Task 4: Localization context (state management)

**Files:**
- Create: `src/features/localization/presentation/context/localization-context.tsx`
- Modify: `src/app/_layout.tsx`

- [ ] **Step 1: Create LocalizationContext**

```typescript
// src/features/localization/presentation/context/localization-context.tsx
import { TOKENS } from '@/core/constants/tokens';
import { useDI } from '@/core/di/di-provider';
import { LocalizationResult } from '@/features/localization/domain/entities/localization-result';
import { LocalizationRepository, LocalizationImageParam } from '@/features/localization/domain/repositories/localization-repository';
import { Scan } from '@/features/scan/domain/entities/scan';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type PickedImage = {
  uri: string;
  name: string;
  type: string;
};

type LocalizationContextType = {
  selectedScan: Scan | null;
  image: PickedImage | null;
  submitting: boolean;
  error: string | null;
  result: LocalizationResult | null;
  setSelectedScan: (scan: Scan | null) => void;
  setImage: (image: PickedImage | null) => void;
  submit: () => Promise<boolean>;
  reset: () => void;
};

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const di = useDI();
  const repo = useMemo(() => di.resolve<LocalizationRepository>(TOKENS.Localization_Repo), [di]);

  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [image, setImage] = useState<PickedImage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LocalizationResult | null>(null);

  const submit = useCallback(async (): Promise<boolean> => {
    if (!selectedScan || !image) return false;
    setSubmitting(true);
    setError(null);
    try {
      const coord = await repo.localize(selectedScan.serie, image);
      setResult(coord);
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al localizar. Intenta de nuevo.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [repo, selectedScan, image]);

  const reset = useCallback(() => {
    setSelectedScan(null);
    setImage(null);
    setError(null);
    setResult(null);
  }, []);

  return (
    <LocalizationContext.Provider value={{
      selectedScan, image, submitting, error, result,
      setSelectedScan, setImage, submit, reset,
    }}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization(): LocalizationContextType {
  const ctx = useContext(LocalizationContext);
  if (!ctx) throw new Error('useLocalization debe usarse dentro de LocalizationProvider');
  return ctx;
}
```

- [ ] **Step 2: Add LocalizationProvider to root layout**

In `src/app/_layout.tsx`, add import:

```typescript
import { LocalizationProvider } from '@/features/localization/presentation/context/localization-context';
```

Wrap the provider stack. Insert `LocalizationProvider` immediately inside `ViewerProvider` and outside `ReconstructionProvider`:

```tsx
<ViewerProvider>
  <LocalizationProvider>   {/* ← NEW */}
    <ReconstructionProvider>
      <ScanProvider>
        ...
      </ScanProvider>
    </ReconstructionProvider>
  </LocalizationProvider>  {/* ← NEW */}
</ViewerProvider>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors related to localization files.

- [ ] **Step 4: Commit**

```bash
git add src/features/localization/presentation/context/ src/app/_layout.tsx
git commit -m "feat(localization): add LocalizationContext provider and wire into root layout"
```

---

## Task 5: Move geometry centering to parse time; add centeringOffset to PlyCloud

Currently, `geometry.center()` is called inside `PointCloud3D.useEffect` at render time (see `src/features/viewer/presentation/components/point-cloud-3d.tsx:16`). For the marker to work, we need the centering offset captured **at the same time and place** that centering happens. The cleanest solution is to move centering to parse time (repository), remove it from `PointCloud3D`, and store the offset in `PlyCloud`.

This makes the contract clear: `PlyCloud.geometry` is **always pre-centered**. `PointCloud3D` only needs to position the camera — it no longer needs to mutate geometry at render time.

**Files:**
- Modify: `src/features/viewer/domain/entities/ply-cloud.ts`
- Modify: `src/features/viewer/data/repositories/ply-repository-impl.ts`
- Modify: `src/features/viewer/presentation/components/point-cloud-3d.tsx`

- [ ] **Step 1: Add `centeringOffset` to `PlyCloud`**

```typescript
// src/features/viewer/domain/entities/ply-cloud.ts
import * as THREE from 'three';

export type PlyCloud = {
  geometry: THREE.BufferGeometry;
  vertexCount: number;
  originalVertexCount: number;
  hasColors: boolean;
  boundingBox: THREE.Box3;
  centeringOffset: THREE.Vector3;   // bbox center before centering; used to adjust marker coordinates
};
```

- [ ] **Step 2: Center geometry at parse time and capture offset**

In `src/features/viewer/data/repositories/ply-repository-impl.ts`, update `parse()`:

```typescript
  private async parse(fileUri: string): Promise<PlyCloud> {
    const { geometry, vertexCount, hasColors } = await this.parser.parse(fileUri, MAX_POINTS);
    geometry.computeBoundingBox();
    const centeringOffset = new THREE.Vector3();
    geometry.boundingBox!.getCenter(centeringOffset);   // capture offset BEFORE centering
    geometry.center();                                   // centers geometry; geometry.boundingBox updated automatically
    return {
      geometry,
      vertexCount,
      originalVertexCount: vertexCount,
      hasColors,
      boundingBox: geometry.boundingBox ?? new THREE.Box3(),
      centeringOffset,
    };
  }
```

- [ ] **Step 3: Remove geometry.center() from PointCloud3D**

`PointCloud3D` previously centered the geometry in its `useEffect`. Since the geometry is now pre-centered at parse time, remove that call. Only camera positioning and bounding-sphere computation remain.

Open `src/features/viewer/presentation/components/point-cloud-3d.tsx` and update `useEffect`:

```typescript
  useEffect(() => {
    if (!pointsRef.current) return;

    geometry.computeBoundingSphere();   // geometry is already centered; just compute sphere for camera

    const sphere = geometry.boundingSphere!;
    const distance = sphere.radius * 2.5;

    camera.position.set(0, 0, distance);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.near = distance * 0.001;
      camera.far = distance * 100;
      camera.updateProjectionMatrix();
    }
  }, [geometry, camera]);
```

The only removed line is `geometry.center();` — everything else is unchanged.

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 5: Commit**

```bash
git add src/features/viewer/domain/entities/ply-cloud.ts \
        src/features/viewer/data/repositories/ply-repository-impl.ts \
        src/features/viewer/presentation/components/point-cloud-3d.tsx
git commit -m "feat(viewer): move geometry centering to parse time; expose centeringOffset in PlyCloud"
```

---

## Task 6: LocatedMarker 3D component

**Files:**
- Create: `src/features/localization/presentation/components/located-marker.tsx`

This component renders a pulsing red sphere at `position` (already in centered cloud space). It lives inside the R3F Canvas alongside `PointCloud3D`.

- [ ] **Step 1: Create `LocatedMarker`**

```typescript
// src/features/localization/presentation/components/located-marker.tsx
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber/native';

interface Props {
  position: THREE.Vector3;
  radius?: number;
}

export function LocatedMarker({ position, radius = 0.05 }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const scaleRef = useRef(1);
  const dirRef = useRef(1);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    scaleRef.current += dirRef.current * delta * 1.2;
    if (scaleRef.current > 1.5) dirRef.current = -1;
    if (scaleRef.current < 0.8) dirRef.current = 1;
    const s = scaleRef.current;
    meshRef.current.scale.set(s, s, s);
  });

  return (
    <mesh ref={meshRef} position={[position.x, position.y, position.z]}>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
    </mesh>
  );
}
```

`radius` defaults to 5% of one world-unit. The consuming screen can scale it relative to `cloud.boundingBox` size if needed (see Task 9).

- [ ] **Step 2: Commit**

```bash
git add src/features/localization/presentation/components/located-marker.tsx
git commit -m "feat(localization): add LocatedMarker pulsing sphere component"
```

---

## Task 7: Extend PointCloudCanvas with optional markerPoint

**Files:**
- Modify: `src/features/viewer/presentation/components/point-cloud-canvas.tsx`

- [ ] **Step 1: Accept and render optional markerPoint**

```typescript
// src/features/viewer/presentation/components/point-cloud-canvas.tsx
import { PlyCloud } from '@/features/viewer/domain/entities/ply-cloud';
import { FpsCounter } from '@/features/viewer/presentation/components/fps-counter';
import { HUD } from '@/features/viewer/presentation/components/hud';
import { PointCloud3D } from '@/features/viewer/presentation/components/point-cloud-3d';
import { LocatedMarker } from '@/features/localization/presentation/components/located-marker';
import { Canvas } from '@react-three/fiber/native';
import useControls from 'r3f-native-orbitcontrols';
import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { View } from 'react-native';

interface Props {
  cloud: PlyCloud;
  markerPoint?: THREE.Vector3;
}

export function PointCloudCanvas({ cloud, markerPoint }: Props) {
  const [OrbitControls, events] = useControls();
  const [fps, setFps] = useState(0);

  const markerRadius = useMemo(() => {
    if (!markerPoint) return 0.05;
    const size = new THREE.Vector3();
    cloud.boundingBox.getSize(size);
    return Math.max(size.x, size.y, size.z) * 0.012;
  }, [cloud.boundingBox, markerPoint]);

  return (
    <View className="flex-1" {...events}>
      <Canvas>
        <OrbitControls />
        <ambientLight intensity={1} />
        <PointCloud3D geometry={cloud.geometry} />
        {markerPoint && (
          <LocatedMarker position={markerPoint} radius={markerRadius} />
        )}
        <FpsCounter onFps={setFps} />
      </Canvas>
      <HUD cloud={cloud} fps={fps} />
    </View>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 3: Commit**

```bash
git add src/features/viewer/presentation/components/point-cloud-canvas.tsx
git commit -m "feat(viewer): accept optional markerPoint prop in PointCloudCanvas"
```

---

## Task 8: SeriesPicker component

**Files:**
- Create: `src/features/localization/presentation/components/series-picker.tsx`

This component receives the full `scans` array from `ScanContext`, filters to those with a non-empty `localUri`, and renders a vertical selection list. Empty state is shown if no scans are downloaded.

- [ ] **Step 1: Create `SeriesPicker`**

```typescript
// src/features/localization/presentation/components/series-picker.tsx
import { Button } from '@/core/components/ui/button';
import { Text } from '@/core/components/ui/text';
import { Scan } from '@/features/scan/domain/entities/scan';
import { Check } from 'lucide-react-native';
import React from 'react';
import { ScrollView, View } from 'react-native';

function displayName(serie: string, jobId: string): string {
  const suffix = `_${jobId}`;
  return serie.endsWith(suffix) ? serie.slice(0, -suffix.length) : serie;
}

interface Props {
  scans: Scan[];
  selected: Scan | null;
  onSelect: (scan: Scan) => void;
  disabled?: boolean;
}

export function SeriesPicker({ scans, selected, onSelect, disabled }: Props) {
  const downloadedScans = scans.filter(s => !!s.localUri);

  if (downloadedScans.length === 0) {
    return (
      <View className="rounded-2xl border border-dashed border-gray-300 px-4 py-6 items-center gap-2">
        <Text className="text-gray-400 text-center text-sm">
          Ninguna serie descargada.{'\n'}Descarga un modelo desde "Mis escaneos" primero.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ maxHeight: 200 }}
      contentContainerStyle={{ gap: 8 }}
      showsVerticalScrollIndicator={false}
    >
      {downloadedScans.map(scan => {
        const isSelected = selected?._id === scan._id;
        return (
          <Button
            key={scan._id}
            variant={isSelected ? 'default' : 'outline'}
            onPress={() => !disabled && onSelect(scan)}
            disabled={disabled}
            className="flex-row justify-between items-center"
          >
            <Text className={isSelected ? 'text-white' : undefined}>
              {displayName(scan.serie, scan.jobId)}
            </Text>
            {isSelected && <Check size={16} color="white" />}
          </Button>
        );
      })}
    </ScrollView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/localization/presentation/components/series-picker.tsx
git commit -m "feat(localization): add SeriesPicker component filtered by localUri"
```

---

## Task 9: LocalizationFormScreen

**Files:**
- Create: `src/features/localization/presentation/screens/localization-form-screen.tsx`
- Create: `src/app/(app)/localization.tsx`

**UI Layout:**
```
┌─────────────────────────────────┐
│ ←  Localización                 │  ← back button + title
├─────────────────────────────────┤
│  1. Selecciona una serie        │  ← section label
│  [ SeriesPicker ]               │
│                                 │
│  2. Sube una imagen             │  ← section label
│  [ thumbnail | Seleccionar... ] │  ← image pick area
│                                 │
│  [error box if error]           │
│                                 │
│  [ Localizar ]                  │  ← submit button, disabled until both selected
└─────────────────────────────────┘
```

- [ ] **Step 1: Create the screen**

```typescript
// src/features/localization/presentation/screens/localization-form-screen.tsx
import { Button } from '@/core/components/ui/button';
import { Text } from '@/core/components/ui/text';
import { useLocalization } from '@/features/localization/presentation/context/localization-context';
import { SeriesPicker } from '@/features/localization/presentation/components/series-picker';
import { useScan } from '@/features/scan/presentation/context/scan-context';
import { useViewer } from '@/features/viewer/presentation/context/viewer-context';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import { RelativePathString, useRouter } from 'expo-router';
import { ChevronLeft, ImageIcon } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';

export function LocalizationFormScreen() {
  const router = useRouter();
  const { scans } = useScan();
  const { loadFromPath } = useViewer();
  const {
    selectedScan, image, submitting, error,
    setSelectedScan, setImage, submit, reset,
  } = useLocalization();

  const pickImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      setImage({
        uri: asset.uri,
        name: asset.name ?? `query_${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      });
    } catch {
      Alert.alert('Error', 'No se pudo abrir la galería.');
    }
  };

  const handleSubmit = async () => {
    const ok = await submit();
    if (!ok) return;
    // Load the PLY from local cache; loadFromPath returns false on error (never throws)
    const loaded = await loadFromPath(selectedScan!.localUri);
    if (!loaded) {
      Alert.alert('Error', 'No se pudo cargar el modelo PLY local. Intenta descargarlo de nuevo desde Mis escaneos.');
      return;
    }
    router.push('/localization-result' as RelativePathString);
  };

  const handleBack = () => {
    reset();
    router.back();
  };

  const canSubmit = !!selectedScan && !!image && !submitting;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-5 pt-10 pb-4 gap-3">
        <Button
          variant="secondary"
          onPress={handleBack}
          className="rounded-full w-[44px] h-[44px] items-center justify-center p-0"
        >
          <ChevronLeft size={20} color="#374151" />
        </Button>
        <Text variant="h3" className="text-gray-900">Localización</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 24 }}
      >
        {/* Step 1: Series */}
        <View className="gap-3">
          <Text className="text-gray-700 font-semibold">1. Selecciona una serie descargada</Text>
          <SeriesPicker
            scans={scans}
            selected={selectedScan}
            onSelect={setSelectedScan}
            disabled={submitting}
          />
        </View>

        {/* Step 2: Image */}
        <View className="gap-3">
          <Text className="text-gray-700 font-semibold">2. Sube una imagen de referencia</Text>
          <Pressable onPress={submitting ? undefined : pickImage}>
            {image ? (
              <Image
                source={{ uri: image.uri }}
                style={{ width: '100%', height: 200, borderRadius: 16 }}
                contentFit="cover"
              />
            ) : (
              <View className="w-full h-32 rounded-2xl border border-dashed border-blue-400 items-center justify-center gap-2">
                <ImageIcon size={28} color="#93C5FD" />
                <Text className="text-blue-400 text-sm">Toca para seleccionar imagen</Text>
              </View>
            )}
          </Pressable>
          {image && !submitting && (
            <Button variant="ghost" onPress={pickImage}>
              <Text className="text-blue-500 text-sm">Cambiar imagen</Text>
            </Button>
          )}
        </View>

        {/* Error */}
        {!!error && (
          <View className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <Text className="text-sm text-destructive">{error}</Text>
          </View>
        )}

        {/* Submit */}
        <Button onPress={handleSubmit} disabled={!canSubmit}>
          {submitting
            ? <ActivityIndicator size="small" color="white" />
            : <Text>Localizar</Text>
          }
        </Button>
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 2: Create route file**

```typescript
// src/app/(app)/localization.tsx
import { LocalizationFormScreen } from '@/features/localization/presentation/screens/localization-form-screen';
import React from 'react';

export default function LocalizationRoute() {
  return <LocalizationFormScreen />;
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 4: Commit**

```bash
git add src/features/localization/presentation/screens/localization-form-screen.tsx \
        src/app/(app)/localization.tsx
git commit -m "feat(localization): add localization form screen and route"
```

---

## Task 10: LocalizationResultScreen

**Files:**
- Create: `src/features/localization/presentation/screens/localization-result-screen.tsx`
- Create: `src/app/(app)/localization-result.tsx`

This screen reads from `ViewerContext` (for `cloud`) and `LocalizationContext` (for `result`). It computes the adjusted marker position (`rawCoord - centeringOffset`) and passes it to `PointCloudCanvas`.

- [ ] **Step 1: Create the screen**

```typescript
// src/features/localization/presentation/screens/localization-result-screen.tsx
import { Button } from '@/core/components/ui/button';
import { Text } from '@/core/components/ui/text';
import { useLocalization } from '@/features/localization/presentation/context/localization-context';
import { PointCloudCanvas } from '@/features/viewer/presentation/components/point-cloud-canvas';
import { useViewer } from '@/features/viewer/presentation/context/viewer-context';
import { RelativePathString, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ActivityIndicator, View } from 'react-native';

export function LocalizationResultScreen() {
  const router = useRouter();
  const { cloud, loading } = useViewer();
  const { result, reset } = useLocalization();

  const markerPoint = useMemo(() => {
    if (!result || !cloud) return undefined;
    // Adjust from original PLY space to centered geometry space
    return new THREE.Vector3(result.x, result.y, result.z).sub(cloud.centeringOffset);
  }, [result, cloud]);

  const handleBack = () => {
    reset();
    router.push('/(app)/(tabs)/scan' as RelativePathString);
  };

  if (loading || !cloud) {
    return (
      <View className="flex-1 bg-[#0f0f1a] items-center justify-center gap-4">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-400">Cargando modelo…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0f0f1a]">
      <PointCloudCanvas cloud={cloud} markerPoint={markerPoint} />

      {/* Back button */}
      <View className="absolute top-12 right-5">
        <Button
          variant="secondary"
          onPress={handleBack}
          className="rounded-full w-[44px] h-[44px] items-center justify-center p-0"
        >
          <ChevronLeft size={20} color="#374151" />
        </Button>
      </View>

      {/* Coordinate HUD */}
      {result && (
        <View className="absolute bottom-8 left-5 right-5 bg-black/60 rounded-2xl px-4 py-3">
          <Text className="text-white text-xs text-center font-mono">
            {`X: ${result.x.toFixed(3)}  Y: ${result.y.toFixed(3)}  Z: ${result.z.toFixed(3)}`}
          </Text>
        </View>
      )}
    </View>
  );
}
```

- [ ] **Step 2: Create route file**

```typescript
// src/app/(app)/localization-result.tsx
import { LocalizationResultScreen } from '@/features/localization/presentation/screens/localization-result-screen';
import React from 'react';

export default function LocalizationResultRoute() {
  return <LocalizationResultScreen />;
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 4: Commit**

```bash
git add src/features/localization/presentation/screens/localization-result-screen.tsx \
        src/app/(app)/localization-result.tsx
git commit -m "feat(localization): add result screen with marker-adjusted coordinate overlay"
```

---

## Task 11: FAB in ScanScreen

**Files:**
- Modify: `src/features/scan/presentation/screens/scan-screen.tsx`

Add a third FAB below the existing two, using the `MapPin` icon from `lucide-react-native`. Navigates to `/localization`.

- [ ] **Step 1: Add MapPin import**

In `scan-screen.tsx`, update the lucide import:

```typescript
import { ArrowUpFromLine, Camera, MapPin, Plus, X } from 'lucide-react-native';
```

- [ ] **Step 2: Add the third FAB**

In the FAB stack `<View className="absolute bottom-8 right-6 gap-3">`, add after the ArrowUpFromLine button:

```tsx
<Button
  onPress={() => router.push('/localization' as RelativePathString)}
  variant="secondary"
  className="w-14 h-14 rounded-full shadow-lg items-center justify-center"
>
  <MapPin size={22} color="#374151" />
</Button>
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 4: Commit**

```bash
git add src/features/scan/presentation/screens/scan-screen.tsx
git commit -m "feat(scan): add MapPin FAB to navigate to localization screen"
```

---

## Task 12: Manual smoke test

No automated test suite exists. Follow this manual test checklist to verify the full flow:

- [ ] **Step 1: Start dev server**

```bash
npx expo start --port 8083
```

- [ ] **Step 2: Test — no downloaded scans**

  1. Navigate to Scan screen.
  2. Tap MapPin FAB.
  3. Verify `SeriesPicker` shows the "Ninguna serie descargada" empty state.
  4. Verify "Localizar" button is disabled.

- [ ] **Step 3: Test — happy path**

  1. Download a scan model ("Ver Modelo") so it has a `localUri`.
  2. Navigate back, tap MapPin FAB.
  3. Verify the downloaded scan appears in `SeriesPicker`.
  4. Select it — verify it shows a checkmark and the button highlights.
  5. Tap the image area — pick any image from the device.
  6. Verify thumbnail renders.
  7. Tap "Localizar" — verify spinner appears, button disabled.
  8. On success: verify navigation to `/localization-result`, PLY loads, red pulsing sphere visible, coordinate HUD at bottom.
  9. Tap back — verify it returns to scan list.

- [ ] **Step 4: Test — error states**

  1. With no server running: verify error message appears in the red error box, screen does **not** navigate away.
  2. Tap the back button before submitting — verify `reset()` is called (no stale state if you re-enter).

- [ ] **Step 5: Test — cancel image pick**

  1. Tap image area.
  2. Cancel the picker without selecting anything.
  3. Verify still on localization screen, image still `null`, submit button still disabled.

---

## Edge Cases Reference

| Case | Handling |
|------|----------|
| User cancels image picker | `result.canceled` check in `pickImage`; image stays `null`; form blocks submit |
| No downloaded scans | `SeriesPicker` empty-state UI; submit button disabled |
| API returns non-200 | Error set in context; red error box shown; no navigation |
| API 404 (serie not found) | Specific message: "Serie no encontrada en el servidor." |
| API 422 (bad image) | Specific message: "La imagen no es válida o no puede localizarse en este modelo." |
| Request timeout (30 s) | `AbortController` fires; fetch throws; error set |
| Response missing x/y/z | Explicit type-check in impl; throws with "coordenadas faltantes" |
| Coordinate outside bbox | Marker renders outside visible point cloud. No crash. Users can orbit to find it. |
| PLY load fails after API success | `ViewerContext.loadFromPath` returns `false`; result screen shows loading spinner indefinitely. Consider: check `loading` + `!cloud` combo and add an error fallback text in `LocalizationResultScreen`. |
| Back pressed during submit | `submitting` flag disables all interactive elements; navigation blocked until request settles |
| User re-enters form without resetting | `reset()` called in `handleBack` and `handleSubmit` back paths; fresh state guaranteed |

---

## Performance Notes

- **Image compression (optional):** Before uploading, optionally resize the image to max 1080px on the long edge using `expo-image-manipulator`. This reduces upload time on slow connections. Not required for MVP.
- **PLY memory:** `geometry.center()` modifies the geometry in-place — no extra copy. The `centeringOffset` is a single `THREE.Vector3` (24 bytes). No memory overhead.
- **Marker animation:** `useFrame` runs at display refresh rate. The pulse animation uses scalar math only — negligible GPU cost.
- **Marker radius:** Scaled to 1.2% of the model's largest dimension so it's visible on both small and large scans without manual tuning.
