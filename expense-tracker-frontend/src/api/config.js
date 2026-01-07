export const API_CONFIG = {
  // Request timeouts by endpoint type
  TIMEOUTS: {
    DEFAULT: 30000, // 30s
    UPLOAD: 120000, // 2m
    DOWNLOAD: 60000, // 1m
    QUICK: 5000, // 5s
  },

  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY: 1000,
    MAX_DELAY: 30000,
    BACKOFF_MULTIPLIER: 2,
  },

  // Cache configuration
  CACHE: {
    DEFAULT_TTL: 5 * 60 * 1000, // 5m
    STALE_TTL: 30 * 1000, // 30s
  },
};
