/** Jest config for @kooleklabs/agentic-app */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/lib/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'lib/**/*.js',
    '!lib/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text-summary', 'lcov'],
  // Starting thresholds — raise these as coverage improves. Do NOT lower.
  coverageThreshold: {
    global: {
      lines: 50,
      branches: 40,
      functions: 45,
      statements: 50,
    },
  },
};
