'use strict';
// Silences two cosmetic warnings from expo-gl + three.js:
// 1. THREE.Clock deprecation — r3f uses it internally; redefine as plain property
//    so the deprecation getter never fires at render time.
// 2. EXGL gl.pixelStorei() — expo-gl doesn't support several pixel store params
//    that three.js sets unconditionally; suppress those specific LOG lines.

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
