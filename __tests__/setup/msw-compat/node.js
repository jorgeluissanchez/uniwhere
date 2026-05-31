'use strict';

/**
 * CJS-compatible setupServer shim.
 *
 * Intercepts global fetch by replacing it with a matching engine that routes
 * requests through registered handlers, mirroring MSW v2 semantics.
 *
 * Pattern matching: MSW v2 handlers use full URLs or path-only patterns.
 * This shim tries to match against:
 *   1. The full request URL (e.g. http://localhost/auth/.../login)
 *   2. The pathname only (e.g. /auth/.../login)
 */

const { HttpResponse } = require('./index');

function buildRegex(pattern) {
  const paramNames = [];
  const nameRx = /:([^/]+)/g;
  let m;
  while ((m = nameRx.exec(pattern)) !== null) paramNames.push(m[1]);

  // Escape everything except : and * which have special meaning
  const rxStr = pattern
    .replace(/[.+?^${}()|[\]\\]/g, (c) => '\\' + c)
    .replace(/:([^/]+)/g, '([^/?]+)')
    .replace(/\*/g, '.*');
  const rx = new RegExp('^' + rxStr + '(?:\\?.*)?$');
  return { rx, paramNames };
}

function tryMatch(pattern, candidate) {
  const { rx, paramNames } = buildRegex(pattern);
  const match = rx.exec(candidate);
  if (!match) return null;
  const params = {};
  paramNames.forEach((name, i) => { params[name] = match[i + 1]; });
  return params;
}

function matchHandler(handler, method, url, pathname) {
  if (handler.method !== method) return null;
  // Try full URL match first, then pathname
  return tryMatch(handler.pattern, url) ?? tryMatch(handler.pattern, pathname);
}

function setupServer(...defaultHandlers) {
  let _handlers = [...defaultHandlers];
  let _originalFetch = null;
  let _unhandledMode = 'warn';

  async function interceptedFetch(input, init = {}) {
    const url = typeof input === 'string' ? input : input.url;
    const reqInit = typeof input === 'object' ? { method: input.method, ...init } : init;
    const method = (reqInit.method || 'GET').toUpperCase();
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;

    for (const handler of _handlers) {
      const params = matchHandler(handler, method, url, pathname);
      if (params === null) continue;

      const request = new Request(url, {
        method,
        headers: reqInit.headers || {},
        body: reqInit.body ?? undefined,
      });

      let mswResponse;
      try {
        mswResponse = await handler.fn({ request, params });
      } catch (err) {
        throw err;
      }

      if (!mswResponse) continue; // passthrough

      if (mswResponse instanceof HttpResponse) {
        return mswResponse.toResponse();
      }
      return mswResponse;
    }

    if (_unhandledMode === 'error') {
      throw new Error(`[MSW compat] No handler for ${method} ${url}`);
    }
    if (_unhandledMode === 'warn') {
      console.warn(`[MSW compat] No handler found for ${method} ${url}`);
    }
    if (_originalFetch) return _originalFetch(input, init);
    throw new TypeError('fetch is not defined and no original fetch was saved');
  }

  return {
    listen(opts = {}) {
      _unhandledMode = opts.onUnhandledRequest ?? 'warn';
      _originalFetch = global.fetch;
      global.fetch = interceptedFetch;
    },
    resetHandlers(...overrides) {
      _handlers = overrides.length
        ? [...overrides, ...defaultHandlers]
        : [...defaultHandlers];
    },
    close() {
      if (_originalFetch) {
        global.fetch = _originalFetch;
        _originalFetch = null;
      }
    },
    use(...handlers) {
      _handlers = [...handlers, ..._handlers];
    },
  };
}

module.exports = { setupServer };
