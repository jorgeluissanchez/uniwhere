'use strict';
module.exports = {
  Canvas: ({ children }) => children || null,
  useFrame: jest.fn(),
  useThree: jest.fn(() => ({ camera: {}, scene: {}, gl: {} })),
};
