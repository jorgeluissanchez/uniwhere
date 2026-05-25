import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

export type ColorTheme = 'indigo' | 'teal';
export type ColorScheme = 'light' | 'dark';
export type SchemeOverride = 'system' | ColorScheme;

export interface ColorTokens {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
}

const SHARED_LIGHT: Omit<ColorTokens, 'primary' | 'background' | 'card' | 'popover'> = {
  foreground: '0 0% 3.9%',
  cardForeground: '0 0% 3.9%',
  popoverForeground: '0 0% 3.9%',
  primaryForeground: '0 0% 100%',
  secondary: '0 0% 96.1%',
  secondaryForeground: '0 0% 9%',
  muted: '0 0% 96.1%',
  mutedForeground: '0 0% 45.1%',
  accent: '0 0% 96.1%',
  accentForeground: '0 0% 9%',
  destructive: '0 84.2% 60.2%',
  destructiveForeground: '0 0% 98%',
  border: '0 0% 89.8%',
  input: '0 0% 89.8%',
  ring: '0 0% 63%',
};

const SHARED_DARK: Omit<ColorTokens, 'primary' | 'background' | 'card' | 'popover'> = {
  foreground: '0 0% 98%',
  cardForeground: '0 0% 98%',
  popoverForeground: '0 0% 98%',
  primaryForeground: '0 0% 100%',
  secondary: '0 0% 14.9%',
  secondaryForeground: '0 0% 98%',
  muted: '0 0% 14.9%',
  mutedForeground: '0 0% 63.9%',
  accent: '0 0% 14.9%',
  accentForeground: '0 0% 98%',
  destructive: '0 70.9% 59.4%',
  destructiveForeground: '0 0% 98%',
  border: '0 0% 14.9%',
  input: '0 0% 14.9%',
  ring: '300 0% 45%',
};

export const TOKENS: Record<ColorTheme, Record<ColorScheme, ColorTokens>> = {
  indigo: {
    light: {
      ...SHARED_LIGHT,
      primary: '239 84% 67%',
      background: '220 14% 96%',
      card: '0 0% 100%',
      popover: '0 0% 100%',
    },
    dark: {
      ...SHARED_DARK,
      primary: '239 84% 67%',
      background: '238 40% 5%',
      card: '238 30% 11%',
      popover: '238 30% 11%',
    },
  },
  teal: {
    light: {
      ...SHARED_LIGHT,
      primary: '199 89% 48%',
      background: '220 14% 96%',
      card: '0 0% 100%',
      popover: '0 0% 100%',
    },
    dark: {
      ...SHARED_DARK,
      primary: '199 89% 48%',
      background: '207 60% 5%',
      card: '207 40% 11%',
      popover: '207 40% 11%',
    },
  },
};

export function tokensToVars(tokens: ColorTokens): Record<string, string> {
  return Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => [
      '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase(),
      value,
    ])
  );
}

export function buildNavTheme(tokens: ColorTokens, scheme: ColorScheme): Theme {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: scheme === 'dark',
    colors: {
      ...base.colors,
      background: `hsl(${tokens.background})`,
      border: `hsl(${tokens.border})`,
      card: `hsl(${tokens.card})`,
      notification: `hsl(${tokens.destructive})`,
      primary: `hsl(${tokens.primary})`,
      text: `hsl(${tokens.foreground})`,
    },
  };
}

export const NAV_THEME = {
  light: buildNavTheme(TOKENS.indigo.light, 'light'),
  dark: buildNavTheme(TOKENS.indigo.dark, 'dark'),
};
