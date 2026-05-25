import { cn, isSessionExpiredError, parseCsvLine } from '@/core/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });
});

describe('isSessionExpiredError', () => {
  it.each([
    'Error al renovar el token',
    'No autorizado (problema con el token)',
    'token inválido',
    'Token inválido',
    'expired token',
  ])('returns true for "%s"', (msg) => {
    expect(isSessionExpiredError(new Error(msg))).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(isSessionExpiredError(new Error('Network error'))).toBe(false);
  });

  it('handles non-Error values', () => {
    expect(isSessionExpiredError('expired token')).toBe(true);
    expect(isSessionExpiredError(null)).toBe(false);
  });
});

describe('parseCsvLine', () => {
  it('splits a simple CSV line', () => {
    expect(parseCsvLine('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('handles quoted fields with commas', () => {
    expect(parseCsvLine('"hello, world",b')).toEqual(['hello, world', 'b']);
  });

  it('trims whitespace around fields', () => {
    expect(parseCsvLine(' a , b ')).toEqual(['a', 'b']);
  });

  it('handles empty input', () => {
    expect(parseCsvLine('')).toEqual(['']);
  });
});
