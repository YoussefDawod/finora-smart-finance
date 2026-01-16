import apiClient from './api';

export const transactionService = {
  /**
   * Get all transactions
   * @param {Object} params - Query parameters (page, limit, sort, filter)
   */
  getAll: async (params = {}) => {
    const response = await apiClient.get('/transactions', { params });
    return response;
  },

  /**
   * Get single transaction by ID
   * @param {string} id 
   */
  getById: async (id) => {
    const response = await apiClient.get(`/transactions/${id}`);
    return response;
  },

  /**
   * Create new transaction
   * @param {Object} transactionData 
   */
  create: async (transactionData) => {
    const response = await apiClient.post('/transactions', transactionData);
    return response;
  },

  /**
   * Update transaction
   * @param {string} id 
   * @param {Object} transactionData 
   */
  update: async (id, transactionData) => {
    const response = await apiClient.put(`/transactions/${id}`, transactionData);
    return response;
  },

  /**
   * Delete transaction
   * @param {string} id 
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/transactions/${id}`);
    return response;
  },

  /**
   * Get transaction statistics
   * @param {Object} params - Date range and filters
   */
  getStats: async (params = {}) => {
    const response = await apiClient.get('/transactions/stats', { params });
    return response;
  },

  /**
   * Get transactions summary
   */
  getSummary: async () => {
    const response = await apiClient.get('/transactions/summary');
    return response;
  },

  /**
   * Export transactions
   * @param {string} format - csv, pdf, excel
   */
  export: async (format = 'csv') => {
    const response = await apiClient.get(`/transactions/export?format=${format}`, {
      responseType: 'blob',
    });
    return response;
  },
};
