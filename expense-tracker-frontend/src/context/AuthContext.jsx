import React, { useState, useEffect, useCallback } from 'react';
import { authService } from '../api/authService';
import PropTypes from 'prop-types';
import { AuthContext } from './AuthContextDef';

export const AuthProvider = ({ children }) => {
  // ============================================
  // State Management
  // ============================================
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [expiresIn, setExpiresIn] = useState(null);

  // ============================================
  // Helper Functions
  // ============================================
  
  /**
   * Clear error after timeout
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Update tokens in state
   */
  const updateTokens = useCallback((access, refresh, expires) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    setExpiresIn(expires);
  }, []);

  // ============================================
  // Auth Status Check on Mount
  // ============================================
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // 1) Versuche gespeicherte Tokens zu laden (inkl. Timer-Setup)
        const hasValidToken = await authService.loadStoredTokens();

        // 2) Wenn kein gültiger Access Token gefunden, aber Refresh vorhanden → Refresh-Flow
        if (!hasValidToken) {
          try {
            const refreshToken = authService.getRefreshToken?.();
            if (refreshToken) {
              await authService.refreshAccessToken();
            } else {
              // Keine Tokens vorhanden
              setIsAuthenticated(false);
              setUser(null);
              return;
            }
          } catch (refreshErr) {
            console.error('Refresh on init failed', refreshErr);
            authService.logout();
            setIsAuthenticated(false);
            setUser(null);
            return;
          }
        }

        // 3) User aus localStorage laden oder vom Backend holen
        let userData = authService.getUser();

        if (!userData) {
          try {
            userData = await authService.fetchUserProfile();
          } catch (err) {
            console.error('Failed to fetch user profile', err);
            authService.logout();
            setIsAuthenticated(false);
            setUser(null);
            return;
          }
        }

        // 4) State setzen
        setUser(userData);
        setIsAuthenticated(true);
        updateTokens(
          authService.accessToken,
          authService.refreshToken,
          authService.tokenExpiry
        );
      } catch (err) {
        console.error('Auth initialization failed', err);
        setError(err);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [updateTokens]);

  // ============================================
  // Login Function
  // ============================================
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await authService.login(email, password);
      
      setUser(userData);
      setIsAuthenticated(true);
      updateTokens(
        authService.accessToken,
        authService.refreshToken,
        authService.tokenExpiry
      );
      
      return userData;
    } catch (err) {
      setError(err);
      setIsAuthenticated(false);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateTokens]);

  // ============================================
  // Register Function
  // ============================================
  const register = useCallback(async ({ email, password, name }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.register({ email, password, name });
      // Don't auto-login after register, user needs to verify email
      return result; // return both user and verificationLink
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // Logout Function
  // ============================================
  const logout = useCallback(() => {
    // Optional: könnte einen API-Logout callen; aktuell nur lokale Bereinigung
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setAccessToken(null);
    setRefreshToken(null);
    setExpiresIn(null);
    setError(null);
  }, []);

  // ============================================
  // Refresh Token Function
  // ============================================
  const refreshAccessToken = useCallback(async () => {
    setError(null);
    try {
      const newAccessToken = await authService.refreshAccessToken();
      updateTokens(
        authService.accessToken,
        authService.refreshToken,
        authService.tokenExpiry
      );
      return newAccessToken;
    } catch (err) {
      setError(err);
      // If refresh fails, logout user
      logout();
      throw err;
    }
  }, [logout, updateTokens]);

  // ============================================
  // Additional Auth Functions
  // ============================================
  const forgotPassword = useCallback(async (email) => {
    setError(null);
    try {
      return await authService.forgotPassword(email);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const resetPassword = useCallback(async (token, password) => {
    setError(null);
    try {
      return await authService.resetPassword(token, password);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const resendVerification = useCallback(async (email) => {
    setError(null);
    try {
      return await authService.resendVerification(email);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  // ============================================
  // Auto Clear Error after 5 seconds
  // ============================================
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // ============================================
  // Context Value
  // ============================================
  const value = {
    // State
    user,
    isAuthenticated,
    isLoading: loading,
    error,
    accessToken,
    refreshToken,
    expiresIn,
    
    // Functions
    login,
    logout,
    register,
    refreshAccessToken,
    forgotPassword,
    resetPassword,
    resendVerification,
    clearError,
    
    // Deprecated (for backwards compatibility)
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};
