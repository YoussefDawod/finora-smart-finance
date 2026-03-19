import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  {
    ignores: ['dist', 'node_modules'],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: '19.0',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react/prop-types': 'off',
      // react-hooks v7 (React Compiler) strikte Regeln — als Fehler,
      // da ESLint 0 Warnings/Errors zeigt (verifiziert nach Audit-Fix-Session).
      'react-hooks/static-components': 'error',
      'react-hooks/set-state-in-effect': 'error',
      'react-hooks/purity': 'error',
      'react-hooks/immutability': 'error',
      'react-hooks/preserve-manual-memoization': 'error',
      'react-hooks/use-memo': 'error',
      'react-hooks/error-boundaries': 'error',
      'react-hooks/set-state-in-render': 'error',
      'react-hooks/refs': 'error',
      'react-hooks/globals': 'error',
      'preserve-caught-error': 'error',
    },
  },
  // Jest & Vitest Test-Dateien
  {
    files: ['__tests__/**/*.{js,jsx}', '**/*.test.{js,jsx}', '**/*.spec.{js,jsx}', '**/test/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
        // Vitest
        vi: 'readonly',
        // Node.js globals used in test setup
        global: 'readonly',
      },
    },
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  // Config-Dateien (Node.js-Umgebung)
  {
    files: ['vite.config.js', 'eslint.config.js', 'playwright.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
];
