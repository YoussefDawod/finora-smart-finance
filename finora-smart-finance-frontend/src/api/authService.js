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
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ user: object, token: string }>>}
   */
  login: (name, password, { signal } = {}) => {
    return client.post(ENDPOINTS.auth.login, { name, password }, { signal });
  },

  /**
   * Register new user
   * @param {Object} data - Registration data
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ user: object, verificationLink?: string }>>}
   */
  register: (data, { signal } = {}) => {
    return client.post(ENDPOINTS.auth.register, data, { signal });
  },

  /**
   * Logout user
   * Refresh-Token wird als httpOnly Cookie automatisch mitgesendet.
   * Fallback: Falls ein Legacy-Token übergeben wird, wird er im Body gesendet.
   * @param {string} [refreshToken] - Optional: Legacy-Refresh-Token aus Storage
   * @returns {Promise<AxiosResponse<{ message: string }>>}
   */
  logout: refreshToken => {
    return client.post(ENDPOINTS.auth.logout, refreshToken ? { refreshToken } : {}, {
      withCredentials: true,
    });
  },

  /**
   * Verify email with token
   * @param {string} token
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ user: object, message: string }>>}
   */
  verifyEmail: (token, { signal } = {}) => {
    return client.post(ENDPOINTS.auth.verify, { token }, { signal });
  },

  /**
   * Request password reset email
   * @param {string} email
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ message: string }>>}
   */
  forgotPassword: (email, { signal } = {}) => {
    return client.post(ENDPOINTS.auth.forgotPassword, { email }, { signal });
  },

  /**
   * Reset password using reset token
   * @param {string} token
   * @param {string} newPassword
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ user: object, message: string }>>}
   */
  resetPassword: (token, newPassword, { signal } = {}) => {
    return client.post(ENDPOINTS.auth.resetPassword, { token, password: newPassword }, { signal });
  },

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken
   * @returns {Promise<AxiosResponse<{ accessToken: string, expiresIn: number }>>}
   */
  refreshToken: refreshToken => {
    return client.post(ENDPOINTS.auth.refresh, { refreshToken });
  },

  /**
   * Get current authenticated user
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ user: object }>>}
   */
  getCurrentUser: ({ signal } = {}) => {
    return client.get(ENDPOINTS.auth.me, { signal });
  },

  /**
   * Update user profile (name)
   * @param {Object} data - Profile data
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ success: boolean, data: object }>>}
   */
  updateProfile: (data, { signal } = {}) => {
    return client.put(ENDPOINTS.auth.me, data, { signal });
  },

  // ============================================
  // EMAIL MANAGEMENT (NEW)
  // ============================================

  /**
   * Add email to account (for users who registered without email)
   * @param {string} email
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ message: string }>>}
   */
  addEmail: (email, { signal } = {}) => {
    return client.post(ENDPOINTS.auth.addEmail, { email }, { signal });
  },

  /**
   * Change existing email (verified users)
   * @param {string} newEmail
   * @param {string} password - Aktuelles Passwort zur Bestätigung
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   */
  changeEmail: (newEmail, password, { signal } = {}) => {
    return client.post(ENDPOINTS.auth.changeEmail, { newEmail, password }, { signal });
  },

  /**
   * Verify newly added email with token
   * @param {string} token
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ user: object, message: string }>>}
   */
  verifyAddEmail: (token, { signal } = {}) => {
    return client.post(ENDPOINTS.auth.verifyAddEmail, { token }, { signal });
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
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ hasEmail: boolean, isVerified: boolean, canResetPassword: boolean }>>}
   */
  getEmailStatus: ({ signal } = {}) => {
    return client.get(ENDPOINTS.auth.emailStatus, { signal });
  },

  /**
   * Resend verification email
   * @param {string} [email] - Email-Adresse des Nutzers
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ message: string }>>}
   */
  resendVerification: (email, { signal } = {}) => {
    return client.post(ENDPOINTS.auth.resendVerification, { email }, { signal });
  },

  /**
   * Resend verification email for pending email (for already added but unverified emails)
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ message: string, email: string }>>}
   */
  resendAddEmailVerification: ({ signal } = {}) => {
    return client.post(ENDPOINTS.auth.resendAddEmailVerification, null, { signal });
  },
};

export default authService;
