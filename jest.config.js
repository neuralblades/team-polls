module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/', '/scripts/'],
  coverageReporters: ['json', 'text', 'lcov', 'clover'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80
    }
  },
  setupFiles: ['dotenv/config'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  globals: {
    'process.env.JWT_SECRET': 'test_secret_key',
    'process.env.JWT_EXPIRATION': '1h'
  }
};
