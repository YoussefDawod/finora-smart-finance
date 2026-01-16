/**
 * @fileoverview Transaction API Service
 * @description All transaction-related API calls
 * 
 * @module api/transactionService
 */

import client from './client';
import { ENDPOINTS } from './endpoints';

export const transactionService = {
  /**
   * Get transactions with filters & pagination
   * @param {Object} filters
   * @param {string} [filters.category]
   * @param {string} [filters.type] - 'income' | 'expense'
   * @param {string} [filters.startDate]
   * @param {string} [filters.endDate]
   * @param {string} [filters.search]
   * @param {Object} pagination
   * @param {number} [pagination.page]
   * @param {number} [pagination.limit]
   * @returns {Promise<AxiosResponse<{ data: any[], pagination: object }>>}
   */
  getTransactions: (filters = {}, pagination = {}) => {
    const params = { ...filters, ...pagination };
    return client.get(ENDPOINTS.transactions.list, { params });
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
   * Get stats overview
   * @param {string} [period='month']
   * @param {string} [startDate]
   * @param {string} [endDate]
   * @returns {Promise<AxiosResponse<{ totalIncome: number, totalExpense: number, balance: number, categoryBreakdown: object, monthlyTrend: object[] }>>}
   */
  getStats: (period = 'month', startDate, endDate) => {
    const params = { period, startDate, endDate };
    return client.get(ENDPOINTS.transactions.stats, { params });
  },
};

export default transactionService;
