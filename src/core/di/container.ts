export class Container {
  private singletons = new Map<symbol, unknown>();
  register<T>(token: symbol, instance: T) {
    this.singletons.set(token, instance);
    return this;
  }
  resolve<T>(token: symbol): T {
    // `has` instead of a falsy check: a legitimately registered 0, '' or false
    // must resolve, not be reported as a missing provider.
    if (!this.singletons.has(token)) {
      throw new Error(`No hay proveedor para ${String(token)}`);
    }
    return this.singletons.get(token) as T;
  }
}