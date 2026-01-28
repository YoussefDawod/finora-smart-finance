/**
 * useAuthStorage Hook
 * Extrahierte localStorage/sessionStorage-Logik für AuthContext
 * 
 * Remember Me Logic:
 * - rememberMe = true: Tokens in localStorage (persistent)
 * - rememberMe = false: Tokens in sessionStorage (cleared on browser close)
 */

import { useCallback } from 'react';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const REMEMBER_ME_KEY = 'auth_remember_me';

/**
 * Custom Hook für Auth Token Storage
 */
export function useAuthStorage() {

  /**
   * Get the current storage based on rememberMe setting
   * @returns {Storage} localStorage or sessionStorage
   */
  const getCurrentStorage = useCallback(() => {
    try {
      const rememberMe = globalThis.localStorage?.getItem(REMEMBER_ME_KEY);
      return rememberMe === 'false' ? globalThis.sessionStorage : globalThis.localStorage;
    } catch {
      return globalThis.localStorage;
    }
  }, []);

  /**
   * Set the storage preference based on rememberMe
   * @param {boolean} rememberMe 
   */
  const setRememberMe = useCallback((rememberMe) => {
    try {
      globalThis.localStorage?.setItem(REMEMBER_ME_KEY, String(rememberMe));
    } catch (error) {
      globalThis.console?.error('Failed to set rememberMe preference:', error);
    }
  }, []);

  // ============================================
  // ACCESS TOKEN
  // ============================================

  const saveToken = useCallback((token, rememberMe) => {
    try {
      // If rememberMe is explicitly passed, update the preference
      if (typeof rememberMe === 'boolean') {
        setRememberMe(rememberMe);
      }
      getCurrentStorage()?.setItem(TOKEN_KEY, token);
    } catch (error) {
      globalThis.console?.error('Failed to save token:', error);
    }
  }, [getCurrentStorage, setRememberMe]);

  const getToken = useCallback(() => {
    try {
      // Check both storages
      return globalThis.localStorage?.getItem(TOKEN_KEY) || 
             globalThis.sessionStorage?.getItem(TOKEN_KEY);
    } catch (error) {
      globalThis.console?.error('Failed to get token:', error);
      return null;
    }
  }, []);

  const removeToken = useCallback(() => {
    try {
      globalThis.localStorage?.removeItem(TOKEN_KEY);
      globalThis.sessionStorage?.removeItem(TOKEN_KEY);
    } catch (error) {
      globalThis.console?.error('Failed to remove token:', error);
    }
  }, []);

  // ============================================
  // REFRESH TOKEN
  // ============================================

  const saveRefreshToken = useCallback((token) => {
    try {
      getCurrentStorage()?.setItem(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      globalThis.console?.error('Failed to save refresh token:', error);
    }
  }, [getCurrentStorage]);

  const getRefreshToken = useCallback(() => {
    try {
      return globalThis.localStorage?.getItem(REFRESH_TOKEN_KEY) || 
             globalThis.sessionStorage?.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      globalThis.console?.error('Failed to get refresh token:', error);
      return null;
    }
  }, []);

  const removeRefreshToken = useCallback(() => {
    try {
      globalThis.localStorage?.removeItem(REFRESH_TOKEN_KEY);
      globalThis.sessionStorage?.removeItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      globalThis.console?.error('Failed to remove refresh token:', error);
    }
  }, []);

  // ============================================
  // CLEAR ALL
  // ============================================

  const clearAllTokens = useCallback(() => {
    removeToken();
    removeRefreshToken();
    try {
      globalThis.localStorage?.removeItem(REMEMBER_ME_KEY);
    } catch {
      // Ignore
    }
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

    // Remember Me
    setRememberMe,
  };
}
