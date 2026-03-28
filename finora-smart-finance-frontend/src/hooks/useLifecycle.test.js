/**
 * @fileoverview useLifecycle Hook Tests
 * @description Unit-Tests für Lifecycle-Status, Quota und Export-Bestätigung
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLifecycle } from '@/hooks/useLifecycle';

// ============================================================================
// MOCKS
// ============================================================================

const mockSuccess = vi.fn();
const mockError = vi.fn();

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: mockSuccess,
    error: mockError,
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, params) => {
      if (params) return `${key}:${JSON.stringify(params)}`;
      return key;
    },
    i18n: { language: 'de' },
  }),
}));

const mockGetLifecycleStatus = vi.fn();
const mockConfirmExport = vi.fn();
const mockGetQuota = vi.fn();

vi.mock('@/api', () => ({
  userService: {
    getLifecycleStatus: (...args) => mockGetLifecycleStatus(...args),
    confirmExport: (...args) => mockConfirmExport(...args),
    getQuota: (...args) => mockGetQuota(...args),
  },
}));

// ============================================================================
// TESTS
// ============================================================================

describe('useLifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────
  // fetchLifecycleStatus
  // ──────────────────────────────────────────────────────────
  describe('fetchLifecycleStatus', () => {
    it('should fetch and store lifecycle status', async () => {
      const mockData = {
        phase: 'reminding',
        oldTransactionCount: 25,
        oldestDate: '2024-01-15',
        hasExported: false,
      };
      mockGetLifecycleStatus.mockResolvedValue({ data: { data: mockData } });

      const { result } = renderHook(() => useLifecycle());

      expect(result.current.lifecycleStatus).toBeNull();
      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        const status = await result.current.fetchLifecycleStatus();
        expect(status).toEqual(mockData);
      });

      expect(result.current.lifecycleStatus).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch error', async () => {
      mockGetLifecycleStatus.mockRejectedValue({
        response: { data: { message: 'Server error' } },
      });

      const { result } = renderHook(() => useLifecycle());

      await act(async () => {
        const status = await result.current.fetchLifecycleStatus();
        expect(status).toBeNull();
      });

      expect(result.current.error).toBe('Server error');
      expect(result.current.lifecycleStatus).toBeNull();
    });

    it('should set isLoading during fetch', async () => {
      let resolve;
      mockGetLifecycleStatus.mockReturnValue(
        new Promise(r => {
          resolve = r;
        })
      );

      const { result } = renderHook(() => useLifecycle());

      let fetchPromise;
      act(() => {
        fetchPromise = result.current.fetchLifecycleStatus();
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolve({ data: { data: { phase: 'active' } } });
        await fetchPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────
  // fetchQuota
  // ──────────────────────────────────────────────────────────
  describe('fetchQuota', () => {
    it('should fetch and store quota', async () => {
      const mockData = { used: 42, limit: 150, remaining: 108 };
      mockGetQuota.mockResolvedValue({ data: { data: mockData } });

      const { result } = renderHook(() => useLifecycle());

      await act(async () => {
        const quota = await result.current.fetchQuota();
        expect(quota).toEqual(mockData);
      });

      expect(result.current.quota).toEqual(mockData);
    });

    it('should handle quota error silently', async () => {
      mockGetQuota.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useLifecycle());

      await act(async () => {
        const quota = await result.current.fetchQuota();
        expect(quota).toBeNull();
      });

      expect(result.current.quota).toBeNull();
      // Error should NOT be set for quota (not critical)
      expect(result.current.error).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────
  // confirmExport
  // ──────────────────────────────────────────────────────────
  describe('confirmExport', () => {
    it('should confirm export and show success toast', async () => {
      mockConfirmExport.mockResolvedValue({ data: { success: true } });
      mockGetLifecycleStatus.mockResolvedValue({
        data: { data: { phase: 'active', hasExported: true } },
      });

      const { result } = renderHook(() => useLifecycle());

      await act(async () => {
        const success = await result.current.confirmExport();
        expect(success).toBe(true);
      });

      expect(mockConfirmExport).toHaveBeenCalledTimes(1);
      expect(mockSuccess).toHaveBeenCalledWith('lifecycle.retention.exportConfirmedSuccess');
      // Should re-fetch lifecycle status
      expect(mockGetLifecycleStatus).toHaveBeenCalledTimes(1);
    });

    it('should handle confirm error and show error toast', async () => {
      mockConfirmExport.mockRejectedValue({
        response: { data: { message: 'Already confirmed' } },
      });

      const { result } = renderHook(() => useLifecycle());

      await act(async () => {
        const success = await result.current.confirmExport();
        expect(success).toBe(false);
      });

      expect(mockError).toHaveBeenCalledWith('Already confirmed');
    });
  });
});
