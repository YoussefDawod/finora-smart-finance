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
   * Login user
   * @param {string} email
   * @param {string} password
   * @returns {Promise<AxiosResponse<{ user: object, token: string }>>}
   */
  login: (email, password) => {
    return client.post(ENDPOINTS.auth.login, { email, password });
  },

  /**
   * Register new user
   * @param {string} email
   * @param {string} password
   * @param {string} name
   * @returns {Promise<AxiosResponse<{ user: object, verificationLink?: string }>>}
   */
  register: (email, password, name) => {
    return client.post(ENDPOINTS.auth.register, { email, password, name });
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
};

export default authService;
