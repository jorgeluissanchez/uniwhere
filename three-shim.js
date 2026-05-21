'use strict';
// Shim that re-exports Three.js but silences the THREE.Clock deprecation warning.
// @react-three/fiber uses THREE.Clock internally; three.js r176+ defines it via a
// deprecation getter that logs every time it is accessed. We read the class once
// (silently), then redefine it as a plain property so r3f never triggers the warning.

const THREE = require('./node_modules/three/build/three.cjs');

const _warn = console.warn;
console.warn = () => {};
const Clock = THREE.Clock;
console.warn = _warn;

if (Clock) {
  Object.defineProperty(THREE, 'Clock', {
    value: Clock,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

module.exports = THREE;
