/**
 * @fileoverview User API Service
 * @description All user profile-related API calls
 * 
 * @module api/userService
 */

import client from './client';
import { ENDPOINTS } from './endpoints';

export const userService = {
  /**
   * Get user profile
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  getProfile: ({ signal } = {}) => client.get(ENDPOINTS.users.profile, { signal }),

  /**
   * Update user profile
   * @param {Object} data
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  updateProfile: (data, { signal } = {}) => client.put(ENDPOINTS.users.updateProfile, data, { signal }),

  /**
   * Update user preferences
   * @param {Object} data
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  updatePreferences: (data, { signal } = {}) => client.put(ENDPOINTS.users.updatePreferences, data, { signal }),

  /**
   * Change password (Backend erwartet POST)
   * @param {string} currentPassword
   * @param {string} newPassword
   * @param {string} confirmPassword
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ message: string }>>}
   */
  changePassword: (currentPassword, newPassword, confirmPassword, { signal } = {}) =>
    client.post(ENDPOINTS.users.password, { currentPassword, newPassword, confirmPassword }, { signal }),

  /**
   * Get budget status
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  getBudgetStatus: ({ signal } = {}) => client.get(ENDPOINTS.users.budgetStatus, { signal }),

  /**
   * Delete user account
   * @param {string} password
   * @returns {Promise<AxiosResponse<{ message: string }>>}
   */
  deleteAccount: (password) =>
    client.delete(ENDPOINTS.users.deleteAccount, { data: { password } }),

  /**
   * Get newsletter subscription status
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ subscribed: boolean }>>}
   */
  getNewsletterStatus: ({ signal } = {}) => client.get(ENDPOINTS.newsletter.status, { signal }),

  /**
   * Toggle newsletter subscription
   * @param {string} language
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ subscribed: boolean }>>}
   */
  toggleNewsletter: (language, { signal } = {}) => client.post(ENDPOINTS.newsletter.toggle, { language }, { signal }),

  // ============================================
  // Lifecycle
  // ============================================

  /**
   * Get lifecycle status (retention phase, old transactions, export status)
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  getLifecycleStatus: ({ signal } = {}) => client.get(ENDPOINTS.users.lifecycleStatus, { signal }),

  /**
   * Confirm data export (marks user as having exported)
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ message: string }>>}
   */
  confirmExport: ({ signal } = {}) => client.post(ENDPOINTS.users.exportConfirm, null, { signal }),

  /**
   * Get transaction quota (monthly limit usage)
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  getQuota: ({ signal } = {}) => client.get(ENDPOINTS.users.quota, { signal }),
};

export default userService;
