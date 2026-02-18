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
   * @returns {Promise<AxiosResponse<{ data: any[], pagination: PaginationMeta }>>}
   */
  getTransactions: (params = {}) => {
    const { page = 1, limit = 20, ...filters } = params;
    return client.get(ENDPOINTS.transactions.list, { 
      params: { page, limit, ...filters } 
    });
  },

  /**
   * Get aggregated dashboard data (no full transaction list)
   * Returns: summary, trends, category breakdown, recent 5 transactions
   * @param {Object} options - Optional filter parameters
   * @param {number} [options.month] - Month (1-12)
   * @param {number} [options.year] - Year
   * @returns {Promise<AxiosResponse<{ data: DashboardData }>>}
   */
  getDashboardData: ({ month, year } = {}) => {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    return client.get(`${ENDPOINTS.transactions.list}/stats/dashboard`, { params });
  },

  /**
   * Get summary stats (total income, expense, balance)
   * @param {string} [startDate]
   * @param {string} [endDate]
   * @returns {Promise<AxiosResponse<{ data: SummaryStats }>>}
   */
  getSummary: (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return client.get(`${ENDPOINTS.transactions.list}/stats/summary`, { params });
  },

  /**
   * Get single transaction
   * @param {string} id
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  getTransaction: (id) => {
    return client.get(ENDPOINTS.transactions.get(id));
  },

  /**
   * Create transaction
   * @param {Object} data
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  createTransaction: (data) => {
    return client.post(ENDPOINTS.transactions.create, data);
  },

  /**
   * Update transaction
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  updateTransaction: (id, data) => {
    return client.put(ENDPOINTS.transactions.update(id), data);
  },

  /**
   * Delete transaction
   * @param {string} id
   * @returns {Promise<AxiosResponse<{ message: string }>>}
   */
  deleteTransaction: (id) => {
    return client.delete(ENDPOINTS.transactions.delete(id));
  },

  /**
   * Bulk delete transactions
   * @param {string[]} ids
   * @returns {Promise<AxiosResponse<{ deleted: number, message: string }>>}
   */
  bulkDelete: (ids) => {
    return client.delete(ENDPOINTS.transactions.bulkDelete, { data: { ids } });
  },
};

export default transactionService;
