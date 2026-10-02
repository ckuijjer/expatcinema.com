module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          allowJs: true,
        },
      },
    ],
  },
  // got and many of its dependencies are ESM only, so transform node_modules
  // too; it's what lets the tests import scrapers
  transformIgnorePatterns: [],
}
