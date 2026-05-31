import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('nativewind', () => ({
  vars: jest.fn(() => ({})),
}));

import { AppThemeProvider } from '@/core/providers/app-theme-provider';
import { useAppTheme } from '@/core/hooks/use-app-theme';
import { TOKENS } from '@/core/constants/theme';

function ThemeConsumer() {
  const { colorTheme, resolvedScheme, schemeOverride, tokens } = useAppTheme();
  return (
    <Text testID="output">
      {JSON.stringify({ colorTheme, resolvedScheme, schemeOverride, primary: tokens.primary })}
    </Text>
  );
}

function renderWithProvider() {
  return render(
    <AppThemeProvider>
      <ThemeConsumer />
    </AppThemeProvider>
  );
}

describe('AppThemeProvider', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('renders children with default theme after initialization', async () => {
    const { getByTestId } = renderWithProvider();
    await waitFor(() => expect(getByTestId('output')).toBeTruthy());
    const output = JSON.parse(getByTestId('output').children[0] as string);
    expect(output.colorTheme).toBe('indigo');
    expect(output.schemeOverride).toBe('system');
    expect(output.primary).toBe(TOKENS.indigo.light.primary);
  });

  it('loads saved colorTheme from AsyncStorage on mount', async () => {
    await AsyncStorage.setItem('@theme/colorTheme', JSON.stringify('teal'));
    const { getByTestId } = renderWithProvider();
    await waitFor(() => {
      const output = JSON.parse(getByTestId('output').children[0] as string);
      expect(output.colorTheme).toBe('teal');
      expect(output.primary).toBe(TOKENS.teal.light.primary);
    });
  });

  it('loads saved schemeOverride from AsyncStorage on mount', async () => {
    await AsyncStorage.setItem('@theme/schemeOverride', JSON.stringify('dark'));
    const { getByTestId } = renderWithProvider();
    await waitFor(() => {
      const output = JSON.parse(getByTestId('output').children[0] as string);
      expect(output.schemeOverride).toBe('dark');
      expect(output.resolvedScheme).toBe('dark');
    });
  });

  it('ignores unrecognized stored colorTheme and uses default', async () => {
    await AsyncStorage.setItem('@theme/colorTheme', JSON.stringify('purple'));
    const { getByTestId } = renderWithProvider();
    await waitFor(() => {
      const output = JSON.parse(getByTestId('output').children[0] as string);
      expect(output.colorTheme).toBe('indigo');
    });
  });

  it('persists colorTheme change to AsyncStorage', async () => {
    let setter: ((t: 'indigo' | 'teal') => void) | undefined;
    function SetterCapture() {
      const { setColorTheme } = useAppTheme();
      setter = setColorTheme;
      return null;
    }
    render(
      <AppThemeProvider>
        <SetterCapture />
      </AppThemeProvider>
    );
    await waitFor(() => expect(setter).toBeDefined());
    await act(async () => setter!('teal'));

    await waitFor(async () => {
      const stored = await AsyncStorage.getItem('@theme/colorTheme');
      expect(JSON.parse(stored!)).toBe('teal');
    });
  });

  it('still initializes when AsyncStorage throws (uses defaults)', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('disk error'));
    const { getByTestId } = renderWithProvider();
    await waitFor(() => {
      const output = JSON.parse(getByTestId('output').children[0] as string);
      expect(output.colorTheme).toBe('indigo');
    });
  });
});

describe('useAppTheme outside provider', () => {
  it('throws when used outside AppThemeProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ThemeConsumer />)).toThrow();
    spy.mockRestore();
  });
});
