'use strict';

/**
 * CJS-compatible MSW shim for Jest (msw v2 depends on ESM-only packages
 * that cannot be loaded in Jest CJS mode).
 *
 * Implements the subset of the MSW API used by this project:
 * - http.get/post/put/delete/patch
 * - HttpResponse.json / new HttpResponse(null, {status})
 */

// ---------- HttpResponse ----------

class HttpResponse {
  constructor(body, init = {}) {
    this._body = body;
    this._init = init;
    this._jsonBody = undefined;
  }

  static json(body, init = {}) {
    const instance = new HttpResponse(null, init);
    instance._jsonBody = body;
    return instance;
  }

  static error() {
    return new HttpResponse(null, { status: 500 });
  }

  toResponse() {
    const status = this._init.status ?? 200;
    const headers = {};
    if (this._init.headers) {
      Object.assign(headers, this._init.headers);
    }

    if (this._jsonBody !== undefined) {
      headers['Content-Type'] = 'application/json';
      const jsonStr = JSON.stringify(this._jsonBody);
      const jsonBody = this._jsonBody;
      // Return a minimal Response-like object that supports .json() and .ok
      return {
        ok: status >= 200 && status < 300,
        status,
        headers: new Headers(headers),
        json: async () => jsonBody,
        text: async () => jsonStr,
        arrayBuffer: async () => new TextEncoder().encode(jsonStr).buffer,
      };
    }

    const body = this._body;
    return {
      ok: status >= 200 && status < 300,
      status,
      headers: new Headers(headers),
      json: async () => { throw new Error('Response body is not JSON'); },
      text: async () => body ?? '',
      arrayBuffer: async () => body instanceof ArrayBuffer ? body : new ArrayBuffer(0),
    };
  }
}

// ---------- Handler factory ----------

function makeHandler(method, pattern, fn) {
  return { method: method.toUpperCase(), pattern, fn, _isHandler: true };
}

const http = {
  get: (p, fn) => makeHandler('GET', p, fn),
  post: (p, fn) => makeHandler('POST', p, fn),
  put: (p, fn) => makeHandler('PUT', p, fn),
  delete: (p, fn) => makeHandler('DELETE', p, fn),
  patch: (p, fn) => makeHandler('PATCH', p, fn),
};

// Empty ws stub — not used in these tests
const ws = {
  link: () => ({ on: () => ({}) }),
};

module.exports = { http, HttpResponse, ws };
