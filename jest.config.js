module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/jest.setup.ts'],
  testMatch: ['<rootDir>/__tests__/**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@rn-primitives/.*|nativewind|tailwind-merge|class-variance-authority)',
  ],
  collectCoverageFrom: [
    'src/features/**/*.{ts,tsx}',
    'src/core/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/core/components/ui/**',
  ],
  coverageThreshold: {
    global: { lines: 70, functions: 70 },
  },
};
