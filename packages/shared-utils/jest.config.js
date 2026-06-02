/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.test.ts'],
  moduleNameMapper: {
    '^@fire-system/shared-types$': '<rootDir>/../shared-types/src/index.ts',
    '^@fire-system/shared-constants$': '<rootDir>/../shared-constants/src/index.ts',
  },
};
