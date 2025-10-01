/** @type {import('jest').Config} */
// cspell:ignore unimodules nent
module.exports = {
  preset: 'jest-expo/web',
  setupFiles: ['<rootDir>/jest-setup-before-env.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],

  // Test file patterns - now organized under __tests__
  testMatch: [
    '<rootDir>/__tests__/**/*.{js,ts,tsx}',
    '<rootDir>/features/**/__tests__/**/*.{js,ts,tsx}',
    '<rootDir>/e2e/**/*.spec.{js,ts}',
  ],

  // Module path mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    'expo/src/winter/runtime.native': '<rootDir>/__mocks__/expo-winter-runtime.ts',
    'expo/src/winter/runtime.native.ts': '<rootDir>/__mocks__/expo-winter-runtime.ts',
  },

  modulePathIgnorePatterns: ['<rootDir>/__mocks__/expo-winter-runtime.js'],

  // Transform configuration
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],

  collectCoverageFrom: [
    'stores/**/*.{js,ts}',
    'services/**/*.{js,ts}',
    'features/**/*.{js,ts,tsx}',
    'components/**/*.{js,ts,tsx}',
    'hooks/**/*.{js,ts}',
    'lib/**/*.{js,ts}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/coverage/**',
    '!**/e2e/**',
  ],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Coverage reporting
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',

  // Test environment
  testEnvironment: 'jsdom',

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};