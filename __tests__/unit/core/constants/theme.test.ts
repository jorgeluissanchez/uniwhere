import { TOKENS, tokensToVars, buildNavTheme } from '@/core/constants/theme';

describe('TOKENS', () => {
  const themes = ['indigo', 'teal'] as const;
  const schemes = ['light', 'dark'] as const;
  const requiredKeys = [
    'background','foreground','card','cardForeground','popover','popoverForeground',
    'primary','primaryForeground','secondary','secondaryForeground',
    'muted','mutedForeground','accent','accentForeground',
    'destructive','destructiveForeground','border','input','ring',
  ];

  test.each(themes)('%s theme has all 4 combinations', (theme) => {
    expect(TOKENS[theme].light).toBeDefined();
    expect(TOKENS[theme].dark).toBeDefined();
  });

  test.each(themes.flatMap(t => schemes.map(s => [t, s] as const)))(
    '%s/%s has all required token keys', (theme, scheme) => {
      const tokens = TOKENS[theme][scheme];
      for (const key of requiredKeys) {
        expect(tokens).toHaveProperty(key);
        expect(typeof tokens[key as keyof typeof tokens]).toBe('string');
        expect((tokens[key as keyof typeof tokens] as string).length).toBeGreaterThan(0);
      }
    }
  );

  it('indigo and teal differ only in primary token', () => {
    const il = TOKENS.indigo.light;
    const tl = TOKENS.teal.light;
    expect(il.primary).not.toBe(tl.primary);
    expect(il.background).toBe(tl.background);
    expect(il.foreground).toBe(tl.foreground);
    expect(il.border).toBe(tl.border);
    expect(il.destructive).toBe(tl.destructive);
  });

  it('indigo dark background differs from indigo light', () => {
    expect(TOKENS.indigo.dark.background).not.toBe(TOKENS.indigo.light.background);
    expect(TOKENS.teal.dark.background).not.toBe(TOKENS.teal.light.background);
  });

  it('token values are HSL channel strings without hsl() wrapper', () => {
    for (const theme of themes) {
      for (const scheme of schemes) {
        for (const key of requiredKeys) {
          const val = TOKENS[theme][scheme][key as keyof typeof TOKENS['indigo']['light']];
          expect(val).not.toMatch(/^hsl\(/);
          expect(val).toMatch(/^\d/);
        }
      }
    }
  });
});

describe('tokensToVars', () => {
  it('converts camelCase keys to --kebab-case', () => {
    const tokens = TOKENS.indigo.light;
    const result = tokensToVars(tokens);
    expect(result['--primary']).toBe(tokens.primary);
    expect(result['--primary-foreground']).toBe(tokens.primaryForeground);
    expect(result['--card-foreground']).toBe(tokens.cardForeground);
    expect(result['--muted-foreground']).toBe(tokens.mutedForeground);
    expect(result['--destructive-foreground']).toBe(tokens.destructiveForeground);
    expect(result['--popover-foreground']).toBe(tokens.popoverForeground);
    expect(result['--secondary-foreground']).toBe(tokens.secondaryForeground);
    expect(result['--accent-foreground']).toBe(tokens.accentForeground);
  });

  it('produces exactly 19 entries', () => {
    expect(Object.keys(tokensToVars(TOKENS.indigo.light))).toHaveLength(19);
  });

  it('all keys start with --', () => {
    for (const key of Object.keys(tokensToVars(TOKENS.indigo.light))) {
      expect(key).toMatch(/^--/);
    }
  });
});

describe('buildNavTheme', () => {
  it('wraps token values in hsl()', () => {
    const navTheme = buildNavTheme(TOKENS.indigo.light, 'light');
    expect(navTheme.colors.primary).toBe(`hsl(${TOKENS.indigo.light.primary})`);
    expect(navTheme.colors.background).toBe(`hsl(${TOKENS.indigo.light.background})`);
    expect(navTheme.dark).toBe(false);
  });

  it('sets dark=true for dark scheme', () => {
    expect(buildNavTheme(TOKENS.indigo.dark, 'dark').dark).toBe(true);
  });
});
