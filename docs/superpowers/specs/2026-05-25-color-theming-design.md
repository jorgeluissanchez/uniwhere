# Color Theming System Design

**Date:** 2026-05-25
**Status:** Approved

## Overview

Implement a comprehensive, consistent color and theming system for UniWhere using NativeWind's `vars()` API. The system supports two color themes (Índigo and Teal) and two display modes (light and dark), independently controllable, with system-following as the default for display mode.

## Problem Statement

The app currently has:
- 78 hardcoded color classes (`bg-blue-500`, `text-gray-400`, `bg-white`, etc.) that never adapt to dark mode
- `darkMode: 'class'` configured in Tailwind but the dark class is never applied to the root — dark mode is entirely broken
- `button.tsx` uses `text-white` hardcoded instead of `text-primary-foreground`, causing button text in cards to be inconsistent
- Scan screen and several feature screens have no theming — plain white backgrounds
- Token values duplicated across `global.css`, `theme.ts`, and `tailwind.config.js`

## Architecture

### Approach: NativeWind `vars()` + JS-driven tokens + `.dark` class

All CSS custom property values live in `theme.ts` (JS). `AppThemeProvider` applies them to the root `View` via `import { vars } from 'nativewind'`. The same root `View` also receives `className={resolvedScheme === 'dark' ? 'dark' : ''}` so that any `dark:` Tailwind utility classes in components continue to work. Both mechanisms are applied simultaneously — `vars()` injects token values, the `dark` class enables `dark:` variants.

This is chosen over CSS-only class cascade (`.dark.theme-teal`) because `vars()` is reliable on native without depending on CSS selector specificity, while the `dark` class ensures existing `dark:` utilities in the component library are not broken.

### Types

```ts
type ColorTheme = 'indigo' | 'teal'
type ColorScheme = 'light' | 'dark'
type SchemeOverride = 'system' | ColorScheme  // 'system' | 'light' | 'dark'
```

### Two independent dimensions

| Dimension | Type | Default | AsyncStorage key |
|---|---|---|---|
| Color theme | `ColorTheme` | `'indigo'` | `'@theme/colorTheme'` |
| Scheme override | `SchemeOverride` | `'system'` | `'@theme/schemeOverride'` |

`LocalPreferencesAsyncStorage.getInstance().storeData<T>(key, value)` and `.retrieveData<T>(key)` are the methods used (existing API). Values are JSON-serialized strings. On retrieval, values are validated against allowed sets — unrecognized values fall back to the default.

**Resolved scheme logic:**
- `schemeOverride === 'system'` → uses `useColorScheme()` from React Native (follows device)
- `schemeOverride === 'light' | 'dark'` → uses that value regardless of device setting

## Token Architecture

`src/core/constants/theme.ts` is the single source of truth. Structure:

```ts
type ColorTheme = 'indigo' | 'teal'
type ColorScheme = 'light' | 'dark'

// All values are HSL channel strings WITHOUT the hsl() wrapper
// e.g. '239 84% 67%' NOT 'hsl(239 84% 67%)'
// This is required for tailwind.config.js's hsl(var(--primary)) to work correctly
// and for opacity modifiers like bg-primary/10 to function.
interface ColorTokens {
  background: string       // HSL channels
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  destructiveForeground: string
  border: string
  input: string
  ring: string
}

const TOKENS: Record<ColorTheme, Record<ColorScheme, ColorTokens>>
```

**Token value format — critical:** All values are raw HSL channel strings, e.g. `'239 84% 67%'`. `tailwind.config.js` wraps them as `hsl(var(--primary))`. This also enables opacity modifiers: `bg-primary/10` computes as `hsl(var(--primary) / 0.1)`.

**Token structure — shared vs. theme-specific:** Only `primary` and the background-group tokens (`background`, `card`, `popover`) differ between themes. `primaryForeground` is `'0 0% 100%'` (white) on both themes. All other tokens (`destructive`, `border`, `muted`, `secondary`, etc.) are identical across themes and only vary by light/dark scheme. The `TOKENS` record is fully typed for each combination — shared values are simply repeated. No base/override pattern is needed.

**Índigo palette (theme-specific tokens):**
- `primary`: `'239 84% 67%'` (indigo-500) — both light and dark
- Light `background`/`card`/`popover`: `'0 0% 100%'`
- Dark `background`/`card`/`popover`: `'238 40% 8%'` (deep indigo-night)

**Teal palette (theme-specific tokens):**
- `primary`: `'199 89% 48%'` (sky-500) — both light and dark
- Light `background`/`card`/`popover`: `'0 0% 100%'`
- Dark `background`/`card`/`popover`: `'207 60% 8%'` (deep navy)

**Shared tokens** (`primaryForeground`, `foreground`, `cardForeground`, `popoverForeground`, `secondary`, `secondaryForeground`, `muted`, `mutedForeground`, `accent`, `accentForeground`, `destructive`, `destructiveForeground`, `border`, `input`, `ring`) — identical for both themes, only vary by light/dark. Values taken from current `global.css`:
- Light: foreground `'0 0% 3.9%'`, border `'0 0% 89.8%'`, destructive `'0 84.2% 60.2%'`, primaryForeground `'0 0% 100%'`, etc.
- Dark: foreground `'0 0% 98%'`, border `'0 0% 14.9%'`, destructive `'0 70.9% 59.4%'`, primaryForeground `'0 0% 100%'`, etc.

The `NAV_THEME` export (used by react-navigation's `ThemeProvider`) is updated to read from `TOKENS` instead of hardcoded values. It builds full `hsl(...)` strings from the channel values. Mapping:

```ts
NAV_THEME[scheme] = {
  dark: scheme === 'dark',
  colors: {
    background: `hsl(${tokens.background})`,
    border:     `hsl(${tokens.border})`,
    card:       `hsl(${tokens.card})`,
    notification: `hsl(${tokens.destructive})`,
    primary:    `hsl(${tokens.primary})`,
    text:       `hsl(${tokens.foreground})`,
  }
}
```

This is called at runtime with `TOKENS[colorTheme][resolvedScheme]` — `NAV_THEME` becomes a function or is recomputed inside `useTheme()`.

## `tokensToVars()` Contract

`tokensToVars()` maps camelCase token keys to `--kebab-case` CSS variable names, matching the names in `tailwind.config.js`:

```ts
// Input:  { primary: '239 84% 67%', primaryForeground: '0 0% 100%', ... }
// Output: { '--primary': '239 84% 67%', '--primary-foreground': '0 0% 100%', ... }
function tokensToVars(tokens: ColorTokens): Record<string, string> {
  // camelCase → kebab-case mapping for all 19 tokens
}
```

The output is passed directly to NativeWind's `vars()`: `style={vars(tokensToVars(tokens))}`. The CSS variable names must exactly match those in `tailwind.config.js` (e.g., `--card-foreground` not `--cardForeground`).

## Components

### `src/core/providers/app-theme-provider.tsx`

```tsx
import { vars } from 'nativewind'  // NativeWind v4 import

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false)
  const [colorTheme, setColorTheme] = useState<ColorTheme>('indigo')
  const [schemeOverride, setSchemeOverride] = useState<SchemeOverride>('system')
  const systemScheme = useColorScheme() ?? 'light'
  const resolvedScheme = schemeOverride === 'system' ? systemScheme : schemeOverride

  // On mount: read persisted preferences from AsyncStorage.
  // Keep SplashScreen visible until initialized to avoid cold-start flash.
  // prefs is hoisted to component scope so persist effects can reference it
  const prefs = LocalPreferencesAsyncStorage.getInstance()

  useEffect(() => {
    async function load() {
      try {
        const savedTheme = await prefs.retrieveData<ColorTheme>('@theme/colorTheme')
        const savedScheme = await prefs.retrieveData<SchemeOverride>('@theme/schemeOverride')
        if (savedTheme && (['indigo','teal'] as const).includes(savedTheme)) setColorTheme(savedTheme)
        if (savedScheme && (['system','light','dark'] as const).includes(savedScheme)) setSchemeOverride(savedScheme)
      } finally {
        setInitialized(true)  // always unblock — defaults apply on failure
        // SplashScreen.hideAsync() is called from _layout.tsx after fonts load
      }
    }
    void load()
  }, [])

  // Persist on change (skip on initial mount)
  useEffect(() => {
    if (!initialized) return
    void LocalPreferencesAsyncStorage.getInstance().storeData('@theme/colorTheme', colorTheme)
  }, [colorTheme, initialized])

  useEffect(() => {
    if (!initialized) return
    void LocalPreferencesAsyncStorage.getInstance().storeData('@theme/schemeOverride', schemeOverride)
  }, [schemeOverride, initialized])

  if (!initialized) return null  // SplashScreen remains visible until both fonts and theme are ready

  const tokens = TOKENS[colorTheme][resolvedScheme]

  return (
    <AppThemeContext.Provider value={{ colorTheme, schemeOverride, resolvedScheme, setColorTheme, setSchemeOverride }}>
      <View
        className={resolvedScheme === 'dark' ? 'dark flex-1' : 'flex-1'}
        style={vars(tokensToVars(tokens))}
      >
        {children}
      </View>
    </AppThemeContext.Provider>
  )
}
```

**Cold-start flash prevention:** `AppThemeProvider` returns `null` (SplashScreen stays visible) until AsyncStorage is read. `SplashScreen.preventAutoHideAsync()` and `SplashScreen.hideAsync()` remain exclusively in `_layout.tsx` — `AppThemeProvider` does not call either. Since `_layout.tsx` only calls `hideAsync()` after fonts finish loading (an async operation that takes longer than an AsyncStorage read), `initialized` will be `true` before the splash hides in all normal conditions.

**Failure handling:** If AsyncStorage read fails (catch in `LocalPreferencesAsyncStorage`), `savedTheme` / `savedScheme` will be `null`, defaults apply (`indigo`/`system`), and `initialized` is still set to `true`.

### `src/core/hooks/use-app-theme.ts`

```ts
export interface AppThemeContextValue {
  colorTheme: ColorTheme
  schemeOverride: SchemeOverride
  resolvedScheme: ColorScheme
  setColorTheme: (t: ColorTheme) => void
  setSchemeOverride: (s: SchemeOverride) => void
  // Raw token object for cases where a color string is needed (not a class)
  tokens: ColorTokens
}

export function useAppTheme(): AppThemeContextValue
```

The `tokens` field is exposed for the rare case where a raw color string is needed in a non-NativeWind prop (e.g., `ActivityIndicator color` prop, `SvgXml` fill props). Usage: `` `hsl(${tokens.primary})` ``.

### `src/core/hooks/use-theme.ts`

Updated return shape — replaces the current implementation:

```ts
// Before: returned NAV_THEME['light' | 'dark'] based on useColorScheme()
// After:  returns NAV_THEME[resolvedScheme] based on AppThemeContext
export function useTheme(): Theme  // same return type as before (react-navigation Theme)
```

No change to the call site in `_layout.tsx` — only the internal implementation changes.

### `src/app/_layout.tsx`

Provider nesting order (outermost to innermost):

```tsx
<AppThemeProvider>          // NEW — outermost, before everything
  <DIProvider>
    <AuthProvider>
      <ViewerProvider>
        <LocalizationProvider>
          <ReconstructionProvider>
            <ScanProvider>
              <ThemeProvider value={theme}>   // react-navigation, reads from useTheme()
                <ToastProvider>
                  <Stack ... />
                </ToastProvider>
                <PortalHost />
              </ThemeProvider>
            </ScanProvider>
          </ReconstructionProvider>
        </LocalizationProvider>
      </ViewerProvider>
    </AuthProvider>
  </DIProvider>
</AppThemeProvider>
```

`StatusBar` `barStyle` is updated to respond to `resolvedScheme`:
```tsx
<StatusBar barStyle={resolvedScheme === 'dark' ? 'light-content' : 'dark-content'} />
```
`resolvedScheme` is read from `useAppTheme()` in the layout component.

## Settings Screen

`settings-screen.tsx` gains an "Apariencia" `Card` in the bottom half, replacing the plain gray background:

**Display mode control** — `ToggleGroup` with three options:
- ☀ Claro → sets `schemeOverride: 'light'`
- 🌙 Oscuro → sets `schemeOverride: 'dark'`
- ⟳ Auto → sets `schemeOverride: 'system'`

**Color theme control** — `ToggleGroup` with two options, each showing a color swatch dot:
- ◉ Índigo → sets `colorTheme: 'indigo'`
- ◉ Teal → sets `colorTheme: 'teal'`

All hardcoded colors in the screen are replaced with semantic tokens:
- `bg-blue-900` → `bg-primary` (header)
- `bg-blue-800` → `bg-primary/80` (icon buttons)
- `bg-blue-700` → `bg-primary/70` (role badge)
- `text-blue-200` / `text-blue-100` → `text-primary-foreground/70`
- `bg-gray-100` → `bg-background` (bottom half)

The `LinearGradient` fade overlays over the illustration also update: colors change from hardcoded `#F3F4F6` to the resolved `background` token value via `tokens.background` from `useAppTheme()`, formatted as `` `hsl(${tokens.background})` ``.

## Scan Screen

`scan-screen.tsx` is migrated to semantic tokens and gains design. Structural change: individual card `View`s are replaced with the `<Card>` component from `/core/components/ui/card.tsx`. This is a low-risk swap since the scan screen has no gesture responders, animated values, or ref-based measurements on the card elements.

- `bg-gray-50` → `bg-background`
- Scan cards: `<Card>` component (`bg-card border-border`)
- Type chip (dense/sparse): `bg-primary/10 border border-primary/30 text-primary`
- Empty state icon: `color` prop reads `` `hsl(${tokens.primary})` `` via `useAppTheme()`
- Empty state text: `text-muted-foreground`
- `ActivityIndicator color="#3B82F6"` → `` `hsl(${tokens.primary})` `` via `useAppTheme()`

## Component Fixes

### `button.tsx`

Root cause of button text rendering bug in cards: `TextClassContext` from `Card` sets `text-card-foreground` but `Button`'s `buttonTextVariants` uses hardcoded `text-white` for `default` and `destructive` variants. Since `Text` reads the nearest `TextClassContext`, the Card context can bleed into button text when the `TextClassContext.Provider` from `Button` is not the nearest ancestor.

Fix:
- `default` variant: `text-white` → `text-primary-foreground` (correct token for text on `bg-primary`)
- `destructive` variant: `text-white` → `text-destructive-foreground` (correct token for text on `bg-destructive`)

Both `primaryForeground` and `destructiveForeground` resolve to `'0 0% 98%'` / `'0 0% 100%'` — no visual regression. Using the semantically correct token per variant ensures future theme changes are handled correctly.

## `global.css` Changes

**Moved to Step 1** (alongside Provider setup) to avoid a coexistence window where both the CSS values and `vars()` are active simultaneously.

Remove all HSL values from CSS variable declarations. Keep variable name stubs with empty values so Tailwind's JIT compiler recognizes the variable names during build:

```css
@layer base {
  :root {
    --background: ;
    --foreground: ;
    --card: ;
    --card-foreground: ;
    --popover: ;
    --popover-foreground: ;
    --primary: ;
    --primary-foreground: ;
    --secondary: ;
    --secondary-foreground: ;
    --muted: ;
    --muted-foreground: ;
    --accent: ;
    --accent-foreground: ;
    --destructive: ;
    --destructive-foreground: ;
    --border: ;
    --input: ;
    --ring: ;
    --radius: 0.625rem;
  }
}
```

`--radius` retains its value as it is not a color token and is not injected by `vars()`.

## Color Migration Map

All 78 hardcoded color instances across the codebase follow this mapping:

| Hardcoded class | Semantic token |
|---|---|
| `bg-white`, `bg-gray-50`, `bg-gray-100` | `bg-background` |
| `bg-blue-900`, `bg-blue-800` (headers) | `bg-primary` |
| `bg-blue-700` (filled badges) | `bg-primary/70` |
| `bg-blue-50`, `bg-blue-100` (light chips) | `bg-primary/10` |
| `border-blue-200`, `border-blue-300` | `border-primary/30` |
| `text-blue-500`, `text-blue-600`, `text-blue-700` | `text-primary` |
| `text-blue-100`, `text-blue-200` (on primary bg) | `text-primary-foreground/70` |
| `text-white` (on primary bg) | `text-primary-foreground` |
| `text-gray-900`, `text-gray-800` | `text-foreground` |
| `text-gray-400`, `text-gray-500`, `text-gray-600` | `text-muted-foreground` |
| `border-gray-100`, `border-gray-200` | `border-border` |
| `bg-black/60`, `bg-black/70` (AR overlays) | **unchanged** — camera passthrough UI, always needs max contrast |
| `text-gray-400` on AR overlays | **unchanged** — camera UI |

**LinearGradient colors** (in `settings-screen.tsx`): hardcoded `#F3F4F6` → `` `hsl(${tokens.background})` `` via `useAppTheme()`. These are `style` props, not classes — they use the raw token string.

## Files Changed

| File | Change type |
|---|---|
| `src/core/constants/theme.ts` | Expand with Índigo + Teal tokens for all 4 combinations; update `NAV_THEME` |
| `src/global.css` | Remove hardcoded HSL values, keep variable stubs (Step 1) |
| `src/core/providers/app-theme-provider.tsx` | **New** — context + `vars()` injection + `dark` class |
| `src/core/hooks/use-app-theme.ts` | **New** — consumer hook exposing `tokens` for raw color access |
| `src/core/hooks/use-theme.ts` | Read `resolvedScheme` from `AppThemeContext` |
| `src/app/_layout.tsx` | Add `AppThemeProvider` as outermost wrapper; update `StatusBar barStyle` |
| `src/core/components/ui/button.tsx` | `text-white` → `text-primary-foreground` |
| `src/features/settings/presentation/screens/settings-screen.tsx` | Migrate colors + add Appearance card + fix LinearGradient colors |
| `src/features/scan/presentation/screens/scan-screen.tsx` | Migrate colors + use `<Card>` component |
| ~13 other screens/components | Migrate hardcoded colors per migration map |

## Implementation Order

1. **Token system + Provider + `global.css` cleanup** — expand `theme.ts`, create `AppThemeProvider`, wire into `_layout.tsx`, remove hardcoded HSL values from `global.css`. App should look identical after this step with default indigo/system theme.
2. **Fix `button.tsx`** — immediate fix for the button text rendering bug.
3. **Settings screen** — Appearance card with theme/mode controls becomes functional.
4. **Scan screen** — full design with semantic tokens.
5. **Remaining screens** — migrate all hardcoded color instances across auth, localization, reconstruction, viewer, AR, and welcome screens.

## `tokensToVars()` Implementation Note

The camelCase → kebab-case conversion must handle multi-word tokens correctly: `cardForeground` → `--card-foreground`, not `--cardforeground`. Use a tested utility (e.g. a simple regex `str.replace(/([A-Z])/g, '-$1').toLowerCase()` prepended with `--`) or a well-known library. Hand-rolling a split-on-capital-letters approach without tests is risky.

## Known Limitations

**Modal/Overlay inheritance:** NativeWind v4's `vars()` propagates through React context, not CSS cascade. Components rendered in a React Native `<Modal>` (which creates a separate native window root) will not inherit CSS vars from the `AppThemeProvider` View. In this codebase, `alert-dialog.tsx`, `drawer.tsx`, `dialog.tsx`, and `popover.tsx` use `PortalHost` / `@rn-primitives/portal` which renders outside the normal tree. These components rely on semantic class names (`bg-card`, `text-foreground`, etc.) which require the CSS vars to be present. **Mitigation:** Verify that `@rn-primitives/portal` renders inside the `AppThemeProvider` View subtree in the existing provider stack. If not, a secondary `vars()` wrapper may be needed around `PortalHost`.

## Out of Scope

- AR overlay components (`bg-black/60`, etc.) — camera UI, intentionally unchanged
- Business logic of any feature
- UI components in `/core/components/ui/` except `button.tsx`
- New navigation or screen structure
