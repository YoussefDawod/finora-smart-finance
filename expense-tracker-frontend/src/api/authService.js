// src/api/authService.js
import { apiClient } from './client';
// Use ENDPOINTS directly or hardcode if not available in current context. 
// Assuming integration with apiClient mostly.

const AUTH_ENDPOINTS = {
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    LOGOUT: '/auth/logout'
};

class AuthService {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.isRefreshing = false;
    this.refreshPromise = null;
  }

  /**
   * Store tokens
   */
  setTokens(accessToken, refreshToken, expiresIn = 3600) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiry = Date.now() + expiresIn * 1000;

    // Store in secure location (NOT localStorage for sensitive tokens in real robust apps, but here session storage as requested)
    sessionStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('refreshToken', refreshToken);
    sessionStorage.setItem('tokenExpiry', this.tokenExpiry);

    apiClient.setAuthToken(accessToken);
  }

  /**
   * Get access token
   */
  getAccessToken() {
    if (this.isTokenExpired()) {
      return null;
    }
    return this.accessToken;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(buffer = 60000) { // 1 minute buffer
    if (!this.tokenExpiry) return true;
    return Date.now() > this.tokenExpiry - buffer;
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
        const response = await apiClient.post(AUTH_ENDPOINTS.REFRESH, {
          refreshToken: this.refreshToken,
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

    this.setTokens(
      response.data.accessToken,
      response.data.refreshToken,
      response.data.expiresIn
    );

    return response.data.user;
  }

  /**
   * Logout
   */
  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;

    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('tokenExpiry');

    apiClient.setAuthToken(null);
  }

  /**
   * Load stored tokens on app init
   */
  async loadStoredTokens() {
    const accessToken = sessionStorage.getItem('accessToken');
    const refreshToken = sessionStorage.getItem('refreshToken');
    const tokenExpiry = sessionStorage.getItem('tokenExpiry');

    if (accessToken && refreshToken && tokenExpiry) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.tokenExpiry = parseInt(tokenExpiry);

      // Check if token is still valid
      if (!this.isTokenExpired()) {
        apiClient.setAuthToken(accessToken);
        return true;
      } else if (this.refreshToken) {
        // Try to refresh
        try {
            await this.refreshAccessToken();
            return true;
        } catch(_e) {
            return false;
        }
      }
    }

    return false;
  }
}

export const authService = new AuthService();
export { AUTH_ENDPOINTS };
