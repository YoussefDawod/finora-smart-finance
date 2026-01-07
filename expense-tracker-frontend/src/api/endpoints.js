/**
 * API Endpoints Konfiguration
 * Zentrale Verwaltung aller API-Pfade
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const ENDPOINTS = {
  // Transactions
  TRANSACTIONS: {
    LIST: '/transactions',
    CREATE: '/transactions',
    GET: (id) => `/transactions/${id}`,
    UPDATE: (id) => `/transactions/${id}`,
    DELETE: (id) => `/transactions/${id}`,
  },

  // Statistics
  STATS: {
    SUMMARY: '/stats/summary',
    BY_CATEGORY: '/stats/by-category',
    BY_TYPE: '/stats/by-type',
    MONTHLY: '/stats/monthly',
  },

  // Categories
  CATEGORIES: {
    LIST: '/categories',
  },

  // Reports (Future)
  REPORTS: {
    MONTHLY: '/reports/monthly',
    YEARLY: '/reports/yearly',
    EXPORT: (format) => `/reports/export?format=${format}`,
  },
};
