module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/jest.setup.ts'],
  testMatch: ['<rootDir>/__tests__/**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    // Specific @/ overrides must come before the general @/ catch-all
    '^@/core/components/ui/drawer$': '<rootDir>/__tests__/setup/mocks/drawer.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    // msw and its ESM-only transitive dependencies cannot load in Jest CJS mode;
    // replace with CJS shims that intercept fetch directly.
    '^msw$': '<rootDir>/__tests__/setup/msw-compat/index.js',
    '^msw/node$': '<rootDir>/__tests__/setup/msw-compat/node.js',
    '^msw/browser$': '<rootDir>/__tests__/setup/msw-compat/index.js',
    // Native / React Native modules that don't work in a Jest environment
    '^@react-native-async-storage/async-storage$':
      '@react-native-async-storage/async-storage/jest/async-storage-mock',
    '^expo-file-system$': '<rootDir>/__tests__/setup/mocks/expo-file-system.js',
    '^expo-document-picker$': '<rootDir>/__tests__/setup/mocks/expo-document-picker.js',
    '^expo-image-picker$': '<rootDir>/__tests__/setup/mocks/expo-image-picker.js',
    '^expo-constants$': '<rootDir>/__tests__/setup/mocks/expo-constants.js',
    '^expo-camera$': '<rootDir>/__tests__/setup/mocks/expo-camera.js',
    '^expo-linear-gradient$': '<rootDir>/__tests__/setup/mocks/expo-linear-gradient.js',
    '^expo-router$': '<rootDir>/__tests__/setup/mocks/expo-router.js',
    '^react-native-svg$': '<rootDir>/__tests__/setup/mocks/svg.js',
    '^@react-three/fiber/native$': '<rootDir>/__tests__/setup/mocks/three-fiber.js',
    '^r3f-native-orbitcontrols$': '<rootDir>/__tests__/setup/mocks/orbitcontrols.js',
    '^lucide-react-native$': '<rootDir>/__tests__/setup/mocks/lucide.js',
    '^expo-image$': '<rootDir>/__tests__/setup/mocks/expo-image.js',
    '^react-native-reanimated$': '<rootDir>/__tests__/setup/mocks/reanimated.js',
    '^react-native-worklets$': '<rootDir>/__tests__/setup/mocks/reanimated.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@rn-primitives/.*|nativewind|tailwind-merge|class-variance-authority)',
  ],
  collectCoverageFrom: [
    'src/features/**/*.{ts,tsx}',
    'src/core/**/*.{ts,tsx}',
    // Type-only files — no runtime code to exercise
    '!src/**/*.d.ts',
    '!src/**/domain/entities/**',
    '!src/**/domain/repositories/**',
    // UI primitive library — not part of feature logic
    '!src/core/components/ui/**',
    // Navigation screens need a full router stack; tested via integration tests
    '!src/**/presentation/screens/**',
    // Three.js / WebGL components require a GPU context unavailable in Jest
    '!src/features/viewer/data/datasources/ply-streaming-parser-data-source-impl.ts',
    '!src/features/viewer/presentation/components/point-cloud-3d.tsx',
    '!src/features/viewer/presentation/components/point-cloud-canvas.tsx',
    '!src/features/viewer/presentation/components/fps-counter.tsx',
    // AR camera components require a native camera context
    '!src/features/ar/presentation/components/**',
    // Platform-specific hooks (color scheme, theme) — need native API
    '!src/core/hooks/**',
    // Localization UI markers depend on map/canvas primitives unavailable in Jest
    '!src/features/localization/presentation/components/**',
    // Reconstruction form is a pure UI composition; covered indirectly by context tests
    '!src/features/reconstruction/presentation/components/reconstruction-form.tsx',
  ],
  coverageThreshold: {
    global: { lines: 70, functions: 70 },
  },
};
