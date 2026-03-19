/**
 * useAuthStorage Hook
 * Access-Token wird als In-Memory-Variable verwaltet (XSS-sicher).
 * Refresh-Token als httpOnly Cookie (vom Backend verwaltet).
 * localStorage wird nur noch für Remember-Me-Präferenz genutzt.
 */

import { useCallback, useMemo } from 'react';
import { getAccessToken, setAccessToken, clearAccessToken } from '@/api/tokenRefresh';

const REFRESH_TOKEN_KEY = 'refresh_token';
const REMEMBER_ME_KEY = 'auth_remember_me';

/**
 * Custom Hook für Auth Token Storage
 */
export function useAuthStorage() {
  /**
   * Set the storage preference based on rememberMe
   * @param {boolean} rememberMe
   */
  const setRememberMe = useCallback(rememberMe => {
    try {
      globalThis.localStorage?.setItem(REMEMBER_ME_KEY, String(rememberMe));
    } catch (error) {
      globalThis.console?.error('Failed to set rememberMe preference:', error);
    }
  }, []);

  // ============================================
  // ACCESS TOKEN
  // ============================================

  const saveToken = useCallback(
    (token, rememberMe) => {
      try {
        // If rememberMe is explicitly passed, update the preference
        if (typeof rememberMe === 'boolean') {
          setRememberMe(rememberMe);
        }
        // Access-Token im In-Memory-Speicher (XSS-sicher, nicht in localStorage)
        setAccessToken(token);
      } catch (error) {
        globalThis.console?.error('Failed to save token:', error);
      }
    },
    [setRememberMe]
  );

  const getToken = useCallback(() => {
    return getAccessToken();
  }, []);

  const removeToken = useCallback(() => {
    clearAccessToken();
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

  return useMemo(
    () => ({
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
    }),
    [
      saveToken,
      getToken,
      removeToken,
      saveRefreshToken,
      getRefreshToken,
      removeRefreshToken,
      clearAllTokens,
      setRememberMe,
    ]
  );
}
