/**
 * useAuthActions Hook
 * Extrahierte Auth-Actions für AuthContext
 */

import { useCallback } from 'react';
import i18n from '@/i18n';
import authService from '@/api/authService';
import { AUTH_ACTIONS } from '../reducers/authReducer';

/**
 * Custom Hook für Auth Actions
 * @param {Function} dispatch - Reducer dispatch function
 * @param {Object} storage - Token storage methods from useAuthStorage
 */
export function useAuthActions(dispatch, storage) {
  const { saveToken, getRefreshToken, clearAllTokens, setRememberMe } = storage;

  // ============================================
  // LOGIN
  // ============================================

  const login = useCallback(
    async (name, password, rememberMe = true) => {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      try {
        const response = await authService.login(name, password);
        const { accessToken, user } = response.data.data;

        // Set storage preference before saving tokens
        setRememberMe(rememberMe);
        saveToken(accessToken, rememberMe);
        // Refresh-Token wird als httpOnly Cookie vom Backend gesetzt —
        // kein manuelles Speichern im Frontend mehr nötig.

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user, token: accessToken },
        });

        // Lifecycle-Notification als Toast anzeigen (fire-and-forget)
        const notification = response.data.notification;
        if (notification) {
          const toastType = notification.severity === 'error' ? 'warning' : 'info';
          const messageKey =
            notification.type === 'retention_final_warning'
              ? 'lifecycle.toast.retentionFinalWarning'
              : 'lifecycle.toast.retentionReminder';

          window.dispatchEvent(
            new CustomEvent('toast:add', {
              detail: {
                type: toastType,
                message: i18n.t(messageKey, { count: notification.transactionCount }),
                duration: 8000,
              },
            })
          );
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || error.message || i18n.t('auth.errors.loginFailed');

        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
        throw error;
      }
    },
    [dispatch, saveToken, setRememberMe]
  );

  // ============================================
  // REGISTER
  // ============================================

  const register = useCallback(
    async (data) => {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      try {
        const response = await authService.register(data);
        const { accessToken, user } = response.data.data;

        saveToken(accessToken);
        // Refresh-Token wird als httpOnly Cookie vom Backend gesetzt —
        // kein manuelles Speichern im Frontend mehr nötig.

        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: { user, token: accessToken },
        });

        return user;
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || error.message || i18n.t('auth.errors.registerFailed');

        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
        throw error;
      }
    },
    [dispatch, saveToken]
  );

  // ============================================
  // LOGOUT
  // ============================================

  const logout = useCallback(async () => {
    try {
      // Logout-Request mit withCredentials — Cookie wird automatisch mitgesendet
      // Refresh-Token wird vom Backend aus dem Cookie gelesen
      const refreshToken = getRefreshToken();
      await authService.logout(refreshToken);
    } catch (error) {
      globalThis.console?.warn('Logout API call failed:', error);
    } finally {
      clearAllTokens();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, [dispatch, getRefreshToken, clearAllTokens]);

  // ============================================
  // VERIFY EMAIL
  // ============================================

  const verifyEmail = useCallback(
    async (verificationToken) => {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      try {
        const response = await authService.verifyEmail(verificationToken);
        const { user } = response.data;

        dispatch({
          type: AUTH_ACTIONS.VERIFY_SUCCESS,
          payload: { user },
        });
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || error.message || i18n.t('auth.errors.verifyFailed');

        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
        throw error;
      }
    },
    [dispatch]
  );

  // ============================================
  // REFRESH USER
  // ============================================

  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser();
      const user = response.data.data?.user || response.data.data;
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: { user },
      });
    } catch (error) {
      globalThis.console?.error('Failed to refresh user:', error);
    }
  }, [dispatch]);

  // ============================================
  // PASSWORD RESET (PUBLIC FLOW)
  // ============================================

  const forgotPassword = useCallback(async (email) => {
    await authService.forgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (token, newPassword) => {
    await authService.resetPassword(token, newPassword);
  }, []);

  // ============================================
  // RESEND VERIFICATION
  // ============================================

  const resendVerification = useCallback(async (email) => {
    try {
      const response = await authService.resendVerification(email);
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Verifizierungs-Email konnte nicht gesendet werden.';
      throw new Error(errorMessage, { cause: error });
    }
  }, []);

  // ============================================
  // UTILITY ACTIONS
  // ============================================

  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, [dispatch]);

  const setIsLoading = useCallback(
    (isLoading) => {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: isLoading });
    },
    [dispatch]
  );

  return {
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
  };
}
