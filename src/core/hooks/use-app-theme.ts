import { createContext, useContext } from 'react';
import type { ColorTheme, ColorScheme, SchemeOverride, ColorTokens } from '@/core/constants/theme';

export interface AppThemeContextValue {
  colorTheme: ColorTheme;
  schemeOverride: SchemeOverride;
  resolvedScheme: ColorScheme;
  tokens: ColorTokens;
  setColorTheme: (t: ColorTheme) => void;
  setSchemeOverride: (s: SchemeOverride) => void;
}

export const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function useAppTheme(): AppThemeContextValue {
  const ctx = useContext(AppThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within AppThemeProvider');
  return ctx;
}
