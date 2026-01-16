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
   * Change password
   * @param {string} currentPassword
   * @param {string} newPassword
   * @returns {Promise<AxiosResponse<{ message: string }>>}
   */
  changePassword: (currentPassword, newPassword) =>
    client.put(ENDPOINTS.users.password, { currentPassword, newPassword }),

  /**
   * Change email
   * @param {string} newEmail
   * @param {string} password
   * @returns {Promise<AxiosResponse<{ message: string, pendingEmail?: string }>>}
   */
  changeEmail: (newEmail, password) =>
    client.put(ENDPOINTS.users.email, { newEmail, password }),

  /**
   * Delete user account
   * @param {string} password
   * @returns {Promise<AxiosResponse<{ message: string }>>}
   */
  deleteAccount: (password) =>
    client.delete(ENDPOINTS.users.deleteAccount, { data: { password, confirmation: 'DELETE' } }),

  /**
   * Enable 2FA
   * @returns {Promise<AxiosResponse<{ secret: string, qrCode: string }>>}
   */
  enable2FA: () => client.post(ENDPOINTS.users.enable2FA),

  /**
   * Verify 2FA
   * @param {string} token
   * @returns {Promise<AxiosResponse<{ message: string, backupCodes?: string[] }>>}
   */
  verify2FA: (token) => client.post(ENDPOINTS.users.verify2FA, { token }),
};

export default userService;
