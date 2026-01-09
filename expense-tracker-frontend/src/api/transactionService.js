/**
 * Transaction Service
 * Domainspezifischer Service für Transaction-API-Operationen
 */

import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import { ValidationError } from '../utils/errors';
import { authService } from './authService';

const handleApiError = (error) => {
  const status = error?.response?.status;

  if (status === 401) {
    // Session abgelaufen → Logout und Redirect
    authService.logout();
    window.location.assign('/login');
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }

  if (status === 403) {
    const err = new Error("You don't have permission");
    err.status = 403;
    throw err;
  }

  throw error;
};

export const transactionService = {
  /**
   * Get all transactions with optional filters
   * @param {Object} filters - Filter-Optionen
   * @returns {Promise<Array>} Array von Transaktionen
   */
  async getTransactions(filters = {}) {
    const queryParams = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      ...(filters.type && filters.type !== 'all' && { type: filters.type }),
      ...(filters.category && filters.category !== 'all' && { category: filters.category }),
      ...(filters.startDate && { startDate: filters.startDate }),
      ...(filters.endDate && { endDate: filters.endDate }),
      sortBy: filters.sortBy || 'date',
      sortOrder: filters.sortOrder || 'desc',
    };

    try {
      const response = await apiClient.get(ENDPOINTS.TRANSACTIONS.LIST, queryParams);

      return {
        data: response.data || [],
        pagination: response.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        },
      };
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Get single transaction by ID
   * @param {string} id - Transaction ID
   * @returns {Promise<Object>} Transaction-Objekt
   */
  async getTransaction(id) {
    if (!id) {
      throw new ValidationError('Transaction ID is required', { id: 'Required' });
    }

    try {
      const response = await apiClient.get(ENDPOINTS.TRANSACTIONS.GET(id));
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Create new transaction
   * @param {Object} transactionData - Transaction-Daten
   * @returns {Promise<Object>} Neu erstellte Transaction
   */
  async createTransaction(transactionData) {
    const errors = this.validateTransaction(transactionData);
    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Validation failed', errors);
    }

    try {
      const response = await apiClient.post(ENDPOINTS.TRANSACTIONS.CREATE, {
        type: transactionData.type || 'expense',
        description: transactionData.description.trim(),
        amount: parseFloat(transactionData.amount),
        category: transactionData.category,
        date: transactionData.date || new Date().toISOString().split('T')[0],
      });

      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Update existing transaction
   * @param {string} id - Transaction ID
   * @param {Object} updates - Zu aktualisierende Felder
   * @returns {Promise<Object>} Aktualisierte Transaction
   */
  async updateTransaction(id, updates) {
    if (!id) {
      throw new ValidationError('Transaction ID is required', { id: 'Required' });
    }

    const updateData = {};

    if (updates.type) updateData.type = updates.type;
    if (updates.description) updateData.description = updates.description.trim();
    if (updates.amount) updateData.amount = parseFloat(updates.amount);
    if (updates.category) updateData.category = updates.category;
    if (updates.date) updateData.date = updates.date;

    if (Object.keys(updateData).length === 0) {
      throw new ValidationError('No fields to update', {});
    }

    try {
      const response = await apiClient.put(ENDPOINTS.TRANSACTIONS.UPDATE(id), updateData);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Delete transaction
   * @param {string} id - Transaction ID
   * @returns {Promise<Object>} Erfolgs-Response
   */
  async deleteTransaction(id) {
    if (!id) {
      throw new ValidationError('Transaction ID is required', { id: 'Required' });
    }

    try {
      const response = await apiClient.delete(ENDPOINTS.TRANSACTIONS.DELETE(id));
      return response;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Get transaction statistics
   * @returns {Promise<Object>} Statistics-Objekt
   */
  async getStatistics() {
    try {
      const response = await apiClient.get(ENDPOINTS.STATS.SUMMARY);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Get statistics by category
   * @returns {Promise<Object>} Category-Statistics
   */
  async getStatsByCategory() {
    try {
      const response = await apiClient.get(ENDPOINTS.STATS.BY_CATEGORY);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Get statistics by type (income/expense)
   * @returns {Promise<Object>} Type-Statistics
   */
  async getStatsByType() {
    try {
      const response = await apiClient.get(ENDPOINTS.STATS.BY_TYPE);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Validate transaction data
   * @param {Object} data - Zu validierende Daten
   * @returns {Object} Errors-Objekt (leer wenn valid)
   */
  validateTransaction(data) {
    const errors = {};

    // Type validation
    if (!data.type || !['income', 'expense'].includes(data.type)) {
      errors.type = 'Type must be "income" or "expense"';
    }

    // Description validation
    if (!data.description?.trim()) {
      errors.description = 'Description is required';
    } else if (data.description.length > 255) {
      errors.description = 'Description must be less than 255 characters';
    }

    // Amount validation
    if (!data.amount) {
      errors.amount = 'Amount is required';
    } else if (parseFloat(data.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
    } else if (isNaN(parseFloat(data.amount))) {
      errors.amount = 'Amount must be a valid number';
    }

    // Category validation
    if (!data.category?.trim()) {
      errors.category = 'Category is required';
    }

    // Date validation
    if (data.date) {
      const dateObj = new Date(data.date);
      if (dateObj.toString() === 'Invalid Date') {
        errors.date = 'Invalid date format (use YYYY-MM-DD)';
      }
    }

    return errors;
  },
};

export default transactionService;
