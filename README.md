# UniWhere — Cliente móvil oficial

Cliente multiplataforma del proyecto **UniWhere** (Universidad del Norte): aplicación de wayfinding indoor que permite capturar entornos, reconstruirlos en 3D, visualizar nubes de puntos, localizarse visualmente dentro de un modelo (ACE) y explorar rutas con una capa AR sobre la cámara del dispositivo.

Es la **app móvil oficial** del monorepo UniWhere. Se conecta al backend de reconstrucción/localización y a **Roble OpenLab** para autenticación y persistencia de datos de usuario.

| Aspecto | Detalle |
|---------|---------|
| Framework | [Expo SDK 55](https://docs.expo.dev/) / React Native 0.83 |
| Gestor de paquetes | `pnpm` (Node ≥ 20) |
| Plataformas | Android, iOS, Web |
| Routing | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based) |
| UI | NativeWind 4 + [react-native-reusables](https://reactnativereusables.com/) |
| 3D | Three.js + `@react-three/fiber` |

---

## Relación con UniWhere

Este repositorio es un **submódulo Git** del monorepo [UniWhere](https://github.com/cristian10gf/UniWhere). Materializa en el dispositivo móvil las etapas de **captura**, **visualización 3D** y **localización puntual** del pipeline completo (MapAnything → ACE → NKSR → Recast), documentado en el monorepo padre.

Para detalles de endpoints del backend, arquitectura del sistema y validación, ver la documentación en `docs/` del repositorio principal.

## Funcionalidades principales

### Autenticación
Registro, inicio y cierre de sesión contra la API Roble con JWT (`accessToken` + `refreshToken`). Restauración automática de sesión al abrir la app.

### Escaneos (`scan`)
Biblioteca personal de reconstrucciones 3D: listado con miniaturas (*portadas*), creación de nuevos escaneos, detalle por serie y eliminación. Cada escaneo guarda metadatos en la base Roble (`scan`) y la ruta local del PLY descargado.

### Reconstrucción 3D (`reconstruction`)
Envío de fotos al pipeline remoto (`POST /reconstruct`), seguimiento del job (`GET /status/{jobId}`) y descarga del resultado en formato PLY (nube densa o Gaussian splat).

### Visor 3D (`viewer`)
Parser y renderizado de PLY binario con `@react-three/fiber`: órbita táctil, downsampling para modelos grandes, soporte de color por vértice y contador de FPS.

### Localización visual (`localization`)
Consulta puntual de posición 3D mediante ACE: el usuario envía una foto (`POST /{serie}/localize`) y el resultado se muestra como marcador pulsante sobre la nube de puntos del escaneo seleccionado.

### AR de ruta (`ar`)
AR pseudo-inmersiva con `expo-camera` + canvas transparente Three.js: grilla 8×8 para dibujar rutas, persistencia local y modelos 3D (*breadcrumbs*) superpuestos sobre la vista de cámara.

### Ajustes (`settings`)
Perfil de usuario (nombre, rol, correo) leído desde la sesión activa.

---

## Arquitectura

El proyecto sigue **Clean Architecture** organizada por **features** (`src/features/<nombre>/`). Cada feature tiene tres capas:

```
src/features/<feature>/
  domain/          entidades + interfaces de repositorio
  data/            datasources (HTTP, archivos) + implementaciones de repositorio
  presentation/    pantallas, componentes y React Context
```

La capa de dominio no depende de React ni de APIs externas. Los repositorios actúan como fachada entre dominio y datos. El estado de UI se gestiona con **React Context** (sin Redux ni Zustand).

### Inyección de dependencias

DI manual con contenedor basado en `symbol` (`src/core/di/`):

- `Container` — registro y resolución de singletons por token.
- `DIProvider` — cablea todas las implementaciones al arrancar la app.
- `useDI()` — hook para resolver dependencias en contextos y pantallas.
- `TOKENS` — símbolos tipados en `src/core/constants/tokens.ts`.

En tests, `DIProvider` acepta `overrides` para sustituir implementaciones reales por mocks sin tocar el código de producción.

```
AuthProvider / ScanProvider / …
        ↓ useDI()
   DIProvider → Container
        ↓ resolve(TOKENS.XRepo)
   RepositoryImpl → DataSourceImpl → fetch / FileSystem / AsyncStorage
```

Documentación de arquitectura detallada: [`docs/CLAUDE.md`](docs/CLAUDE.md).

---

## Enfoque móvil

### HTTP

Toda la comunicación de red usa la API nativa **`fetch`**. No hay cliente HTTP externo (Axios, etc.).

| Servicio | Base URL (env) | Uso |
|----------|----------------|-----|
| Roble Auth | `EXPO_PUBLIC_API_BASE_URL` | Login, signup, refresh, logout, verify |
| Roble DB | `EXPO_PUBLIC_API_BASE_URL` | CRUD de tablas `user` y `scan` |
| Pipeline 3D | `EXPO_PUBLIC_RECONSTRUCTION_API_URL` | Reconstrucción, descarga PLY, portadas, localización ACE |

Patrones habituales:

- **Multipart/form-data** para subida de fotos (reconstrucción y localización), con adaptación web (`File`/`Blob`) vs nativo (`{ uri, name, type }`).
- **Reintento transparente en 401**: los datasources de `scan` renuevan el JWT con `refresh-token` y repiten la petición.
- **Timeouts** en localización (30 s con `AbortController`).
- Cabecera `ngrok-skip-browser-warning` en llamadas al API de reconstrucción durante desarrollo con túneles.

### Almacenamiento (`storage`)

Capa unificada `ILocalPreferences` → `LocalPreferencesAsyncStorage` (singleton sobre `@react-native-async-storage/async-storage`):

| Clave / patrón | Contenido |
|----------------|-----------|
| `token`, `refreshToken` | JWT de sesión |
| `userId`, `email`, `role`, `name` | Perfil de usuario |
| `portada_cache_{serie}` | URI local de miniatura |
| `ar_route` | Ruta dibujada en la grilla AR |

Archivos grandes (PLY, portadas) se escriben con **`expo-file-system`** (`File`, `Paths.cache`, `Paths.document`), no en AsyncStorage.

### Caché

Estrategia **offline-first parcial** para reducir re-descargas en móvil:

| Recurso | Ubicación | Comportamiento |
|---------|-----------|----------------|
| Miniaturas (`portada`) | `Paths.cache/portada_{serie}.jpg` + clave AsyncStorage | Descarga una vez; reutiliza si el archivo sigue en disco |
| Modelos PLY | `Paths.document/{jobId}_{tipo}.ply` + columna `local_uri` en DB | Al abrir un escaneo, usa el archivo local si existe; si no, descarga y persiste |
| PLY en web | Cache API (`ply-models`) | Cachea buffers en el navegador |
| Descarga directa post-job | `Paths.cache/{serie}_{tipo}.ply` | Tras reconstrucción reciente, antes de abrir el visor |

En web, los PLY grandes se sirven por URL remota sin copia local en disco.

### Seguridad

- Autenticación **JWT** (access + refresh) gestionada por Roble OpenLab.
- Tokens almacenados en AsyncStorage del dispositivo; se limpian en logout y al detectar sesión inválida.
- Peticiones autenticadas a Roble DB llevan `Authorization: Bearer {token}`.
- El API de reconstrucción/localización es de uso interno del pipeline (sin JWT de usuario en esas rutas); la app solo lo invoca tras login para operaciones de usuario.
- Variables sensibles de proyecto van en **`EXPO_PUBLIC_*`** (públicas en el bundle); no incluir secretos de servidor en la app.
- Guard de rutas: `(app)/_layout.tsx` redirige a `/landing` si no hay sesión activa.

### Testing

Stack de pruebas unitarias e integración ligera:

| Herramienta | Rol |
|-------------|-----|
| **Jest** + `jest-expo` | Runner y preset Expo |
| **@testing-library/react-native** | Render y queries de componentes |
| **MSW** | Mock de red con handlers por dominio (`auth`, `scan`, `reconstruction`, `localization`) |
| `DIProvider overrides` | Sustitución de repositorios/datasources en tests |

```bash
pnpm test              # ejecutar suite
pnpm test:coverage     # cobertura (umbral global: 70 % líneas/funciones)
```

Configuración: `jest.config.js`, setup en `__tests__/setup/`. Los mocks nativos (`expo-file-system`, `expo-camera`, etc.) viven en `native-mocks.ts`.

---

## Estructura del proyecto

```
src/
  app/              rutas Expo Router: (auth), (app)/(tabs), viewer, localization, ar-route
  core/             DI, storage, componentes UI, hooks, tokens
  features/
    auth/           JWT + Roble
    scan/           biblioteca de escaneos
    reconstruction/ jobs 3D
    viewer/         parser y canvas PLY
    localization/   ACE puntual
    ar/             ruta + cámara
    settings/       perfil
assets/             fuentes, SVGs, modelos GLB
__tests__/          setup Jest + MSW
docs/CLAUDE.md      referencia técnica completa
```

---

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto (o configurar en EAS):

```env
EXPO_PUBLIC_ROBLE_PROJECT_ID=<id-proyecto-roble>
EXPO_PUBLIC_API_BASE_URL=https://roble-api.openlab.uninorte.edu.co
EXPO_PUBLIC_RECONSTRUCTION_API_URL=https://<tu-backend-reconstruccion>
```

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `EXPO_PUBLIC_ROBLE_PROJECT_ID` | Sí | Identificador del proyecto en Roble |
| `EXPO_PUBLIC_API_BASE_URL` | No | Base de auth y DB (default: OpenLab uninorte) |
| `EXPO_PUBLIC_RECONSTRUCTION_API_URL` | Sí | API de reconstrucción, descarga, portadas y ACE |

---

## Inicio rápido

```bash
# Requisitos: Node ≥ 20, pnpm
pnpm install
pnpm start          # Expo dev server (puerto por defecto 8081)
pnpm android        # build nativo Android
pnpm ios            # build nativo iOS
pnpm web            # versión web
pnpm lint           # ESLint
```

Para development builds con módulos nativos completos, consultar [`eas.json`](eas.json) y la [documentación de Expo](https://docs.expo.dev/develop/development-builds/introduction/).

---

## Relación con UniWhere

Este repositorio es un **submódulo Git** del monorepo [UniWhere](https://github.com/cristian10gf/UniWhere). Materializa en el dispositivo móvil las etapas de **captura**, **visualización 3D** y **localización puntual** del pipeline completo (MapAnything → ACE → NKSR → Recast), documentado en el monorepo padre.

Para detalles de endpoints del backend, arquitectura del sistema y validación, ver la documentación en `docs/` del repositorio principal.
