/**
 * RequestDeduplicator - Verhindert doppelte API-Anfragen
 * Features:
 *   - Identische Anfragen teilen ein Promise
 *   - Automatische Bereinigung bei Erfolg/Fehler
 *   - Request-Tracking
 */
class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map();
    this.stats = {
      deduplicatedRequests: 0,
      totalRequests: 0,
    };
  }

  /**
   * Führe deduplizierte Anfrage aus
   */
  async execute(key, requestFn) {
    this.stats.totalRequests++;

    // Gebe existierende Anfrage zurück wenn ausstehend
    if (this.pendingRequests.has(key)) {
      this.stats.deduplicatedRequests++;
      return this.pendingRequests.get(key);
    }

    // Erstelle neue Anfrage
    const promise = requestFn()
      .then((result) => {
        this.pendingRequests.delete(key);
        return result;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Statistiken abrufen
   */
  getStats() {
    const deduplicationRate =
      this.stats.totalRequests > 0
        ? (
            (this.stats.deduplicatedRequests / this.stats.totalRequests) *
            100
          ).toFixed(2)
        : 0;

    return {
      pendingRequests: this.pendingRequests.size,
      deduplicatedRequests: this.stats.deduplicatedRequests,
      totalRequests: this.stats.totalRequests,
      deduplicationRate: `${deduplicationRate}%`,
    };
  }

  /**
   * Lösche ausstehende Anfrage
   */
  clear(key) {
    this.pendingRequests.delete(key);
  }

  /**
   * Leere alle ausstehenden Anfragen
   */
  clearAll() {
    this.pendingRequests.clear();
  }
}

// Singleton-Instanz
export const requestDeduplicator = new RequestDeduplicator();
