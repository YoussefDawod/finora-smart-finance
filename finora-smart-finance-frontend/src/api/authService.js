/**
 * @fileoverview Auth API Service
 * @description All authentication-related API calls
 * 
 * @module api/authService
 */

import client from './client';
import { ENDPOINTS } from './endpoints';

/**
 * Auth Service
 */
export const authService = {
  /**
   * Login user with name and password
   * @param {string} name - The username
   * @param {string} password
   * @returns {Promise<AxiosResponse<{ user: object, token: string }>>}
   */
  login: (name, password) => {
    return client.post(ENDPOINTS.auth.login, { name, password });
  },

  /**
   * Register new user
   * @param {Object} data - Registration data
   * @param {string} data.name - Username (required)
   * @param {string} data.password - Password (required)
   * @param {string} [data.email] - Email (optional)
   * @param {boolean} [data.understoodNoEmailReset] - Acknowledged no email (required if no email)
   * @returns {Promise<AxiosResponse<{ user: object, verificationLink?: string }>>}
   */
  register: (data) => {
    return client.post(ENDPOINTS.auth.register, data);
  },

  /**
   * Logout user
   * @returns {Promise<AxiosResponse<{ message: string }>>}
   */
  logout: (refreshToken) => {
    return client.post(ENDPOINTS.auth.logout, { refreshToken });
  },

  /**
   * Verify email with token
   * @param {string} token
   * @returns {Promise<AxiosResponse<{ user: object, message: string }>>}
   */
  verifyEmail: (token) => {
    return client.post(ENDPOINTS.auth.verify, { token });
  },

  /**
   * Request password reset email
   * @param {string} email
   * @returns {Promise<AxiosResponse<{ message: string }>>}
   */
  forgotPassword: (email) => {
    return client.post(ENDPOINTS.auth.forgotPassword, { email });
  },

  /**
   * Reset password using reset token
   * @param {string} token
   * @param {string} newPassword
   * @returns {Promise<AxiosResponse<{ user: object, message: string }>>}
   */
  resetPassword: (token, newPassword) => {
    return client.post(ENDPOINTS.auth.resetPassword, { token, password: newPassword });
  },

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken
   * @returns {Promise<AxiosResponse<{ accessToken: string, expiresIn: number }>>}
   */
  refreshToken: (refreshToken) => {
    return client.post(ENDPOINTS.auth.refresh, { refreshToken });
  },

  /**
   * Get current authenticated user
   * @returns {Promise<AxiosResponse<{ user: object }>>}
   */
  getCurrentUser: () => {
    return client.get(ENDPOINTS.auth.me);
  },

  /**
   * Update user profile (name)
   * @param {Object} data - Profile data
   * @param {string} data.name - New username
   * @returns {Promise<AxiosResponse<{ success: boolean, data: object }>>}
   */
  updateProfile: (data) => {
    return client.put(ENDPOINTS.auth.me, data);
  },

  // ============================================
  // EMAIL MANAGEMENT (NEW)
  // ============================================

  /**
   * Add email to account (for users who registered without email)
   * @param {string} email
   * @returns {Promise<AxiosResponse<{ message: string }>>}
   */
  addEmail: (email) => {
    return client.post(ENDPOINTS.auth.addEmail, { email });
  },

  /**
   * Change existing email (verified users)
   * @param {string} newEmail
   */
  changeEmail: (newEmail) => {
    return client.post(ENDPOINTS.auth.changeEmail, { newEmail });
  },

  /**
   * Verify newly added email with token
   * @param {string} token
   * @returns {Promise<AxiosResponse<{ user: object, message: string }>>}
   */
  verifyAddEmail: (token) => {
    return client.post(ENDPOINTS.auth.verifyAddEmail, { token });
  },

  /**
   * Remove email from account
   * @returns {Promise<AxiosResponse<{ message: string }>>}
   */
  removeEmail: (password, confirmRemoval = false) => {
    return client.delete(ENDPOINTS.auth.removeEmail, { data: { password, confirmRemoval } });
  },

  /**
   * Get email status
   * @returns {Promise<AxiosResponse<{ hasEmail: boolean, isVerified: boolean, canResetPassword: boolean }>>}
   */
  getEmailStatus: () => {
    return client.get(ENDPOINTS.auth.emailStatus);
  },

  /**
   * Resend verification email
   * @returns {Promise<AxiosResponse<{ message: string }>>}
   */
  resendVerification: () => {
    return client.post(ENDPOINTS.auth.resendVerification);
  },

  /**
   * Resend verification email for pending email (for already added but unverified emails)
   * @returns {Promise<AxiosResponse<{ message: string, email: string }>>}
   */
  resendAddEmailVerification: () => {
    return client.post(ENDPOINTS.auth.resendAddEmailVerification);
  },

  /**
   * Change password (while logged in)
   * @param {string} currentPassword
   * @param {string} newPassword
   * @returns {Promise<AxiosResponse<{ message: string }>>}
   */
  changePassword: (currentPassword, newPassword) => {
    return client.post(ENDPOINTS.auth.changePassword, { currentPassword, newPassword });
  },

  /**
   * Delete account (requires email confirmation)
   */
  deleteAccount: (email) => {
    return client.delete(ENDPOINTS.auth.deleteAccount, { data: { email } });
  },
};

export default authService;
