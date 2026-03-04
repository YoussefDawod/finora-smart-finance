/**
 * @fileoverview Tests für useOnlineStatus Hook
 * @description Testet Online/Offline-Erkennung und Event-Handling.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '../useOnlineStatus';

describe('useOnlineStatus', () => {
  const originalOnLine = navigator.onLine;
  let listeners = {};

  // Speichere originale addEventListener/removeEventListener
  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;

  afterEach(() => {
    // Restore
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      writable: true,
      configurable: true,
    });
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
    listeners = {};
  });

  function mockNavigatorOnLine(value) {
    Object.defineProperty(navigator, 'onLine', {
      value,
      writable: true,
      configurable: true,
    });
  }

  function setupEventListeners() {
    listeners = {};
    window.addEventListener = vi.fn((event, handler) => {
      listeners[event] = handler;
    });
    window.removeEventListener = vi.fn();
  }

  it('gibt true zurück wenn online', () => {
    mockNavigatorOnLine(true);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it('gibt false zurück wenn offline', () => {
    mockNavigatorOnLine(false);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it('registriert online/offline Event-Listener', () => {
    setupEventListeners();
    renderHook(() => useOnlineStatus());

    expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('wechselt zu offline wenn offline-Event feuert', () => {
    mockNavigatorOnLine(true);
    setupEventListeners();
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(true);

    act(() => {
      listeners.offline();
    });

    expect(result.current).toBe(false);
  });

  it('wechselt zu online wenn online-Event feuert', () => {
    mockNavigatorOnLine(false);
    setupEventListeners();
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(false);

    act(() => {
      listeners.online();
    });

    expect(result.current).toBe(true);
  });

  it('entfernt Event-Listener beim Unmount', () => {
    setupEventListeners();
    const { unmount } = renderHook(() => useOnlineStatus());
    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});
