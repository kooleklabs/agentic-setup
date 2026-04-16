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
  // Thresholds enabled in Task 7 after tests exist
};
