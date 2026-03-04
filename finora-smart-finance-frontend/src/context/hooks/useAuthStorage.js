/**
 * useAuthStorage Hook
 * Extrahierte localStorage/sessionStorage-Logik für AuthContext
 * 
 * Remember Me Logic:
 * - rememberMe = true: Tokens in localStorage (persistent)
 * - rememberMe = false: Tokens in sessionStorage (cleared on browser close)
 */

import { useCallback, useMemo } from 'react';

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
      const localToken = globalThis.localStorage?.getItem(TOKEN_KEY);
      const sessionToken = globalThis.sessionStorage?.getItem(TOKEN_KEY);
      
      // Wenn beide existieren und UNTERSCHIEDLICH sind - WARNUNG!
      if (localToken && sessionToken && localToken !== sessionToken) {
        globalThis.console?.error(
          'Token mismatch between storages detected! Clearing both for security.',
          { localToken: localToken.slice(0, 10) + '...', sessionToken: sessionToken.slice(0, 10) + '...' }
        );
        
        // Beide clearen - User muss sich neu anmelden
        globalThis.localStorage?.removeItem(TOKEN_KEY);
        globalThis.sessionStorage?.removeItem(TOKEN_KEY);
        
        // Optional: Event dispatchen für Logout
         
        globalThis.window?.dispatchEvent(new CustomEvent('auth:token-mismatch'));
        
        return null;
      }
      
      // Normal case: Return token from either storage
      return localToken || sessionToken;
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
  // Refresh-Token wird jetzt als httpOnly Cookie verwaltet.
  // Diese Funktionen räumen nur noch Legacy-Einträge auf.
  // ============================================

  const saveRefreshToken = useCallback(() => {
    // No-Op: Refresh-Token wird als httpOnly Cookie verwaltet
    // und nicht mehr in localStorage/sessionStorage gespeichert.
  }, []);

  const getRefreshToken = useCallback(() => {
    // Legacy-Migration: Falls noch ein alter Token im Storage liegt, zurückgeben
    try {
      return (
        globalThis.localStorage?.getItem(REFRESH_TOKEN_KEY) ||
        globalThis.sessionStorage?.getItem(REFRESH_TOKEN_KEY) ||
        null
      );
    } catch {
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

  return useMemo(() => ({
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
  }), [
    saveToken, getToken, removeToken,
    saveRefreshToken, getRefreshToken, removeRefreshToken,
    clearAllTokens, setRememberMe,
  ]);
}
