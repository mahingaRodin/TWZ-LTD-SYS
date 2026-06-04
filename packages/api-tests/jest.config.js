/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  setupFiles: ['<rootDir>/test/env.ts'],
  globalSetup: '<rootDir>/test/globalSetup.ts',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testTimeout: 30_000,
  moduleNameMapper: {
    '^@fire-system/shared-types$': '<rootDir>/../shared-types/src/index.ts',
    '^@fire-system/shared-constants$': '<rootDir>/../shared-constants/src/index.ts',
    '^@fire-system/shared-utils$': '<rootDir>/../shared-utils/src/index.ts',
  },
};
