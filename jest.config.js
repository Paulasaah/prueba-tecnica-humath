/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.spec.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts', '!src/common/swagger.ts'],
  coverageDirectory: 'coverage',
  moduleFileExtensions: ['ts', 'js'],
  clearMocks: true,
  setupFiles: ['<rootDir>/tests/jest.setup.ts'],
};
