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
    SUMMARY: '/transactions/stats/summary',
    BY_CATEGORY: '/transactions/stats/by-category',
    BY_TYPE: '/transactions/stats/by-type',
    MONTHLY: '/transactions/stats/monthly',
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

  // Users
  USERS: {
    ME: '/users/me',
    CHANGE_PASSWORD: '/users/change-password',
    CHANGE_EMAIL: '/users/change-email',
    VERIFY_EMAIL_CHANGE: '/users/verify-email-change',
    PREFERENCES: '/users/preferences',
    EXPORT_DATA: '/users/export-data',
    DELETE_TRANSACTIONS: '/users/transactions',
  },
};
