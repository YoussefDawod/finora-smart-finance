/**
 * Environment Variables Type Definitions
 * JSDoc-basierte Dokumentation für IDE-Support
 */

/**
 * @typedef {Object} EnvironmentVariables
 * @property {string} VITE_API_URL - API Base URL
 * @property {string} VITE_API_BASE_URL - API Base URL with /api suffix
 * @property {string} VITE_API_TIMEOUT - API Request Timeout in ms
 * @property {string} VITE_APP_NAME - Application Name
 * @property {string} VITE_APP_VERSION - Application Version
 * @property {string} VITE_APP_ENVIRONMENT - Environment (development, staging, production)
 * @property {string} VITE_LOG_LEVEL - Logging Level (debug, info, warn, error)
 * @property {string} VITE_DEBUG_MODE - Enable Debug Mode (true/false)
 * @property {string} VITE_ENABLE_ANALYTICS - Enable Analytics (true/false)
 * @property {string} VITE_ENABLE_SOCKET - Enable WebSocket (true/false)
 * @property {string} VITE_ENABLE_DARK_MODE - Enable Dark Mode (true/false)
 * @property {string} VITE_ENABLE_THEME_SWITCHING - Enable Theme Switching (true/false)
 * @property {string} VITE_AUTH_TOKEN_KEY - LocalStorage Key for Auth Token
 * @property {string} VITE_AUTH_REFRESH_INTERVAL - Auth Token Refresh Interval in ms
 * @property {string} VITE_DEFAULT_THEME - Default Theme (light, dark, glassmorphic)
 * @property {string} VITE_SUPPORTED_THEMES - Comma-separated list of supported themes
 * @property {string} VITE_CACHE_ENABLED - Enable Cache (true/false)
 * @property {string} VITE_CACHE_DURATION - Cache Duration in ms
 */

export const ENV_KEYS = {
  // API
  API_URL: 'VITE_API_URL',
  API_BASE_URL: 'VITE_API_BASE_URL',
  API_TIMEOUT: 'VITE_API_TIMEOUT',

  // App
  APP_NAME: 'VITE_APP_NAME',
  APP_VERSION: 'VITE_APP_VERSION',
  APP_ENVIRONMENT: 'VITE_APP_ENVIRONMENT',

  // Logging
  LOG_LEVEL: 'VITE_LOG_LEVEL',
  DEBUG_MODE: 'VITE_DEBUG_MODE',

  // Features
  ENABLE_ANALYTICS: 'VITE_ENABLE_ANALYTICS',
  ENABLE_SOCKET: 'VITE_ENABLE_SOCKET',
  ENABLE_DARK_MODE: 'VITE_ENABLE_DARK_MODE',
  ENABLE_THEME_SWITCHING: 'VITE_ENABLE_THEME_SWITCHING',

  // Auth
  AUTH_TOKEN_KEY: 'VITE_AUTH_TOKEN_KEY',
  AUTH_REFRESH_INTERVAL: 'VITE_AUTH_REFRESH_INTERVAL',

  // Theme
  DEFAULT_THEME: 'VITE_DEFAULT_THEME',
  SUPPORTED_THEMES: 'VITE_SUPPORTED_THEMES',

  // Cache
  CACHE_ENABLED: 'VITE_CACHE_ENABLED',
  CACHE_DURATION: 'VITE_CACHE_DURATION',
};

/**
 * Log Level Values
 */
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

/**
 * Environment Values
 */
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
};

/**
 * Theme Values
 */
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  GLASSMORPHIC: 'glassmorphic',
};
