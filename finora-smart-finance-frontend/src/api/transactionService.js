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
   * @returns {Promise<AxiosResponse<{ data: DashboardData }>>}
   */
  getDashboardData: () => {
    return client.get(`${ENDPOINTS.transactions.list}/stats/dashboard`);
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

  /**
   * Export transactions as data (for PDF generation)
   * @param {TransactionFilters} filters - Optional filters for export
   * @param {number} [maxItems=1000] - Max items to export
   * @returns {Promise<AxiosResponse<{ data: any[], pagination: PaginationMeta }>>}
   */
  getExportData: (filters = {}, maxItems = 1000) => {
    return client.get(ENDPOINTS.transactions.list, { 
      params: { ...filters, page: 1, limit: Math.min(maxItems, 100) } 
    });
  },

  /**
   * @deprecated Use getDashboardData() instead
   * Get stats overview
   */
  getStats: (period = 'month', startDate, endDate) => {
    const params = { period, startDate, endDate };
    return client.get(ENDPOINTS.transactions.stats, { params });
  },
};

export default transactionService;
