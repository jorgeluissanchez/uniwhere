// __tests__/unit/core/di/container.test.ts
import { Container } from '@/core/di/container';

describe('Container', () => {
  const TOKEN = Symbol('TestToken');

  it('resolves a registered value', () => {
    const c = new Container();
    c.register(TOKEN, 'hello');
    expect(c.resolve(TOKEN)).toBe('hello');
  });

  it('throws when resolving an unregistered token', () => {
    const c = new Container();
    expect(() => c.resolve(TOKEN)).toThrow();
  });

  it('overwrites a registration when the same token is registered twice', () => {
    const c = new Container();
    c.register(TOKEN, 'first');
    c.register(TOKEN, 'second');
    expect(c.resolve(TOKEN)).toBe('second');
  });

  it('register returns the container for chaining', () => {
    const c = new Container();
    expect(c.register(TOKEN, 'v')).toBe(c);
  });
});
