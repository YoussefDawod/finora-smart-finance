/**
 * @fileoverview Authentication Context Provider
 * @description Manages global authentication state with localStorage persistence,
 * auto-login, and comprehensive error handling.
 * 
 * STATE SHAPE:
 * {
 *   user: User | null,
 *   isAuthenticated: boolean,
 *   isLoading: boolean,
 *   error: string | null,
 *   token: string | null
 * }
 * 
 * @module AuthContext
 */

import { useReducer, useEffect, useCallback, createContext } from 'react';

// ============================================
// 🔐 AUTH STATE & ACTIONS
// ============================================

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {string} [avatar]
 * @property {UserPreferences} preferences
 */

/**
 * @typedef {Object} UserPreferences
 * @property {'light'|'dark'|'glass'} theme
 * @property {'USD'|'EUR'} currency
 * @property {'en'|'de'} language
 */

/**
 * @typedef {Object} AuthState
 * @property {User|null} user
 * @property {boolean} isAuthenticated
 * @property {boolean} isLoading
 * @property {string|null} error
 * @property {string|null} token
 */

/** @type {AuthState} */
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading to check for existing session
  error: null,
  token: null,
};

// Action Types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  LOGOUT: 'LOGOUT',
  VERIFY_SUCCESS: 'VERIFY_SUCCESS',
  AUTO_LOGIN_SUCCESS: 'AUTO_LOGIN_SUCCESS',
  AUTO_LOGIN_FAIL: 'AUTO_LOGIN_FAIL',
};

// ============================================
// 🔄 REDUCER
// ============================================

/**
 * Auth Reducer
 * @param {AuthState} state 
 * @param {Object} action 
 * @returns {AuthState}
 */
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
    case AUTH_ACTIONS.AUTO_LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.VERIFY_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGOUT:
    case AUTH_ACTIONS.AUTO_LOGIN_FAIL:
      return {
        ...initialState,
        isLoading: false,
      };

    default:
      return state;
  }
}

// ============================================
// 📦 CONTEXT (without export for Fast Refresh)
// ============================================

const AuthContext = createContext(undefined);

// ============================================
// 🎯 PROVIDER COMPONENT
// ============================================

/**
 * AuthProvider Component
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ============================================
  // 💾 LOCALSTORAGE HELPERS
  // ============================================

  /**
   * Save token to localStorage
   * @param {string} token 
   */
  const saveToken = useCallback((token) => {
    try {
      globalThis.localStorage?.setItem('auth_token', token);
    } catch (error) {
      globalThis.console?.error('Failed to save token to localStorage:', error);
    }
  }, []);

  const saveRefreshToken = useCallback((token) => {
    try {
      globalThis.localStorage?.setItem('refresh_token', token);
    } catch (error) {
      globalThis.console?.error('Failed to save refresh token to localStorage:', error);
    }
  }, []);

  /**
   * Get token from localStorage
   * @returns {string|null}
   */
  const getToken = useCallback(() => {
    try {
      return globalThis.localStorage?.getItem('auth_token');
    } catch (error) {
      globalThis.console?.error('Failed to get token from localStorage:', error);
      return null;
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

  /**
   * Remove token from localStorage
   */
  const removeToken = useCallback(() => {
    try {
      globalThis.localStorage?.removeItem('auth_token');
    } catch (error) {
      globalThis.console?.error('Failed to remove token from localStorage:', error);
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
  // 🔐 AUTH ACTIONS
  // ============================================

  /**
   * Login user
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<void>}
   */
  const login = useCallback(async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      // Import dynamically to avoid circular dependencies
      const { default: authService } = await import('@/api/authService');
      
      const response = await authService.login(email, password);
      
      // Backend returns {success, data: {accessToken, refreshToken, user, ...}}
      const { accessToken, refreshToken, user } = response.data.data;
      
      saveToken(accessToken);
      if (refreshToken) {
        saveRefreshToken(refreshToken);
      }
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token: accessToken },
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Login fehlgeschlagen. Bitte versuche es erneut.';
      
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      throw error;
    }
  }, [saveToken]);

  /**
   * Register new user
   * @param {string} email 
   * @param {string} password 
   * @param {string} name 
   * @returns {Promise<void>}
   */
  const register = useCallback(async (email, password, name) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      const { default: authService } = await import('@/api/authService');
      
      const response = await authService.register(email, password, name);
      
      const { token, user } = response.data;
      
      saveToken(token);
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: { user, token },
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Registrierung fehlgeschlagen. Bitte versuche es erneut.';
      
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      throw error;
    }
  }, [saveToken]);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      // Optional: Call backend logout endpoint
      const { default: authService } = await import('@/api/authService');
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      // Continue with local logout even if API call fails
      globalThis.console?.warn('Logout API call failed:', error);
    } finally {
      removeToken();
      removeRefreshToken();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, [getRefreshToken, removeToken, removeRefreshToken]);

  /**
   * Verify email with token
   * @param {string} verificationToken 
   * @returns {Promise<void>}
   */
  const verifyEmail = useCallback(async (verificationToken) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      const { default: authService } = await import('@/api/authService');
      
      const response = await authService.verifyEmail(verificationToken);
      
      const { user } = response.data;
      
      dispatch({
        type: AUTH_ACTIONS.VERIFY_SUCCESS,
        payload: { user },
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Email-Verifizierung fehlgeschlagen.';
      
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      throw error;
    }
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  /**
   * Set loading state
   * @param {boolean} isLoading 
   */
  const setIsLoading = useCallback((isLoading) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: isLoading });
  }, []);

  // ============================================
  // 🚀 AUTO-LOGIN ON MOUNT
  // ============================================

  useEffect(() => {
    const autoLogin = async () => {
      const token = getToken();
      
      if (!token) {
        dispatch({ type: AUTH_ACTIONS.AUTO_LOGIN_FAIL });
        return;
      }

      try {
        const { default: authService } = await import('@/api/authService');
        
        // Verify token is still valid
        const response = await authService.getCurrentUser();
        
        // Backend returns {success, data: {user, ...}}
        const user = response.data.data?.user || response.data.data;
        
        dispatch({
          type: AUTH_ACTIONS.AUTO_LOGIN_SUCCESS,
          payload: { user, token },
        });
      } catch (error) {
        // Token invalid, expired, or no token present
        removeToken();
        dispatch({ type: AUTH_ACTIONS.AUTO_LOGIN_FAIL });
        // Silently fail - user will be redirected to login
      }
    };

    autoLogin();
  }, [getToken, removeToken]);

  // ============================================
  // 📤 CONTEXT VALUE
  // ============================================

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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Export context separately for Fast Refresh compatibility
export { AuthContext };
