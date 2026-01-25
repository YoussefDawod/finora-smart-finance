/** @type {import('jest').Config} */
module.exports = {
  // Test-Umgebung
  testEnvironment: 'node',

  // Test-Dateien finden
  testMatch: ['**/__tests__/**/*.js', '**/*.test.js', '**/*.spec.js'],

  // Diese Ordner ignorieren
  testPathIgnorePatterns: ['/node_modules/', '/logs/'],

  // Coverage-Einstellungen
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Timeout für async Tests
  testTimeout: 10000,

  // Verbose Output
  verbose: true,

  // Setup-Dateien
  setupFilesAfterEnv: ['./__tests__/setup.js'],
};
