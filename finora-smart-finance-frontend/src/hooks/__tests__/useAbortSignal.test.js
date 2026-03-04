/**
 * @fileoverview Tests für useAbortSignal Hook
 * @description Testet AbortController-Erstellung, Auto-Abort beim Unmount,
 *              Signal-Cancellation und isAborted()-Helper.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAbortSignal, isAborted } from '../useAbortSignal';

describe('useAbortSignal', () => {
  // ── createSignal ─────────────────────────────────

  it('erstellt ein AbortSignal', () => {
    const { result } = renderHook(() => useAbortSignal());
    let signal;

    act(() => {
      signal = result.current.createSignal();
    });

    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal.aborted).toBe(false);
  });

  it('bricht vorherige Signale ab bei neuem createSignal()', () => {
    const { result } = renderHook(() => useAbortSignal());
    let signal1, signal2;

    act(() => {
      signal1 = result.current.createSignal();
    });

    act(() => {
      signal2 = result.current.createSignal();
    });

    expect(signal1.aborted).toBe(true);
    expect(signal2.aborted).toBe(false);
  });

  it('bricht alle Signale beim Unmount ab', () => {
    const { result, unmount } = renderHook(() => useAbortSignal());
    let signal;

    act(() => {
      signal = result.current.createSignal();
    });

    expect(signal.aborted).toBe(false);
    unmount();
    expect(signal.aborted).toBe(true);
  });

  // ── abort() ──────────────────────────────────────

  it('abort() bricht aktives Signal sofort ab', () => {
    const { result } = renderHook(() => useAbortSignal());
    let signal;

    act(() => {
      signal = result.current.createSignal();
    });

    act(() => {
      result.current.abort();
    });

    expect(signal.aborted).toBe(true);
  });

  it('abort() ohne aktives Signal ist ein No-Op', () => {
    const { result } = renderHook(() => useAbortSignal());

    expect(() => {
      act(() => result.current.abort());
    }).not.toThrow();
  });

  // ── Mehrere Signale ──────────────────────────────

  it('nur das neueste Signal ist aktiv (Single-Flight)', () => {
    const { result } = renderHook(() => useAbortSignal());
    const signals = [];

    act(() => {
      for (let i = 0; i < 5; i++) {
        signals.push(result.current.createSignal());
      }
    });

    // Alle bis auf das letzte sollten aborted sein
    signals.slice(0, -1).forEach((s) => {
      expect(s.aborted).toBe(true);
    });
    expect(signals[4].aborted).toBe(false);
  });

  // ── Callback-Stabilität ──────────────────────────

  it('createSignal und abort sind über Re-Renders stabil', () => {
    const { result, rerender } = renderHook(() => useAbortSignal());
    const firstCreateSignal = result.current.createSignal;
    const firstAbort = result.current.abort;

    rerender();

    expect(result.current.createSignal).toBe(firstCreateSignal);
    expect(result.current.abort).toBe(firstAbort);
  });
});

describe('isAborted', () => {
  it('erkennt AbortError', () => {
    const error = new DOMException('Aborted', 'AbortError');
    expect(isAborted(error)).toBe(true);
  });

  it('erkennt CanceledError (Axios)', () => {
    const error = new Error('Request canceled');
    error.name = 'CanceledError';
    expect(isAborted(error)).toBe(true);
  });

  it('erkennt ERR_CANCELED Code (Axios)', () => {
    const error = new Error('canceled');
    error.code = 'ERR_CANCELED';
    expect(isAborted(error)).toBe(true);
  });

  it('erkennt __CANCEL__ Flag (Axios CancelToken)', () => {
    const error = { __CANCEL__: true, message: 'canceled' };
    expect(isAborted(error)).toBe(true);
  });

  it('gibt false für normale Fehler', () => {
    expect(isAborted(new Error('Network error'))).toBe(false);
    expect(isAborted(new TypeError('fetch failed'))).toBe(false);
  });

  it('gibt false für null/undefined', () => {
    expect(isAborted(null)).toBe(false);
    expect(isAborted(undefined)).toBe(false);
    expect(isAborted(0)).toBe(false);
  });
});
