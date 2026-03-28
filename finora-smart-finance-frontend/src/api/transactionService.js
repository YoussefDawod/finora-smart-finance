/**
 * @fileoverview Transaction API Service
 * @description All transaction-related API calls with server-side pagination
 *
 * @module api/transactionService
 */

import client from './client';
import { ENDPOINTS } from './endpoints';

/**
 * @typedef {Object} PaginationParams
 * @property {number} [page=1] - Aktuelle Seite (1-basiert)
 * @property {number} [limit=20] - Items pro Seite (max 100)
 */

/**
 * @typedef {Object} TransactionFilters
 * @property {string} [type] - 'income' | 'expense'
 * @property {string} [category] - Kategorie-Name
 * @property {string} [startDate] - Von Datum (YYYY-MM-DD)
 * @property {string} [endDate] - Bis Datum (YYYY-MM-DD)
 * @property {string} [search] - Suchbegriff
 * @property {string} [sort='date'] - Sortierfeld ('date' | 'amount')
 * @property {string} [order='desc'] - Sortierrichtung ('asc' | 'desc')
 */

/**
 * @typedef {Object} PaginationMeta
 * @property {number} page - Aktuelle Seite
 * @property {number} limit - Items pro Seite
 * @property {number} total - Gesamtanzahl Items
 * @property {number} pages - Gesamtanzahl Seiten
 */

export const transactionService = {
  /**
   * Get paginated transactions with filters
   * @param {TransactionFilters & PaginationParams} params - Filter und Pagination
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: any[], pagination: PaginationMeta }>>}
   */
  getTransactions: (params = {}, { signal } = {}) => {
    const { page = 1, limit = 20, ...filters } = params;
    return client.get(ENDPOINTS.transactions.list, {
      params: { page, limit, ...filters },
      signal,
    });
  },

  /**
   * Get aggregated dashboard data (no full transaction list)
   * Returns: summary, trends, category breakdown, recent 5 transactions
   * @param {Object} options - Optional filter parameters
   * @param {number} [options.month] - Month (1-12)
   * @param {number} [options.year] - Year
   * @param {Object} [requestOpts] - Axios request options
   * @param {AbortSignal} [requestOpts.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: DashboardData }>>}
   */
  getDashboardData: ({ month, year } = {}, { signal } = {}) => {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    return client.get(`${ENDPOINTS.transactions.list}/stats/dashboard`, { params, signal });
  },

  /**
   * Get summary stats (total income, expense, balance)
   * @param {string} [startDate]
   * @param {string} [endDate]
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: SummaryStats }>>}
   */
  getSummary: (startDate, endDate, { signal } = {}) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return client.get(`${ENDPOINTS.transactions.list}/stats/summary`, { params, signal });
  },

  /**
   * Get single transaction
   * @param {string} id
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  getTransaction: (id, { signal } = {}) => {
    return client.get(ENDPOINTS.transactions.get(id), { signal });
  },

  /**
   * Create transaction
   * @param {Object} data
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  createTransaction: (data, { signal } = {}) => {
    return client.post(ENDPOINTS.transactions.create, data, { signal });
  },

  /**
   * Update transaction
   * @param {string} id
   * @param {Object} data
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  updateTransaction: (id, data, { signal } = {}) => {
    return client.put(ENDPOINTS.transactions.update(id), data, { signal });
  },

  /**
   * Delete transaction
   * @param {string} id
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ message: string }>>}
   */
  deleteTransaction: (id, { signal } = {}) => {
    return client.delete(ENDPOINTS.transactions.delete(id), { signal });
  },

  /**
   * Bulk delete transactions (delete ALL with confirmation + password)
   * @param {string} password - Passwort zur Bestätigung
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ deleted: number, message: string }>>}
   */
  bulkDelete: (password, { signal } = {}) => {
    return client.delete(`${ENDPOINTS.transactions.bulkDelete}?confirm=true`, {
      data: { password },
      signal,
    });
  },
};

export default transactionService;
