import { buildNavTheme } from '@/core/constants/theme';
import { useAppTheme } from '@/core/hooks/use-app-theme';

export function useTheme() {
  const { tokens, resolvedScheme } = useAppTheme();
  return buildNavTheme(tokens, resolvedScheme);
}
