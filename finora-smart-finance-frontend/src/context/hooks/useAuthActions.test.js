/**
 * @fileoverview useAuthActions Login Notification Tests
 * @description Testet die Lifecycle-Toast-Notification nach dem Login
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthActions } from '@/context/hooks/useAuthActions';

// ============================================================================
// MOCKS
// ============================================================================

vi.mock('@/i18n', () => ({
  default: {
    t: (key, params) => {
      if (params) return `${key}:${JSON.stringify(params)}`;
      return key;
    },
  },
}));

const mockLogin = vi.fn();

vi.mock('@/api/authService', () => ({
  default: {
    login: (...args) => mockLogin(...args),
  },
}));

// ============================================================================
// HELPERS
// ============================================================================

const createMockDispatch = () => vi.fn();

const createMockStorage = () => ({
  saveToken: vi.fn(),
  saveRefreshToken: vi.fn(),
  getRefreshToken: vi.fn(),
  clearAllTokens: vi.fn(),
  setRememberMe: vi.fn(),
});

const createLoginResponse = (notification = undefined) => ({
  data: {
    data: {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      user: { id: '123', name: 'TestUser', email: 'test@test.de' },
    },
    ...(notification !== undefined && { notification }),
  },
});

// ============================================================================
// TESTS
// ============================================================================

describe('useAuthActions - Login Notification', () => {
  let dispatch;
  let storage;
  let dispatchEventSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    dispatch = createMockDispatch();
    storage = createMockStorage();
    dispatchEventSpy = vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true);
  });

  afterEach(() => {
    dispatchEventSpy.mockRestore();
  });

  // ──────────────────────────────────────────────────────────
  // Ohne Notification
  // ──────────────────────────────────────────────────────────
  it('should NOT dispatch toast event when no notification is present', async () => {
    mockLogin.mockResolvedValue(createLoginResponse());

    const { result } = renderHook(() => useAuthActions(dispatch, storage));

    await act(async () => {
      await result.current.login('user', 'pass');
    });

    // Kein toast:add Event
    const toastEvents = dispatchEventSpy.mock.calls.filter(
      ([event]) => event instanceof CustomEvent && event.type === 'toast:add'
    );
    expect(toastEvents).toHaveLength(0);
  });

  // ──────────────────────────────────────────────────────────
  // Retention Reminder (info)
  // ──────────────────────────────────────────────────────────
  it('should dispatch info toast for retention_reminder notification', async () => {
    const notification = {
      type: 'retention_reminder',
      severity: 'info',
      transactionCount: 25,
      action: 'export_recommended',
    };
    mockLogin.mockResolvedValue(createLoginResponse(notification));

    const { result } = renderHook(() => useAuthActions(dispatch, storage));

    await act(async () => {
      await result.current.login('user', 'pass');
    });

    const toastEvents = dispatchEventSpy.mock.calls.filter(
      ([event]) => event instanceof CustomEvent && event.type === 'toast:add'
    );
    expect(toastEvents).toHaveLength(1);

    const detail = toastEvents[0][0].detail;
    expect(detail.type).toBe('info');
    expect(detail.message).toBe('lifecycle.toast.retentionReminder:{"count":25}');
    expect(detail.duration).toBe(8000);
  });

  // ──────────────────────────────────────────────────────────
  // Final Warning (warning)
  // ──────────────────────────────────────────────────────────
  it('should dispatch warning toast for retention_final_warning notification', async () => {
    const notification = {
      type: 'retention_final_warning',
      severity: 'error',
      transactionCount: 42,
      action: 'export_urgent',
    };
    mockLogin.mockResolvedValue(createLoginResponse(notification));

    const { result } = renderHook(() => useAuthActions(dispatch, storage));

    await act(async () => {
      await result.current.login('user', 'pass');
    });

    const toastEvents = dispatchEventSpy.mock.calls.filter(
      ([event]) => event instanceof CustomEvent && event.type === 'toast:add'
    );
    expect(toastEvents).toHaveLength(1);

    const detail = toastEvents[0][0].detail;
    expect(detail.type).toBe('warning');
    expect(detail.message).toBe('lifecycle.toast.retentionFinalWarning:{"count":42}');
    expect(detail.duration).toBe(8000);
  });

  // ──────────────────────────────────────────────────────────
  // Severity-Mapping
  // ──────────────────────────────────────────────────────────
  it('should map error severity to warning toast type', async () => {
    const notification = {
      type: 'retention_reminder',
      severity: 'error',
      transactionCount: 10,
    };
    mockLogin.mockResolvedValue(createLoginResponse(notification));

    const { result } = renderHook(() => useAuthActions(dispatch, storage));

    await act(async () => {
      await result.current.login('user', 'pass');
    });

    const toastEvents = dispatchEventSpy.mock.calls.filter(
      ([event]) => event instanceof CustomEvent && event.type === 'toast:add'
    );
    expect(toastEvents[0][0].detail.type).toBe('warning');
  });

  it('should map non-error severity to info toast type', async () => {
    const notification = {
      type: 'retention_final_warning',
      severity: 'warning',
      transactionCount: 8,
    };
    mockLogin.mockResolvedValue(createLoginResponse(notification));

    const { result } = renderHook(() => useAuthActions(dispatch, storage));

    await act(async () => {
      await result.current.login('user', 'pass');
    });

    const toastEvents = dispatchEventSpy.mock.calls.filter(
      ([event]) => event instanceof CustomEvent && event.type === 'toast:add'
    );
    expect(toastEvents[0][0].detail.type).toBe('info');
  });

  // ──────────────────────────────────────────────────────────
  // Login funktioniert trotz Notification
  // ──────────────────────────────────────────────────────────
  it('should complete login flow even when notification is present', async () => {
    const notification = {
      type: 'retention_reminder',
      severity: 'info',
      transactionCount: 5,
    };
    mockLogin.mockResolvedValue(createLoginResponse(notification));

    const { result } = renderHook(() => useAuthActions(dispatch, storage));

    await act(async () => {
      await result.current.login('user', 'pass', true);
    });

    // Login-Daten korrekt verarbeitet
    expect(storage.saveToken).toHaveBeenCalledWith('test-access-token', true);
    // saveRefreshToken wird NICHT mehr aufgerufen — httpOnly Cookie
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'LOGIN_SUCCESS',
        payload: expect.objectContaining({
          user: expect.objectContaining({ id: '123' }),
          token: 'test-access-token',
        }),
      })
    );
  });
});
