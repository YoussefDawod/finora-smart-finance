/**
 * @fileoverview useAuth Custom Hook
 * @description Wrapper around AuthContext for authentication state and actions
 * 
 * USAGE:
 * const { user, isAuthenticated, login, logout } = useAuth()
 * 
 * if (!isAuthenticated) {
 *   return <Navigate to="/login" />
 * }
 * 
 * @module useAuth
 */

import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

/**
 * Hook to use Auth Context
 * @throws {Error} If used outside AuthProvider
 * @returns {Object} Auth state and actions
 * @returns {Object|null} user - Current authenticated user
 * @returns {boolean} isAuthenticated - User is logged in
 * @returns {boolean} isLoading - Auth is loading (e.g., verifying token)
 * @returns {string|null} error - Auth error message
 * @returns {Function} login - Login with email and password
 * @returns {Function} register - Register new user
 * @returns {Function} logout - Logout user
 * @returns {Function} verifyEmail - Verify email with token
 * @returns {Function} clearError - Clear error message
 * 
 * @example
 * const { user, login, error } = useAuth();
 * 
 * const handleLogin = async (email, password) => {
 *   try {
 *     await login(email, password);
 *   } catch (err) {
 *     console.error('Login failed:', error);
 *   }
 * }
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Make sure your component tree is wrapped with <AuthProvider>.'
    );
  }

  return {
    // State
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    error: context.error,
    token: context.token,

    // Actions
    login: context.login,
    register: context.register,
    logout: context.logout,
    verifyEmail: context.verifyEmail,
    clearError: context.clearError,
    setIsLoading: context.setIsLoading,
  };
}

export default useAuth;
