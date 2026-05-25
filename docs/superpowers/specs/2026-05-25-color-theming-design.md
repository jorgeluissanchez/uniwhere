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

### Approach: NativeWind `vars()` + JS-driven tokens

Instead of CSS class cascade (`.dark.theme-teal`), inject all CSS custom properties at runtime via NativeWind's `vars()` function applied to a root View. The token values live exclusively in `theme.ts` as a typed JS object — `global.css` retains only variable name declarations, not values.

This approach is chosen over CSS class cascade because it works reliably on native without depending on CSS selector specificity combining `.dark` with `.theme-teal`.

### Two independent dimensions

| Dimension | Options | Default | Stored in |
|---|---|---|---|
| Color theme | `'indigo'` \| `'teal'` | `'indigo'` | AsyncStorage `@theme/colorTheme` |
| Scheme override | `'light'` \| `'dark'` \| `'system'` | `'system'` | AsyncStorage `@theme/schemeOverride` |

**Resolved scheme logic:**
- `schemeOverride === 'system'` → uses `useColorScheme()` from React Native (follows device)
- `schemeOverride === 'light' | 'dark'` → uses that value regardless of device setting

## Token Architecture

`src/core/constants/theme.ts` is the single source of truth. Structure:

```ts
type ColorTheme = 'indigo' | 'teal'
type ColorScheme = 'light' | 'dark'

interface ColorTokens {
  background: string
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

**Índigo palette:**
- Light: background `hsl(0 0% 100%)`, primary `hsl(239 84% 67%)` (indigo-500), foreground `hsl(0 0% 3.9%)`
- Dark: background `hsl(238 40% 8%)` (deep indigo-night), primary `hsl(239 84% 67%)`, foreground `hsl(0 0% 98%)`

**Teal palette:**
- Light: background `hsl(0 0% 100%)`, primary `hsl(199 89% 48%)` (sky-500), foreground `hsl(0 0% 3.9%)`
- Dark: background `hsl(207 60% 8%)` (deep navy), primary `hsl(199 89% 48%)`, foreground `hsl(0 0% 98%)`

The `NAV_THEME` export (used by react-navigation's `ThemeProvider`) is updated to read from `TOKENS` instead of hardcoded values.

## Components

### `src/core/providers/app-theme-provider.tsx`

```tsx
export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorTheme] = useState<ColorTheme>('indigo')
  const [schemeOverride, setSchemeOverride] = useState<SchemeOverride>('system')
  const systemScheme = useColorScheme() ?? 'light'
  const resolvedScheme = schemeOverride === 'system' ? systemScheme : schemeOverride

  // Load from AsyncStorage on mount
  // Persist to AsyncStorage on change

  const tokens = TOKENS[colorTheme][resolvedScheme]

  return (
    <AppThemeContext.Provider value={{ colorTheme, schemeOverride, resolvedScheme, setColorTheme, setSchemeOverride }}>
      <View style={[{ flex: 1 }, vars(tokensToVars(tokens))]}>
        {children}
      </View>
    </AppThemeContext.Provider>
  )
}
```

`tokensToVars()` converts camelCase token names to `--kebab-case` CSS variable names matching `tailwind.config.js`.

### `src/core/hooks/use-app-theme.ts`

```ts
export function useAppTheme(): AppThemeContextValue
```

Consumed by Settings screen and any component needing to read/change theme preferences.

### `src/app/_layout.tsx`

`<AppThemeProvider>` wraps the entire app as the outermost provider, before `<DIProvider>`. `useTheme()` is updated to read `resolvedScheme` from `AppThemeContext` instead of calling `useColorScheme()` directly.

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

## Scan Screen

`scan-screen.tsx` is migrated to semantic tokens and gains design:

- `bg-gray-50` → `bg-background`
- Scan cards: use `<Card>` component (`bg-card border-border`)
- Type chip (dense/sparse): `bg-primary/10 border border-primary/30 text-primary`
- Empty state icon: `color` from `text-primary/30`
- Empty state text: `text-muted-foreground`
- ActivityIndicator `color="#3B82F6"` → reads from theme token

## Component Fixes

### `button.tsx`

Root cause of button text rendering bug in cards: `TextClassContext` from `Card` sets `text-card-foreground` but `Button`'s `buttonTextVariants` uses hardcoded `text-white` for `default` and `destructive` variants.

Fix: replace hardcoded `text-white` with `text-primary-foreground` in `buttonTextVariants`. This token is already defined and resolves to white on both themes — no visual change in light mode, but correctly responds to theme token changes.

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
| `bg-black/60`, `bg-black/70` (AR overlays) | **unchanged** — camera UI |
| `text-gray-400` on AR overlays | **unchanged** — camera UI |

## `global.css` Changes

Remove all HSL values from CSS variable declarations. Keep only the variable name stubs so Tailwind's JIT knows the variables exist:

```css
@layer base {
  :root {
    --background: ;
    --foreground: ;
    /* ... all other tokens with empty values */
  }
}
```

Values are injected at runtime by `AppThemeProvider` via `vars()`.

## Files Changed

| File | Change type |
|---|---|
| `src/core/constants/theme.ts` | Expand with Índigo + Teal tokens for all 4 combinations |
| `src/global.css` | Remove hardcoded HSL values, keep variable stubs |
| `src/core/providers/app-theme-provider.tsx` | **New** — context + vars() injection |
| `src/core/hooks/use-app-theme.ts` | **New** — consumer hook |
| `src/core/hooks/use-theme.ts` | Read resolvedScheme from AppThemeContext |
| `src/app/_layout.tsx` | Add AppThemeProvider as outermost wrapper |
| `src/core/components/ui/button.tsx` | `text-white` → `text-primary-foreground` |
| `src/features/settings/presentation/screens/settings-screen.tsx` | Migrate colors + add Appearance card |
| `src/features/scan/presentation/screens/scan-screen.tsx` | Migrate colors + use Card component |
| ~13 other screens/components | Migrate hardcoded colors per migration map |

## Implementation Order

1. **Token system + Provider** — expand `theme.ts`, create `AppThemeProvider`, wire into `_layout.tsx`. App looks identical but the system is live.
2. **Fix `button.tsx`** — immediate fix for the button text rendering bug.
3. **Settings screen** — Appearance card with theme/mode controls becomes functional.
4. **Scan screen** — full design with semantic tokens.
5. **Remaining screens** — migrate all 78 hardcoded color instances across auth, localization, reconstruction, viewer, AR, and welcome screens.
6. **`global.css` cleanup** — remove now-redundant hardcoded HSL values.

## Out of Scope

- AR overlay components (`bg-black/60`, etc.) — camera UI, intentionally unchanged
- Business logic of any feature
- UI components in `/core/components/ui/` except `button.tsx`
- New navigation or screen structure
