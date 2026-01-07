/**
 * Cache Invalidation Service
 * Zentrale Verwaltung von Cache-Invalidierungsmustern
 */

import { cacheManager } from './cacheManager';

/**
 * Vordefinierte Invalidierungsmuster
 */
export const cacheInvalidationPatterns = {
  TRANSACTIONS: '/transactions',
  EXPENSES: '/expenses',
  CATEGORIES: '/categories',
  STATS: '/stats',
  REPORTS: '/reports',
  USERS: '/users',
  SETTINGS: '/settings',
};

/**
 * Invalidiere Cache nach Muster
 */
export const invalidateCacheByPattern = (pattern) => {
  const count = cacheManager.invalidatePattern(pattern);
  console.debug(`Invalidated ${count} cache entries matching pattern: ${pattern}`);
  return count;
};

/**
 * Invalidiere alle Caches
 */
export const invalidateAllCaches = () => {
  cacheManager.clear();
  console.debug('All caches cleared');
};

/**
 * Invalidiere spezifischen Cache-Eintrag
 */
export const invalidateCacheEntry = (endpoint, params = {}) => {
  const key = cacheManager.generateKey(endpoint, params);
  cacheManager.invalidate(key);
  console.debug(`Invalidated cache entry: ${key}`);
};

/**
 * Automatische Invalidierung nach Transaktionen
 */
export const setupAutoInvalidation = () => {
  // Invalidate related caches based on operation type
  return {
    // Transaction mutations
    onTransactionCreated: () => {
      invalidateCacheByPattern(cacheInvalidationPatterns.TRANSACTIONS);
      invalidateCacheByPattern(cacheInvalidationPatterns.STATS);
    },
    
    onTransactionUpdated: (_transactionId) => {
      invalidateCacheByPattern(cacheInvalidationPatterns.TRANSACTIONS);
      invalidateCacheByPattern(cacheInvalidationPatterns.STATS);
    },
    
    onTransactionDeleted: (_transactionId) => {
      invalidateCacheByPattern(cacheInvalidationPatterns.TRANSACTIONS);
      invalidateCacheByPattern(cacheInvalidationPatterns.STATS);
    },

    // Category mutations
    onCategoryCreated: () => {
      invalidateCacheByPattern(cacheInvalidationPatterns.CATEGORIES);
    },

    onCategoryUpdated: () => {
      invalidateCacheByPattern(cacheInvalidationPatterns.CATEGORIES);
      invalidateCacheByPattern(cacheInvalidationPatterns.TRANSACTIONS);
    },

    onCategoryDeleted: () => {
      invalidateCacheByPattern(cacheInvalidationPatterns.CATEGORIES);
      invalidateCacheByPattern(cacheInvalidationPatterns.TRANSACTIONS);
    },

    // Settings mutations
    onSettingsUpdated: () => {
      invalidateAllCaches();
    },
  };
};

/**
 * Cache Invalidation Middleware für API-Calls
 * Automatisch aufgerufen von apiClient nach Mutations
 */
export const createCacheInvalidationMiddleware = () => {
  return {
    beforeRequest: (_config) => {
      // Track the request type
      return _config;
    },

    afterSuccess: (response, _config) => {
      // Auto-invalidate caches based on HTTP method
      const method = _config.method?.toUpperCase();
      
      if (method !== 'GET') {
        // Extract resource type from endpoint
        const resourceType = config.url?.split('/')[0];
        if (resourceType) {
          invalidateCacheByPattern(resourceType);
        }
      }

      return response;
    },

    afterError: (error, config) => {
      // Don't invalidate on errors
      return error;
    },
  };
};

/**
 * Cache Prewarming - Lädt häufig benötigte Daten vorab
 */
export const prewarmCache = async (endpoints) => {
  console.debug('Prewarming cache with endpoints:', endpoints);
  
  for (const { endpoint, params = {}, options = {} } of endpoints) {
    try {
      await cacheManager.cache.get(endpoint, params, {
        cache: true,
        ...options,
      });
    } catch (error) {
      console.warn(`Failed to prewarm cache for ${endpoint}:`, error);
    }
  }
};

/**
 * Cache Monitoring - Logs Cache-Statistiken
 */
export const logCacheStats = () => {
  const stats = cacheManager.getStats();
  const memory = cacheManager.estimateMemoryUsage();
  
  console.table({
    'Cache Size': stats.size,
    'Total Hits': stats.hits,
    'Total Misses': stats.misses,
    'Hit Rate': stats.hitRate,
    'Evictions': stats.evictions,
    'Memory (KB)': memory.kilobytes,
  });

  return { stats, memory };
};

/**
 * Cache Cleanup - Entfernt abgelaufene Einträge
 */
export const cleanupExpiredCache = () => {
  const before = cacheManager.cache.size;
  
  // Iterate through cache and delete expired entries
  for (const [key] of cacheManager.cache.entries()) {
    cacheManager.cache.get(key); // Triggers expiration check
  }
  
  const after = cacheManager.cache.size;
  const cleaned = before - after;
  
  console.debug(`Cache cleanup: removed ${cleaned} expired entries`);
  return cleaned;
};
