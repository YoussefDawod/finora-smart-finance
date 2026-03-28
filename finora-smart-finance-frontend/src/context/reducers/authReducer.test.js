/**
 * @fileoverview Auth Reducer Tests
 * @description Tests für Auth State Management inkl. TOKEN_REFRESHED
 */

import { describe, it, expect } from 'vitest';
import { authReducer, initialState, AUTH_ACTIONS } from './authReducer';

describe('authReducer', () => {
  // ============================================
  // Initial State
  // ============================================
  describe('Initial State', () => {
    it('should have correct initial values', () => {
      expect(initialState).toEqual({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
        token: null,
      });
    });
  });

  // ============================================
  // SET_LOADING
  // ============================================
  describe('SET_LOADING', () => {
    it('should set loading to true', () => {
      const state = authReducer(initialState, {
        type: AUTH_ACTIONS.SET_LOADING,
        payload: true,
      });
      expect(state.isLoading).toBe(true);
    });

    it('should set loading to false', () => {
      const state = authReducer(
        { ...initialState, isLoading: true },
        { type: AUTH_ACTIONS.SET_LOADING, payload: false }
      );
      expect(state.isLoading).toBe(false);
    });
  });

  // ============================================
  // SET_ERROR / CLEAR_ERROR
  // ============================================
  describe('SET_ERROR / CLEAR_ERROR', () => {
    it('should set error and stop loading', () => {
      const state = authReducer(
        { ...initialState, isLoading: true },
        { type: AUTH_ACTIONS.SET_ERROR, payload: 'Login failed' }
      );
      expect(state.error).toBe('Login failed');
      expect(state.isLoading).toBe(false);
    });

    it('should clear error', () => {
      const state = authReducer(
        { ...initialState, error: 'Some error' },
        { type: AUTH_ACTIONS.CLEAR_ERROR }
      );
      expect(state.error).toBeNull();
    });
  });

  // ============================================
  // LOGIN_SUCCESS / REGISTER_SUCCESS / AUTO_LOGIN_SUCCESS
  // ============================================
  describe('Auth Success Actions', () => {
    const successPayload = {
      user: { id: 'user-123', name: 'Max' },
      token: 'access-token-123',
    };

    it.each([
      AUTH_ACTIONS.LOGIN_SUCCESS,
      AUTH_ACTIONS.REGISTER_SUCCESS,
      AUTH_ACTIONS.AUTO_LOGIN_SUCCESS,
    ])('should handle %s', actionType => {
      const state = authReducer(initialState, {
        type: actionType,
        payload: successPayload,
      });

      expect(state.user).toEqual(successPayload.user);
      expect(state.token).toBe('access-token-123');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  // ============================================
  // LOGOUT / AUTO_LOGIN_FAIL
  // ============================================
  describe('Logout Actions', () => {
    const authenticatedState = {
      user: { id: 'user-123' },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      token: 'old-token',
    };

    it.each([AUTH_ACTIONS.LOGOUT, AUTH_ACTIONS.AUTO_LOGIN_FAIL])(
      'should handle %s and reset state',
      actionType => {
        const state = authReducer(authenticatedState, { type: actionType });

        expect(state.user).toBeNull();
        expect(state.isAuthenticated).toBe(false);
        expect(state.isLoading).toBe(false);
        expect(state.token).toBeNull();
      }
    );
  });

  // ============================================
  // VERIFY_SUCCESS
  // ============================================
  describe('VERIFY_SUCCESS', () => {
    it('should update user and stop loading', () => {
      const state = authReducer(
        { ...initialState, isLoading: true },
        {
          type: AUTH_ACTIONS.VERIFY_SUCCESS,
          payload: { user: { id: 'user-123', isVerified: true } },
        }
      );

      expect(state.user).toEqual({ id: 'user-123', isVerified: true });
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  // ============================================
  // UPDATE_USER
  // ============================================
  describe('UPDATE_USER', () => {
    it('should update user without affecting other state', () => {
      const authenticatedState = {
        user: { id: 'user-123', name: 'Old Name' },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        token: 'current-token',
      };

      const state = authReducer(authenticatedState, {
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: { user: { id: 'user-123', name: 'New Name' } },
      });

      expect(state.user.name).toBe('New Name');
      expect(state.token).toBe('current-token');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  // ============================================
  // TOKEN_REFRESHED
  // ============================================
  describe('TOKEN_REFRESHED', () => {
    it('should update token without affecting user or auth state', () => {
      const authenticatedState = {
        user: { id: 'user-123', name: 'Max' },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        token: 'old-access-token',
      };

      const state = authReducer(authenticatedState, {
        type: AUTH_ACTIONS.TOKEN_REFRESHED,
        payload: { token: 'new-access-token' },
      });

      expect(state.token).toBe('new-access-token');
      expect(state.user).toEqual({ id: 'user-123', name: 'Max' });
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should not change isAuthenticated', () => {
      const state = authReducer(
        { ...initialState, isAuthenticated: true, token: 'old-token' },
        { type: AUTH_ACTIONS.TOKEN_REFRESHED, payload: { token: 'new-token' } }
      );

      expect(state.isAuthenticated).toBe(true);
    });

    it('should not clear existing error', () => {
      const stateWithError = {
        ...initialState,
        isAuthenticated: true,
        token: 'old-token',
        error: 'Some non-auth error',
      };

      const state = authReducer(stateWithError, {
        type: AUTH_ACTIONS.TOKEN_REFRESHED,
        payload: { token: 'new-token' },
      });

      expect(state.error).toBe('Some non-auth error');
      expect(state.token).toBe('new-token');
    });
  });

  // ============================================
  // Default / Unknown Action
  // ============================================
  describe('Default', () => {
    it('should return current state for unknown actions', () => {
      const state = authReducer(initialState, { type: 'UNKNOWN_ACTION' });
      expect(state).toBe(initialState);
    });
  });

  // ============================================
  // ACTION TYPES Export
  // ============================================
  describe('AUTH_ACTIONS', () => {
    it('should export TOKEN_REFRESHED action type', () => {
      expect(AUTH_ACTIONS.TOKEN_REFRESHED).toBe('TOKEN_REFRESHED');
    });

    it('should export all required action types', () => {
      const requiredActions = [
        'SET_LOADING',
        'SET_ERROR',
        'CLEAR_ERROR',
        'LOGIN_SUCCESS',
        'REGISTER_SUCCESS',
        'LOGOUT',
        'VERIFY_SUCCESS',
        'AUTO_LOGIN_SUCCESS',
        'AUTO_LOGIN_FAIL',
        'UPDATE_USER',
        'TOKEN_REFRESHED',
      ];

      requiredActions.forEach(action => {
        expect(AUTH_ACTIONS).toHaveProperty(action);
      });
    });
  });
});
