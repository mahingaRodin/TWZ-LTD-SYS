/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],
  // Set env vars before any module (and thus config/env.ts) is imported.
  setupFiles: ['<rootDir>/test/env.ts'],
  moduleNameMapper: {
    '^@fire-system/shared-types$': '<rootDir>/../../../packages/shared-types/src/index.ts',
    '^@fire-system/shared-constants$': '<rootDir>/../../../packages/shared-constants/src/index.ts',
    '^@fire-system/shared-utils$': '<rootDir>/../../../packages/shared-utils/src/index.ts',
  },
};
