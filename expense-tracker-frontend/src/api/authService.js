// src/api/authService.js
import { apiClient } from './client';
import * as tokenManager from '../utils/tokenManager';

const AUTH_ENDPOINTS = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  REFRESH: '/auth/refresh',
  ME: '/auth/me',
  UPDATE_PROFILE: '/auth/me',
  DELETE_ACCOUNT: '/auth/me',
  LOGOUT: '/auth/logout',
  VERIFY_EMAIL: '/auth/verify-email',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  RESEND_VERIFICATION: '/auth/resend-verification',
  CHANGE_EMAIL: '/auth/change-email',
  VERIFY_EMAIL_CHANGE: '/auth/verify-email-change',
  CHANGE_PASSWORD: '/auth/change-password',
  UPDATE_PREFERENCES: '/auth/preferences',
  EXPORT_DATA: '/auth/export-data',
  DELETE_TRANSACTIONS: '/auth/transactions',
};

class AuthService {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.isRefreshing = false;
    this.refreshPromise = null;
    this.user = null;
    
    // Set up refresh callback for tokenManager
    tokenManager.setRefreshCallback(() => this.refreshAccessToken());
  }

  /**
   * Store tokens using tokenManager
   */
  setTokens(accessToken, refreshToken, expiresIn = 3600) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiry = Date.now() + expiresIn * 1000;

    // Use tokenManager for storage
    tokenManager.saveTokens(accessToken, refreshToken, expiresIn);
    
    // Also store user in localStorage
    apiClient.setAuthToken(accessToken);
  }

  /**
   * Store user data
   */
  setUser(user) {
    this.user = user;
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }

  /**
   * Get stored user
   */
  getUser() {
    if (this.user) return this.user;
    
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        this.user = JSON.parse(stored);
        return this.user;
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Get access token using tokenManager
   */
  getAccessToken() {
    const token = tokenManager.getAccessToken();
    if (token) {
      this.accessToken = token;
    }
    return token;
  }

  /**
   * Get refresh token using tokenManager
   */
  getRefreshToken() {
    const token = tokenManager.getRefreshToken();
    if (token) {
      this.refreshToken = token;
    }
    return token;
  }

  /**
   * Check if token is expired using tokenManager
   */
  isTokenExpired(buffer = 60000) {
    // Use tokenManager's validation
    return !tokenManager.isTokenValid();
  }

  /**
   * Refresh tokens
   */
  async refreshAccessToken() {
    // Prevent multiple simultaneous refresh requests
    if (this.isRefreshing) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;

    this.refreshPromise = (async () => {
      try {
        // Get refresh token from tokenManager
        const refreshToken = tokenManager.getRefreshToken();
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await apiClient.post(AUTH_ENDPOINTS.REFRESH, {
          refreshToken,
        });

        this.setTokens(
          response.data.accessToken,
          response.data.refreshToken,
          response.data.expiresIn
        );

        return response.data.accessToken;
      } catch (_error) {
        // Refresh failed - clear tokens and redirect to login
        this.logout();
        throw _error;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Login
   */
  async login(email, password) {
    const response = await apiClient.post(AUTH_ENDPOINTS.LOGIN, {
      email,
      password,
    });

    this.setTokens(response.data.accessToken, response.data.refreshToken, response.data.expiresIn);
    this.setUser(response.data.user);
    return response.data.user;
  }

  /**
   * Fetch current user profile
   */
  async fetchUserProfile() {
    const response = await apiClient.get(AUTH_ENDPOINTS.ME);
    this.setUser(response.data.user);
    return response.data.user;
  }

  /**
   * Logout - clear all tokens using tokenManager
   */
  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.user = null;

    // Use tokenManager to clear tokens
    tokenManager.clearTokens();
    
    // Also clear user data
    localStorage.removeItem('user');

    apiClient.setAuthToken(null);
  }

  /**
   * Load stored tokens on app init using tokenManager
   */
  async loadStoredTokens() {
    // Initialize tokenManager (sets up auto-refresh)
    const hasValidTokens = tokenManager.initializeTokenManager();
    
    if (hasValidTokens) {
      // Load tokens into service
      this.accessToken = tokenManager.getAccessToken();
      this.refreshToken = tokenManager.getRefreshToken();
      this.tokenExpiry = tokenManager.getTokenExpiry();

      // Load user from localStorage
      this.getUser();

      // Set auth token in API client
      if (this.accessToken) {
        apiClient.setAuthToken(this.accessToken);
        return true;
      }
    }
    
    // Try to refresh if we have a refresh token but access token is expired
    const refreshToken = tokenManager.getRefreshToken();
    if (refreshToken) {
      try {
        await this.refreshAccessToken();
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }

  async register({ email, password, name }) {
    const response = await apiClient.post(AUTH_ENDPOINTS.REGISTER, { email, password, name });
    return response.data; // Return both user and verificationLink
  }

  async me() {
    const response = await apiClient.get(AUTH_ENDPOINTS.ME);
    return response.data;
  }

  async verifyEmail(token) {
    const response = await apiClient.get(AUTH_ENDPOINTS.VERIFY_EMAIL, { token });
    return response.data;
  }

  async resendVerification(email) {
    const response = await apiClient.post(AUTH_ENDPOINTS.RESEND_VERIFICATION, { email });
    return response.data;
  }

  async forgotPassword(email) {
    const response = await apiClient.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email });
    return response.data;
  }

  async resetPassword(token, password) {
    const response = await apiClient.post(AUTH_ENDPOINTS.RESET_PASSWORD, { token, password });
    return response.data;
  }

  async updateProfile(name) {
    const response = await apiClient.put(AUTH_ENDPOINTS.UPDATE_PROFILE, { name });
    this.setUser(response.data); // Update cached user
    return response.data;
  }

  async changeEmail(newEmail) {
    const response = await apiClient.post(AUTH_ENDPOINTS.CHANGE_EMAIL, { newEmail });
    return response.data;
  }

  async verifyEmailChange(token) {
    const response = await apiClient.post(AUTH_ENDPOINTS.VERIFY_EMAIL_CHANGE, { token });
    this.setUser(response.data); // Update cached user with new email
    return response.data;
  }

  async deleteAccount(email) {
    const response = await apiClient.delete(AUTH_ENDPOINTS.DELETE_ACCOUNT, { email });
    this.logout(); // Clear tokens after account deletion
    return response.data;
  }

  async changePassword(currentPassword, newPassword) {
    const response = await apiClient.post(AUTH_ENDPOINTS.CHANGE_PASSWORD, { 
      currentPassword, 
      newPassword 
    });
    return response.data;
  }

  async updatePreferences(preferences) {
    const response = await apiClient.put(AUTH_ENDPOINTS.UPDATE_PREFERENCES, preferences);
    this.setUser(response.data); // Update cached user with new preferences
    return response.data;
  }

  async exportData() {
    const response = await apiClient.post(AUTH_ENDPOINTS.EXPORT_DATA);
    return response.data;
  }

  async deleteTransactions(password) {
    const response = await apiClient.delete(AUTH_ENDPOINTS.DELETE_TRANSACTIONS, { password });
    return response.data;
  }
}

export const authService = new AuthService();
export { AUTH_ENDPOINTS };
