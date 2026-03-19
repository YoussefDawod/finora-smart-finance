/**
 * AuthContext - Refactored
 * Schlanker Context Provider mit extrahierten Hooks und Reducer
 */

import { useReducer, useEffect, useMemo, createContext } from 'react';
import authService from '@/api/authService';
import { tryInitialRefresh } from '@/api/tokenRefresh';
import { persistUserPreferences } from '@/utils/userPreferences';
import { authReducer, initialState, AUTH_ACTIONS } from './reducers/authReducer';
import { useAuthStorage } from './hooks/useAuthStorage';
import { useAuthActions } from './hooks/useAuthActions';

// ============================================================================
// CONTEXT
// ============================================================================
const AuthContext = createContext(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================
function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ──────────────────────────────────────────────────────────────────────
  // HOOKS
  // ──────────────────────────────────────────────────────────────────────

  // Storage Operations
  const storage = useAuthStorage();
  const { clearAllTokens } = storage;

  // Auth Actions
  const {
    login,
    register,
    logout,
    verifyEmail,
    refreshUser,
    resendVerification,
    forgotPassword,
    resetPassword,
    clearError,
    setIsLoading,
  } = useAuthActions(dispatch, storage);

  // ──────────────────────────────────────────────────────────────────────
  // AUTO-LOGIN ON MOUNT
  // ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const abortController = new AbortController();

    const autoLogin = async () => {
      // Nach Page-Reload ist der In-Memory-Token verloren.
      // Zuerst stillen Refresh über httpOnly Cookie versuchen.
      // tryInitialRefresh() ist ein Singleton — bei StrictMode (mount → unmount → mount)
      // wird dasselbe Promise wiederverwendet, keine doppelte Token-Rotation.
      const token = await tryInitialRefresh();

      if (cancelled) return;

      if (!token) {
        dispatch({ type: AUTH_ACTIONS.AUTO_LOGIN_FAIL });
        return;
      }

      try {
        const response = await authService.getCurrentUser({
          signal: abortController.signal,
        });

        if (cancelled) return;

        const user = response.data.data?.user || response.data.data;

        dispatch({
          type: AUTH_ACTIONS.AUTO_LOGIN_SUCCESS,
          payload: { user, token },
        });
      } catch {
        if (!cancelled) {
          clearAllTokens();
          dispatch({ type: AUTH_ACTIONS.AUTO_LOGIN_FAIL });
        }
      }
    };

    autoLogin();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [clearAllTokens]);

  // ──────────────────────────────────────────────────────────────────────
  // HANDLE 401 UNAUTHORIZED EVENTS (Token Expiry)
  // ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleAuthUnauthorized = () => {
      // Token expired or invalidated - trigger logout
      clearAllTokens();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    };

    globalThis.window?.addEventListener('auth:unauthorized', handleAuthUnauthorized);

    return () => {
      globalThis.window?.removeEventListener('auth:unauthorized', handleAuthUnauthorized);
    };
  }, [clearAllTokens]);

  // ──────────────────────────────────────────────────────────────────────
  // HANDLE TOKEN REFRESH EVENTS (Silent Refresh)
  // ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleTokenRefreshed = event => {
      const { accessToken } = event.detail || {};
      if (accessToken) {
        // Update tokens in storage (already done in tokenRefresh.js)
        // Update token in auth state so context consumers get the new value
        dispatch({
          type: AUTH_ACTIONS.TOKEN_REFRESHED,
          payload: { token: accessToken },
        });

        // Refresh-Token wird jetzt als httpOnly Cookie verwaltet —
        // kein manuelles Speichern im Frontend mehr nötig.
      }
    };

    globalThis.window?.addEventListener('auth:token-refreshed', handleTokenRefreshed);

    return () => {
      globalThis.window?.removeEventListener('auth:token-refreshed', handleTokenRefreshed);
    };
  }, []);

  // Persist user preferences when user changes
  useEffect(() => {
    if (state.user?.preferences) {
      persistUserPreferences(state.user.preferences);
    }
  }, [state.user]);

  // ──────────────────────────────────────────────────────────────────────
  // CONTEXT VALUE
  // ──────────────────────────────────────────────────────────────────────
  const value = useMemo(
    () => ({
      // State
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      error: state.error,
      token: state.token,

      // Derived role flags
      isAdmin: state.user?.role === 'admin',
      isViewer: state.user?.role === 'viewer',

      // Actions
      login,
      register,
      logout,
      verifyEmail,
      clearError,
      setIsLoading,
      refreshUser,
      resendVerification,
      forgotPassword,
      resetPassword,
    }),
    [
      state.user,
      state.isAuthenticated,
      state.isLoading,
      state.error,
      state.token,
      login,
      register,
      logout,
      verifyEmail,
      clearError,
      setIsLoading,
      refreshUser,
      resendVerification,
      forgotPassword,
      resetPassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext, AuthProvider };
