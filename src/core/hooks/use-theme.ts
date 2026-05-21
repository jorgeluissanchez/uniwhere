/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { NAV_THEME } from '@/core/constants/theme';
import { useColorScheme } from '@/core/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();
  const theme = scheme === 'unspecified' ? 'light' : scheme;

  return NAV_THEME[theme];
}
