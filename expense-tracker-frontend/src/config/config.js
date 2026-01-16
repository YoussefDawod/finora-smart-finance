/**
 * Environment Configuration
 * Zentrale Verwaltung aller Umgebungsvariablen
 */

const config = {
  // ============================================
  // API Configuration
  // ============================================
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    url: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
  },

  // ============================================
  // App Configuration
  // ============================================
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Expense Tracker',
    version: import.meta.env.VITE_APP_VERSION || '2.0.0',
    environment: import.meta.env.VITE_APP_ENVIRONMENT || 'development',
  },

  // ============================================
  // Logging
  // ============================================
  logging: {
    level: import.meta.env.VITE_LOG_LEVEL || 'debug',
    debug: import.meta.env.VITE_DEBUG_MODE === 'true',
  },

  // ============================================
  // Feature Flags
  // ============================================
  features: {
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    socket: import.meta.env.VITE_ENABLE_SOCKET === 'true',
    darkMode: import.meta.env.VITE_ENABLE_DARK_MODE === 'true',
    themeSwitching: import.meta.env.VITE_ENABLE_THEME_SWITCHING === 'true',
  },

  // ============================================
  // Security & Authentication
  // ============================================
  auth: {
    tokenKey: import.meta.env.VITE_AUTH_TOKEN_KEY || 'auth_token',
    refreshInterval: parseInt(
      import.meta.env.VITE_AUTH_REFRESH_INTERVAL || '3600000'
    ),
  },

  // ============================================
  // Theme & Appearance
  // ============================================
  theme: {
    default: import.meta.env.VITE_DEFAULT_THEME || 'light',
    supported: (import.meta.env.VITE_SUPPORTED_THEMES || 'light,dark,glassmorphic')
      .split(',')
      .map((theme) => theme.trim()),
  },

  // ============================================
  // Performance & Caching
  // ============================================
  cache: {
    enabled: import.meta.env.VITE_CACHE_ENABLED === 'true',
    duration: parseInt(import.meta.env.VITE_CACHE_DURATION || '3600000'),
  },

  // ============================================
  // Helper Methods
  // ============================================
  isDevelopment() {
    return this.app.environment === 'development';
  },

  isProduction() {
    return this.app.environment === 'production';
  },

  isStaging() {
    return this.app.environment === 'staging';
  },
};

// Log configuration in development
if (config.isDevelopment() && config.logging.debug) {
  console.log('📋 Application Configuration:', config);
}

export default config;
