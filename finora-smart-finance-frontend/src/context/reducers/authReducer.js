/**
 * Auth Reducer Module
 * Zentrale State-Management Logik für Authentication
 */

// ============================================================================
// INITIAL STATE
// ============================================================================
export const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading to check for existing session
  error: null,
  token: null,
};

// ============================================================================
// ACTION TYPES
// ============================================================================
export const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  LOGOUT: 'LOGOUT',
  VERIFY_SUCCESS: 'VERIFY_SUCCESS',
  AUTO_LOGIN_SUCCESS: 'AUTO_LOGIN_SUCCESS',
  AUTO_LOGIN_FAIL: 'AUTO_LOGIN_FAIL',
  UPDATE_USER: 'UPDATE_USER',
};

// ============================================================================
// REDUCER
// ============================================================================
export function authReducer(state, action) {
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

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: action.payload.user,
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
