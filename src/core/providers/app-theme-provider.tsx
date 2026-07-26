import React, { useState, useEffect } from 'react';
import { Platform, View } from 'react-native';
import { useColorScheme } from '@/core/hooks/use-color-scheme';
import { vars } from 'nativewind';
import {
  TOKENS,
  tokensToVars,
  type ColorTheme,
  type ColorScheme,
  type SchemeOverride,
} from '@/core/constants/theme';
import { AppThemeContext } from '@/core/hooks/use-app-theme';
import { LocalPreferencesAsyncStorage } from '@/core/storage/local-preferences-async-storage';

const VALID_THEMES: ColorTheme[] = ['indigo', 'teal'];
const VALID_OVERRIDES: SchemeOverride[] = ['system', 'light', 'dark'];

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('indigo');
  const [schemeOverride, setSchemeOverrideState] = useState<SchemeOverride>('system');

  const systemScheme = (useColorScheme() ?? 'light') as ColorScheme;
  const resolvedScheme: ColorScheme =
    schemeOverride === 'system' ? systemScheme : schemeOverride;

  const prefs = LocalPreferencesAsyncStorage.getInstance();

  useEffect(() => {
    async function load() {
      try {
        const savedTheme = await prefs.retrieveData<ColorTheme>('@theme/colorTheme');
        const savedScheme = await prefs.retrieveData<SchemeOverride>('@theme/schemeOverride');
        if (savedTheme && VALID_THEMES.includes(savedTheme)) setColorThemeState(savedTheme);
        if (savedScheme && VALID_OVERRIDES.includes(savedScheme)) setSchemeOverrideState(savedScheme);
      } finally {
        setInitialized(true);
      }
    }
    void load();
  }, []);

  useEffect(() => {
    if (!initialized) return;
    void prefs.storeData('@theme/colorTheme', colorTheme);
  }, [colorTheme, initialized]);

  useEffect(() => {
    if (!initialized) return;
    void prefs.storeData('@theme/schemeOverride', schemeOverride);
  }, [schemeOverride, initialized]);

  const tokens = TOKENS[colorTheme][resolvedScheme];

  // El esquema claro/oscuro lo resuelve el CSS (`:root` y `.dark:root` en
  // global.css). Lo único que hace falta en runtime es decir cuál está activo y,
  // cuando la paleta no es la de por defecto, pisar sus variables.
  //
  // En web además hay que hacerlo sobre <html>: los portales (dialog, drawer,
  // select, toast…) se montan en document.body vía Radix, fuera del View raíz,
  // así que no heredarían nada declarado ahí.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const root = document.documentElement;
    for (const [name, value] of Object.entries(tokensToVars(tokens))) {
      root.style.setProperty(name, value);
    }
    root.classList.toggle('dark', resolvedScheme === 'dark');
    root.dataset.theme = colorTheme;
  }, [tokens, resolvedScheme, colorTheme]);

  function setColorTheme(t: ColorTheme) {
    if (VALID_THEMES.includes(t)) setColorThemeState(t);
  }

  function setSchemeOverride(s: SchemeOverride) {
    if (VALID_OVERRIDES.includes(s)) setSchemeOverrideState(s);
  }

  if (!initialized) return null;

  return (
    <AppThemeContext.Provider
      value={{ colorTheme, schemeOverride, resolvedScheme, tokens, setColorTheme, setSchemeOverride }}
    >
      <View
        className={resolvedScheme === 'dark' ? 'dark flex-1' : 'flex-1'}
        style={vars(tokensToVars(tokens))}
      >
        {children}
      </View>
    </AppThemeContext.Provider>
  );
}
