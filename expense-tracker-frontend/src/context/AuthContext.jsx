import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../api/authService';
import PropTypes from 'prop-types';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const hasValidToken = await authService.loadStoredTokens();
        if (hasValidToken) {
          // If we have a token, we might want to fetch the user profile here
          // For now, we assume authenticated if token exists/refreshed
          setIsAuthenticated(true);
          // Optional: user = await fetchUserProfile(); setUser(user);
        }
      } catch (err) {
        console.error('Auth initialization failed', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await authService.login(email, password);
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout
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
