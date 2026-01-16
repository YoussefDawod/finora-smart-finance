import apiClient from './api';

export const authService = {
  /**
   * Login user
   * @param {string} email 
   * @param {string} password 
   */
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response;
  },

  /**
   * Register new user
   * @param {Object} userData 
   */
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response;
  },

  /**
   * Logout user
   */
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response;
  },

  /**
   * Get current user
   */
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response;
  },

  /**
   * Request password reset
   * @param {string} email 
   */
  requestPasswordReset: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response;
  },

  /**
   * Reset password with token
   * @param {string} token 
   * @param {string} newPassword 
   */
  resetPassword: async (token, newPassword) => {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      password: newPassword,
    });
    return response;
  },

  /**
   * Verify email
   * @param {string} token 
   */
  verifyEmail: async (token) => {
    const response = await apiClient.post('/auth/verify-email', { token });
    return response;
  },
};
