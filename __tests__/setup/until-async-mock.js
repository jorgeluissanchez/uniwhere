'use strict';

// Minimal CJS stub for until-async (ESM-only package used by msw internals)
async function until(fn) {
  try {
    const result = await fn();
    return [null, result];
  } catch (error) {
    return [error, null];
  }
}

module.exports = { until };
