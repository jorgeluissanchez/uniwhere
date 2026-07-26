import React from 'react';
import { render } from '@testing-library/react-native';
import { PathOverlay } from '@/features/ar/presentation/components/path-overlay';
import { AppThemeContext, AppThemeContextValue } from '@/core/hooks/use-app-theme';
import { TOKENS } from '@/core/constants/theme';

// PathOverlay pinta el trazo con la prop `stroke` de react-native-svg, que no
// acepta clases, así que lee el token de color del provider.
const themeCtx: AppThemeContextValue = {
  colorTheme: 'indigo', schemeOverride: 'system', resolvedScheme: 'light',
  tokens: TOKENS.indigo.light,
  setColorTheme: jest.fn(), setSchemeOverride: jest.fn(),
};

function renderOverlay(route: { row: number; col: number }[]) {
  return render(
    <AppThemeContext.Provider value={themeCtx}>
      <PathOverlay route={route} size={288} />
    </AppThemeContext.Provider>
  );
}

describe('PathOverlay', () => {
  it('renders without crashing when route is empty', () => {
    const { toJSON } = renderOverlay([]);
    expect(toJSON()).toBeTruthy();
  });

  it('renders without crashing with a single point (no lines)', () => {
    const { toJSON } = renderOverlay([{ row: 0, col: 0 }]);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with a multi-point route', () => {
    const { toJSON } = renderOverlay([{ row: 0, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 2 }]);
    expect(toJSON()).toBeTruthy();
  });

  it('paints the path with the theme primary color', () => {
    const { UNSAFE_getAllByType } = renderOverlay([{ row: 0, col: 0 }, { row: 1, col: 1 }]);
    const { Line } = require('react-native-svg');
    const lines = UNSAFE_getAllByType(Line);
    expect(lines).toHaveLength(1);
    expect(lines[0].props.stroke).toBe(`hsl(${TOKENS.indigo.light.primary})`);
  });

  it('matches snapshot', () => {
    const { toJSON } = renderOverlay([{ row: 0, col: 0 }, { row: 1, col: 1 }]);
    expect(toJSON()).toMatchSnapshot();
  });
});
