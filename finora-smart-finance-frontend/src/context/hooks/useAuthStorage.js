/**
 * useAuthStorage Hook
 * Extrahierte localStorage-Logik für AuthContext
 */

import { useCallback } from 'react';

/**
 * Custom Hook für Auth Token Storage
 */
export function useAuthStorage() {
  // ============================================
  // ACCESS TOKEN
  // ============================================

  const saveToken = useCallback((token) => {
    try {
      globalThis.localStorage?.setItem('auth_token', token);
    } catch (error) {
      globalThis.console?.error('Failed to save token to localStorage:', error);
    }
  }, []);

  const getToken = useCallback(() => {
    try {
      return globalThis.localStorage?.getItem('auth_token');
    } catch (error) {
      globalThis.console?.error('Failed to get token from localStorage:', error);
      return null;
    }
  }, []);

  const removeToken = useCallback(() => {
    try {
      globalThis.localStorage?.removeItem('auth_token');
    } catch (error) {
      globalThis.console?.error('Failed to remove token from localStorage:', error);
    }
  }, []);

  // ============================================
  // REFRESH TOKEN
  // ============================================

  const saveRefreshToken = useCallback((token) => {
    try {
      globalThis.localStorage?.setItem('refresh_token', token);
    } catch (error) {
      globalThis.console?.error('Failed to save refresh token to localStorage:', error);
    }
  }, []);

  const getRefreshToken = useCallback(() => {
    try {
      return globalThis.localStorage?.getItem('refresh_token');
    } catch (error) {
      globalThis.console?.error('Failed to get refresh token from localStorage:', error);
      return null;
    }
  }, []);

  const removeRefreshToken = useCallback(() => {
    try {
      globalThis.localStorage?.removeItem('refresh_token');
    } catch (error) {
      globalThis.console?.error('Failed to remove refresh token from localStorage:', error);
    }
  }, []);

  // ============================================
  // CLEAR ALL
  // ============================================

  const clearAllTokens = useCallback(() => {
    removeToken();
    removeRefreshToken();
  }, [removeToken, removeRefreshToken]);

  return {
    // Access Token
    saveToken,
    getToken,
    removeToken,

    // Refresh Token
    saveRefreshToken,
    getRefreshToken,
    removeRefreshToken,

    // Clear All
    clearAllTokens,
  };
}
