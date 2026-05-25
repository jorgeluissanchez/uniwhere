'use strict';

// Minimal CJS stub for rettime (ESM-only package used by msw internals)
class Emitter {
  constructor() {
    this._listeners = {};
  }
  on(event, listener) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(listener);
    return this;
  }
  off(event, listener) {
    if (!this._listeners[event]) return this;
    this._listeners[event] = this._listeners[event].filter(l => l !== listener);
    return this;
  }
  once(event, listener) {
    const wrapper = (...args) => { this.off(event, wrapper); listener(...args); };
    return this.on(event, wrapper);
  }
  emit(event, ...args) {
    (this._listeners[event] || []).forEach(l => l(...args));
    return this;
  }
  removeAllListeners(event) {
    if (event) this._listeners[event] = [];
    else this._listeners = {};
    return this;
  }
}

class TypedEvent extends (typeof MessageEvent !== 'undefined' ? MessageEvent : Event) {
  constructor(type, init) {
    super(type, init);
  }
}

module.exports = { Emitter, TypedEvent };
