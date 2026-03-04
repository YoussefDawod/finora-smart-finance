/**
 * @fileoverview Token Refresh Module Tests
 * @description Tests für automatisches Token-Refresh mit Mutex-Queue
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Mock axios.post direkt (nicht den client, da tokenRefresh.js axios direkt nutzt)
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    })),
    post: vi.fn(),
  },
}));

// Mock config
vi.mock('./config', () => ({
  API_CONFIG: {
    BASE_URL: 'http://localhost:5000',
    TIMEOUT: 10000,
    TOKEN_STORAGE_KEY: 'auth_token',
  },
}));

// Mock endpoints
vi.mock('./endpoints', () => ({
  ENDPOINTS: {
    auth: {
      login: '/api/v1/auth/login',
      register: '/api/v1/auth/register',
      refresh: '/api/v1/auth/refresh',
      logout: '/api/v1/auth/logout',
      forgotPassword: '/api/v1/auth/forgot-password',
      resetPassword: '/api/v1/auth/reset-password',
      verify: '/api/v1/auth/verify-email',
    },
  },
}));

import {
  refreshAccessToken,
  isExcludedFromRefresh,
  getStoredRefreshToken,
  __resetForTesting,
  __getStateForTesting,
} from './tokenRefresh';

describe('Token Refresh Module', () => {
  let dispatchedEvents;

  beforeEach(() => {
    __resetForTesting();
    vi.clearAllMocks();
    dispatchedEvents = [];

    // Mock localStorage + sessionStorage
    window.localStorage.getItem.mockImplementation((key) => {
      if (key === 'refresh_token') return 'stored-refresh-token';
      if (key === 'auth_remember_me') return 'true';
      return null;
    });
    window.localStorage.setItem.mockImplementation(() => {});
    window.localStorage.removeItem.mockImplementation(() => {});

    window.sessionStorage.getItem.mockImplementation(() => null);
    window.sessionStorage.removeItem.mockImplementation(() => {});

    // Track dispatched events
    const originalDispatchEvent = window.dispatchEvent;
    window.dispatchEvent = vi.fn((event) => {
      dispatchedEvents.push({ type: event.type, detail: event.detail });
      return originalDispatchEvent.call(window, event);
    });
  });

  afterEach(() => {
    __resetForTesting();
  });

  // ============================================
  // isExcludedFromRefresh
  // ============================================
  describe('isExcludedFromRefresh', () => {
    it('should exclude login endpoint', () => {
      expect(isExcludedFromRefresh({ url: '/api/v1/auth/login' })).toBe(true);
    });

    it('should exclude register endpoint', () => {
      expect(isExcludedFromRefresh({ url: '/api/v1/auth/register' })).toBe(true);
    });

    it('should exclude refresh endpoint itself', () => {
      expect(isExcludedFromRefresh({ url: '/api/v1/auth/refresh' })).toBe(true);
    });

    it('should exclude logout endpoint', () => {
      expect(isExcludedFromRefresh({ url: '/api/v1/auth/logout' })).toBe(true);
    });

    it('should exclude forgot-password endpoint', () => {
      expect(isExcludedFromRefresh({ url: '/api/v1/auth/forgot-password' })).toBe(true);
    });

    it('should exclude reset-password endpoint', () => {
      expect(isExcludedFromRefresh({ url: '/api/v1/auth/reset-password' })).toBe(true);
    });

    it('should NOT exclude transaction endpoints', () => {
      expect(isExcludedFromRefresh({ url: '/api/v1/transactions' })).toBe(false);
    });

    it('should NOT exclude user endpoints', () => {
      expect(isExcludedFromRefresh({ url: '/api/v1/users/me' })).toBe(false);
    });

    it('should handle null/undefined config', () => {
      expect(isExcludedFromRefresh(null)).toBe(false);
      expect(isExcludedFromRefresh(undefined)).toBe(false);
      expect(isExcludedFromRefresh({})).toBe(false);
    });
  });

  // ============================================
  // getStoredRefreshToken
  // ============================================
  describe('getStoredRefreshToken', () => {
    it('should return refresh token from localStorage', () => {
      expect(getStoredRefreshToken()).toBe('stored-refresh-token');
    });

    it('should fall back to sessionStorage', () => {
      window.localStorage.getItem.mockImplementation(() => null);
      window.sessionStorage.getItem.mockImplementation((key) => {
        if (key === 'refresh_token') return 'session-refresh-token';
        return null;
      });

      expect(getStoredRefreshToken()).toBe('session-refresh-token');
    });

    it('should return null when no token exists', () => {
      window.localStorage.getItem.mockImplementation(() => null);
      window.sessionStorage.getItem.mockImplementation(() => null);

      expect(getStoredRefreshToken()).toBeNull();
    });
  });

  // ============================================
  // refreshAccessToken - Success
  // ============================================
  describe('refreshAccessToken - Success', () => {
    it('should refresh token and return new access token', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
            expiresIn: 3600,
            user: { id: 'user-123' },
          },
        },
      });

      const newToken = await refreshAccessToken();

      expect(newToken).toBe('new-access-token');
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/v1/auth/refresh',
        {}, // Leerer Body — Refresh-Token kommt als httpOnly Cookie
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
          withCredentials: true,
        })
      );
    });

    it('should save new access token to storage (refresh token NOT saved — httpOnly cookie)', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
        },
      });

      await refreshAccessToken();

      expect(window.localStorage.setItem).toHaveBeenCalledWith('auth_token', 'new-access-token');
      // Refresh-Token wird NICHT mehr im Storage gespeichert — nur als httpOnly Cookie
      expect(window.localStorage.setItem).not.toHaveBeenCalledWith('refresh_token', expect.anything());
    });

    it('should dispatch auth:token-refreshed event', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
        },
      });

      await refreshAccessToken();

      const refreshEvent = dispatchedEvents.find((e) => e.type === 'auth:token-refreshed');
      expect(refreshEvent).toBeDefined();
      expect(refreshEvent.detail.accessToken).toBe('new-access-token');
      expect(refreshEvent.detail.refreshToken).toBe('new-refresh-token');
    });

    it('should reset isRefreshing state after success', async () => {
      axios.post.mockResolvedValueOnce({
        data: { data: { accessToken: 'new-token', refreshToken: 'new-refresh' } },
      });

      await refreshAccessToken();

      const state = __getStateForTesting();
      expect(state.isRefreshing).toBe(false);
      expect(state.queueLength).toBe(0);
    });
  });

  // ============================================
  // refreshAccessToken - Failure
  // ============================================
  describe('refreshAccessToken - Failure', () => {
    it('should attempt refresh even without stored token (relies on httpOnly cookie)', async () => {
      window.localStorage.getItem.mockImplementation(() => null);
      window.sessionStorage.getItem.mockImplementation(() => null);

      // Refresh-Token kommt jetzt als httpOnly Cookie, nicht aus dem Storage.
      // Wenn der Cookie fehlt, gibt das Backend einen Fehler zurück.
      axios.post.mockRejectedValueOnce(new Error('Refresh failed'));

      await expect(refreshAccessToken()).rejects.toThrow('Refresh failed');
      // Request wurde trotzdem abgesetzt (Cookie wird automatisch mitgesendet)
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    it('should clear tokens and dispatch auth:unauthorized on failure', async () => {
      axios.post.mockRejectedValueOnce(new Error('Refresh failed'));

      await expect(refreshAccessToken()).rejects.toThrow('Refresh failed');

      // Should have cleared tokens
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('refresh_token');

      // Should have dispatched unauthorized event
      const unauthorizedEvent = dispatchedEvents.find((e) => e.type === 'auth:unauthorized');
      expect(unauthorizedEvent).toBeDefined();
    });

    it('should reject when API returns no access token', async () => {
      axios.post.mockResolvedValueOnce({
        data: { data: {} },
      });

      await expect(refreshAccessToken()).rejects.toThrow('No access token in refresh response');
    });

    it('should reset isRefreshing state after failure', async () => {
      axios.post.mockRejectedValueOnce(new Error('Failed'));

      try {
        await refreshAccessToken();
      } catch {
        // expected
      }

      const state = __getStateForTesting();
      expect(state.isRefreshing).toBe(false);
    });
  });

  // ============================================
  // Mutex / Queue (Race Condition Protection)
  // ============================================
  describe('Mutex / Queue', () => {
    it('should only make one refresh request for concurrent 401s', async () => {
      // Simulate a slow refresh
      let resolveRefresh;
      axios.post.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveRefresh = resolve;
          })
      );

      // Start 3 concurrent refresh attempts
      const p1 = refreshAccessToken();
      const p2 = refreshAccessToken();
      const p3 = refreshAccessToken();

      // Only one refresh call should be made
      expect(axios.post).toHaveBeenCalledTimes(1);

      // Queue should have 2 entries (p2 and p3)
      const state = __getStateForTesting();
      expect(state.isRefreshing).toBe(true);
      expect(state.queueLength).toBe(2);

      // Resolve the refresh
      resolveRefresh({
        data: { data: { accessToken: 'new-token', refreshToken: 'new-refresh' } },
      });

      // All 3 should resolve with the same token
      const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
      expect(r1).toBe('new-token');
      expect(r2).toBe('new-token');
      expect(r3).toBe('new-token');

      // Still only one API call
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    it('should reject all queued requests on refresh failure', async () => {
      let rejectRefresh;
      axios.post.mockImplementation(
        () =>
          new Promise((_, reject) => {
            rejectRefresh = reject;
          })
      );

      const p1 = refreshAccessToken();
      const p2 = refreshAccessToken();
      const p3 = refreshAccessToken();

      // Reject the refresh
      rejectRefresh(new Error('Token invalid'));

      // All 3 should reject
      await expect(p1).rejects.toThrow('Token invalid');
      await expect(p2).rejects.toThrow('Token invalid');
      await expect(p3).rejects.toThrow('Token invalid');
    });

    it('should allow a new refresh after previous one completes', async () => {
      // First refresh
      axios.post.mockResolvedValueOnce({
        data: { data: { accessToken: 'token-1', refreshToken: 'refresh-1' } },
      });
      await refreshAccessToken();

      // Second refresh (should work independently)
      axios.post.mockResolvedValueOnce({
        data: { data: { accessToken: 'token-2', refreshToken: 'refresh-2' } },
      });
      const result = await refreshAccessToken();

      expect(result).toBe('token-2');
      expect(axios.post).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================
  // Testing Helpers
  // ============================================
  describe('Testing Helpers', () => {
    it('__resetForTesting should reset internal state', () => {
      // Just verify it doesn't throw
      __resetForTesting();
      const state = __getStateForTesting();
      expect(state.isRefreshing).toBe(false);
      expect(state.queueLength).toBe(0);
    });

    it('__getStateForTesting should return current state', () => {
      const state = __getStateForTesting();
      expect(state).toHaveProperty('isRefreshing');
      expect(state).toHaveProperty('queueLength');
    });
  });
});
