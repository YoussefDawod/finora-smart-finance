const js = require('@eslint/js');
const globals = require('globals');
const security = require('eslint-plugin-security');

module.exports = [
  {
    ignores: ['node_modules/**', 'dist/**', 'logs/**'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.commonjs,
      },
    },
    plugins: {
      security,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...security.configs.recommended.rules,
      'no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true }],
      'no-console': 'off',
      // Security: detect-object-injection erzeugt zu viele False Positives
      // (kontrollierte Keys aus Object.keys, Validation-Allowlists, Config-Lookups)
      'security/detect-object-injection': 'off',
      // Security: Erlaube non-literal RegExp da wir sie kontrolliert einsetzen
      'security/detect-non-literal-regexp': 'warn',
      // Security: Erlaube child_process in deploy/admin scripts
      'security/detect-child-process': 'warn',
    },
  },
  // Jest Test-Dateien - zusätzliche Globals
  {
    files: ['__tests__/**/*.js', '**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
];
