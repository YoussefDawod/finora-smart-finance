/**
 * AuthContext - Refactored
 * Schlanker Context Provider mit extrahierten Hooks und Reducer
 */

import { useReducer, useEffect, createContext } from 'react';
import authService from '@/api/authService';
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
  const { getToken, clearAllTokens } = storage;

  // Auth Actions
  const { login, register, logout, verifyEmail, refreshUser, resendVerification, clearError, setIsLoading } =
    useAuthActions(dispatch, storage);

  // ──────────────────────────────────────────────────────────────────────
  // AUTO-LOGIN ON MOUNT
  // ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const autoLogin = async () => {
      const token = getToken();

      if (!token) {
        dispatch({ type: AUTH_ACTIONS.AUTO_LOGIN_FAIL });
        return;
      }

      try {
        const response = await authService.getCurrentUser();
        const user = response.data.data?.user || response.data.data;

        dispatch({
          type: AUTH_ACTIONS.AUTO_LOGIN_SUCCESS,
          payload: { user, token },
        });
      } catch (error) {
        clearAllTokens();
        dispatch({ type: AUTH_ACTIONS.AUTO_LOGIN_FAIL });
      }
    };

    autoLogin();
  }, [getToken, clearAllTokens]);

  // Persist user preferences when user changes
  useEffect(() => {
    if (state.user?.preferences) {
      persistUserPreferences(state.user.preferences);
    }
  }, [state.user]);

  // ──────────────────────────────────────────────────────────────────────
  // CONTEXT VALUE
  // ──────────────────────────────────────────────────────────────────────
  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    token: state.token,

    // Actions
    login,
    register,
    logout,
    verifyEmail,
    clearError,
    setIsLoading,
    refreshUser,
    resendVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext, AuthProvider };
