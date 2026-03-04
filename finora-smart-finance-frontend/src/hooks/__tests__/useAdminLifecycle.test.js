/**
 * @fileoverview useAdminLifecycle Hook Tests
 * @description Tests für den useAdminLifecycle Custom Hook –
 *              Laden, User-Detail, Reset, Trigger, Unmount-Safety.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdminLifecycle } from '../useAdminLifecycle';

// ── Mock adminService ──────────────────────────
vi.mock('@/api/adminService', () => ({
  adminService: {
    getLifecycleStats: vi.fn(),
    getUserLifecycleDetail: vi.fn(),
    resetUserRetention: vi.fn(),
    triggerRetentionProcessing: vi.fn(),
  },
}));

import { adminService } from '@/api/adminService';

// ── Test-Daten ─────────────────────────────────
const mockStatsResponse = {
  data: {
    data: {
      usersWithOldTransactions: 5,
      usersInReminding: 3,
      usersInFinalWarning: 1,
      usersExported: 2,
      deletionsThisMonth: 0,
      usersApproachingLimit: 4,
      usersAtLimit: 1,
      usersInFinalWarningPhase: [
        { _id: 'u1', name: 'Alice', email: 'a@b.com', finalWarningSentAt: '2025-01-10' },
      ],
      usersApproachingQuota: [
        { _id: 'u2', name: 'Bob', email: 'b@b.com', monthlyTransactionCount: 130 },
      ],
    },
  },
};

const mockDetailResponse = {
  data: {
    data: {
      user: { _id: 'u1', name: 'Alice', email: 'a@b.com' },
      lifecycle: { retention: { phase: 'finalWarning' } },
      quota: { used: 42, limit: 150, remaining: 108 },
      transactionBreakdown: { total: 100, olderThan12Months: 15, within12Months: 85 },
    },
  },
};

describe('useAdminLifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getLifecycleStats.mockResolvedValue(mockStatsResponse);
    adminService.getUserLifecycleDetail.mockResolvedValue(mockDetailResponse);
    adminService.resetUserRetention.mockResolvedValue({ data: { success: true } });
    adminService.triggerRetentionProcessing.mockResolvedValue({
      data: { data: { processed: 5, deleted: 1 } },
    });
  });

  // ── Initialization ──────────────────────────────

  describe('Initialization', () => {
    it('startet mit loading=true und leeren Daten', () => {
      const { result } = renderHook(() => useAdminLifecycle());
      expect(result.current.loading).toBe(true);
      expect(result.current.stats).toBeNull();
      expect(result.current.userDetail).toBeNull();
      expect(result.current.actionLoading).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  // ── Successful Loading ──────────────────────────

  describe('Erfolgreicher Datenabruf', () => {
    it('ruft getLifecycleStats auf', async () => {
      renderHook(() => useAdminLifecycle());

      await waitFor(() => {
        expect(adminService.getLifecycleStats).toHaveBeenCalledTimes(1);
      });
    });

    it('setzt stats nach Laden', async () => {
      const { result } = renderHook(() => useAdminLifecycle());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats.usersWithOldTransactions).toBe(5);
      expect(result.current.stats.usersInReminding).toBe(3);
      expect(result.current.stats.usersInFinalWarningPhase).toHaveLength(1);
      expect(result.current.error).toBeNull();
    });
  });

  // ── Error Handling ──────────────────────────────

  describe('Fehlerbehandlung', () => {
    it('setzt error bei API-Fehler', async () => {
      adminService.getLifecycleStats.mockRejectedValue(
        new Error('Server Error'),
      );

      const { result } = renderHook(() => useAdminLifecycle());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Server Error');
      expect(result.current.stats).toBeNull();
    });
  });

  // ── User Detail ─────────────────────────────────

  describe('User Detail', () => {
    it('lädt User-Detail', async () => {
      const { result } = renderHook(() => useAdminLifecycle());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.actions.fetchUserDetail('u1');
      });

      expect(adminService.getUserLifecycleDetail).toHaveBeenCalledWith('u1');
      expect(result.current.userDetail.user.name).toBe('Alice');
      expect(result.current.userDetail.lifecycle.retention.phase).toBe('finalWarning');
    });

    it('schließt Detail-Panel', async () => {
      const { result } = renderHook(() => useAdminLifecycle());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.actions.fetchUserDetail('u1');
      });

      expect(result.current.userDetail).not.toBeNull();

      act(() => {
        result.current.actions.closeDetail();
      });

      expect(result.current.userDetail).toBeNull();
    });
  });

  // ── Reset Retention ─────────────────────────────

  describe('Reset Retention', () => {
    it('setzt Retention zurück und refreshed Stats', async () => {
      const { result } = renderHook(() => useAdminLifecycle());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.actions.resetRetention('u1');
      });

      expect(adminService.resetUserRetention).toHaveBeenCalledWith('u1');
      // Stats werden refreshed
      expect(adminService.getLifecycleStats).toHaveBeenCalledTimes(2);
    });
  });

  // ── Trigger Processing ──────────────────────────

  describe('Trigger Processing', () => {
    it('löst Verarbeitung aus und refreshed Stats', async () => {
      const { result } = renderHook(() => useAdminLifecycle());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.actions.triggerProcessing();
      });

      expect(adminService.triggerRetentionProcessing).toHaveBeenCalledTimes(1);
      // Stats werden refreshed
      expect(adminService.getLifecycleStats).toHaveBeenCalledTimes(2);
    });
  });

  // ── Refresh ─────────────────────────────────────

  describe('Refresh', () => {
    it('re-fetched Stats bei refresh()', async () => {
      const { result } = renderHook(() => useAdminLifecycle());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        result.current.actions.refresh();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(adminService.getLifecycleStats).toHaveBeenCalledTimes(2);
    });
  });

  // ── Unmount Safety ──────────────────────────────

  describe('Unmount-Safety', () => {
    it('setzt keinen State nach Unmount', async () => {
      let resolveStats;
      adminService.getLifecycleStats.mockReturnValue(
        new Promise((resolve) => {
          resolveStats = resolve;
        }),
      );

      const { unmount } = renderHook(() => useAdminLifecycle());

      unmount();

      await act(async () => {
        resolveStats(mockStatsResponse);
      });

      // Kein Fehler, da mountedRef.current === false
    });
  });
});
