/**
 * CacheManager - Zentrale Cache-Verwaltung
 * Features:
 *   - TTL-basiertes Ablaufen
 *   - Cache-Invalidierung (einzeln & Muster)
 *   - Stale-State-Erkennung
 *   - Cache-Statistiken
 */
class CacheManager {
  constructor(defaultTTL = 5 * 60 * 1000) {
    // 5 minutes default TTL
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  /**
   * Erzeuge Cache-Schlüssel
   */
  generateKey(endpoint, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map((key) => {
        const value = params[key];
        if (value === undefined || value === null) return null;
        return `${key}=${JSON.stringify(value)}`;
      })
      .filter(Boolean)
      .join('&');

    return paramString ? `${endpoint}?${paramString}` : endpoint;
  }

  /**
   * Abrufen aus Cache
   */
  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      this.stats.misses++;
      return null;
    }

    // Überprüfe ob abgelaufen
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.stats.evictions++;
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.data;
  }

  /**
   * In Cache speichern
   */
  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now(),
    });
  }

  /**
   * Überprüfe ob Cache veraltet ist
   */
  isStale(key, staleTTL = 30 * 1000) {
    // 30 seconds default stale time
    const item = this.cache.get(key);

    if (!item) return true;

    return Date.now() - item.createdAt > staleTTL;
  }

  /**
   * Invalidiere einzelnen Cache-Eintrag
   */
  invalidate(key) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.stats.evictions++;
    }
  }

  /**
   * Invalidiere nach Muster
   */
  invalidatePattern(pattern) {
    let invalidatedCount = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        invalidatedCount++;
        this.stats.evictions++;
      }
    }
    return invalidatedCount;
  }

  /**
   * Leere gesamten Cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.evictions += size;
  }

  /**
   * Cache-Statistiken abrufen
   */
  getStats() {
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
        : 0;

    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      hitRate: `${hitRate}%`,
      items: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        age: Date.now() - value.createdAt,
        expiresIn: value.expiresAt - Date.now(),
        size: JSON.stringify(value.data).length,
      })),
    };
  }

  /**
   * Memory-Verbrauch schätzen
   */
  estimateMemoryUsage() {
    let totalSize = 0;
    for (const [, item] of this.cache.entries()) {
      totalSize += JSON.stringify(item.data).length;
    }
    return {
      bytes: totalSize,
      kilobytes: (totalSize / 1024).toFixed(2),
      megabytes: (totalSize / 1024 / 1024).toFixed(3),
    };
  }
}

// Singleton-Instanz
export const cacheManager = new CacheManager();
