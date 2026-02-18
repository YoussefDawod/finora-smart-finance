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
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  getProfile: () => client.get(ENDPOINTS.users.profile),

  /**
   * Update user profile
   * @param {Object} data
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  updateProfile: (data) => client.put(ENDPOINTS.users.updateProfile, data),

  /**
   * Update user preferences
   * @param {Object} data
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  updatePreferences: (data) => client.put(ENDPOINTS.users.updatePreferences, data),

  /**
   * Change password (Backend erwartet POST)
   * @param {string} currentPassword
   * @param {string} newPassword
   * @returns {Promise<AxiosResponse<{ message: string }>>}
   */
  changePassword: (currentPassword, newPassword) =>
    client.post(ENDPOINTS.users.password, { currentPassword, newPassword }),

  /**
   * Get budget status
   * @returns {Promise<AxiosResponse<{ data: object }>>}
   */
  getBudgetStatus: () => client.get(ENDPOINTS.users.budgetStatus),

  /**
   * Delete user account
   * @param {string} password
   * @returns {Promise<AxiosResponse<{ message: string }>>}
   */
  deleteAccount: (password) =>
    client.delete(ENDPOINTS.users.deleteAccount, { data: { password, confirmation: 'DELETE' } }),

  /**
   * Get newsletter subscription status
   * @returns {Promise<AxiosResponse<{ subscribed: boolean }>>}
   */
  getNewsletterStatus: () => client.get(ENDPOINTS.newsletter.status),

  /**
   * Toggle newsletter subscription
   * @returns {Promise<AxiosResponse<{ subscribed: boolean }>>}
   */
  toggleNewsletter: () => client.post(ENDPOINTS.newsletter.toggle),
};

export default userService;
