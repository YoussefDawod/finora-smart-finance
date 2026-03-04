/**
 * @fileoverview useAdminDashboard Hook Tests
 * @description Tests für den useAdminDashboard Custom Hook –
 *              paralleles Laden, Error-Handling, Refresh, Unmount-Safety.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdminDashboard } from '../useAdminDashboard';

// ── Mock adminService ──────────────────────────
vi.mock('@/api/adminService', () => ({
  adminService: {
    getStats: vi.fn(),
    getTransactionStats: vi.fn(),
    getSubscriberStats: vi.fn(),
  },
}));

import { adminService } from '@/api/adminService';

// ── Test-Daten ─────────────────────────────────
const mockStatsResponse = {
  data: {
    data: {
      overview: {
        totalUsers: 120,
        verifiedUsers: 100,
        activeUsers: 90,
        bannedUsers: 3,
        adminUsers: 2,
        usersLast7Days: 8,
        usersLast30Days: 25,
        totalTransactions: 450,
      },
      recentUsers: [
        { _id: 'u1', name: 'Alice', email: 'a@b.com', isVerified: true, role: 'user', createdAt: '2024-01-15T10:00:00Z' },
        { _id: 'u2', name: 'Bob', email: 'b@b.com', isVerified: false, role: 'admin', createdAt: '2024-01-14T10:00:00Z' },
      ],
      userLanguageBreakdown: [
        { _id: 'de', count: 80 },
        { _id: 'en', count: 30 },
        { _id: 'ar', count: 10 },
      ],
    },
  },
};

const mockTxStatsResponse = {
  data: {
    data: {
      totalCount: 450,
      last7DaysCount: 32,
      last30DaysCount: 120,
      totalIncome: 15000,
      totalExpense: 9500,
      netBalance: 5500,
      typeBreakdown: [
        { _id: 'income', count: 200, totalAmount: 15000 },
        { _id: 'expense', count: 250, totalAmount: 9500 },
      ],
      topCategories: [
        { _id: 'Salary', count: 50, totalAmount: 10000 },
        { _id: 'Food', count: 80, totalAmount: 3000 },
      ],
    },
  },
};

const mockSubStatsResponse = {
  data: {
    data: {
      totalCount: 55,
      confirmedCount: 40,
      unconfirmedCount: 15,
      languageBreakdown: [
        { _id: 'de', count: 20 },
        { _id: 'en', count: 15 },
        { _id: 'ar', count: 5 },
      ],
      recentSubscribers: [],
    },
  },
};

describe('useAdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getStats.mockResolvedValue(mockStatsResponse);
    adminService.getTransactionStats.mockResolvedValue(mockTxStatsResponse);
    adminService.getSubscriberStats.mockResolvedValue(mockSubStatsResponse);
  });

  // ── Initialization ──────────────────────────────

  describe('Initialization', () => {
    it('startet mit loading=true und leeren Daten', () => {
      const { result } = renderHook(() => useAdminDashboard());
      expect(result.current.loading).toBe(true);
      expect(result.current.stats).toBeNull();
      expect(result.current.transactionStats).toBeNull();
      expect(result.current.subscriberStats).toBeNull();
      expect(result.current.error).toBeNull();
      expect(typeof result.current.refresh).toBe('function');
    });
  });

  // ── Successful Loading ──────────────────────────

  describe('Erfolgreicher Datenabruf', () => {
    it('ruft alle 3 APIs parallel auf', async () => {
      renderHook(() => useAdminDashboard());

      await waitFor(() => {
        expect(adminService.getStats).toHaveBeenCalledTimes(1);
        expect(adminService.getTransactionStats).toHaveBeenCalledTimes(1);
        expect(adminService.getSubscriberStats).toHaveBeenCalledTimes(1);
      });
    });

    it('setzt stats, transactionStats und subscriberStats nach Laden', async () => {
      const { result } = renderHook(() => useAdminDashboard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats.overview.totalUsers).toBe(120);
      expect(result.current.stats.recentUsers).toHaveLength(2);
      expect(result.current.transactionStats.totalCount).toBe(450);
      expect(result.current.transactionStats.totalIncome).toBe(15000);
      expect(result.current.subscriberStats.totalCount).toBe(55);
      expect(result.current.subscriberStats.confirmedCount).toBe(40);
      expect(result.current.error).toBeNull();
    });

    it('verarbeitet Antworten ohne verschachteltes data-Feld', async () => {
      adminService.getStats.mockResolvedValue({
        data: { overview: { totalUsers: 5 }, recentUsers: [] },
      });

      const { result } = renderHook(() => useAdminDashboard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats.overview.totalUsers).toBe(5);
    });
  });

  // ── Error Handling ──────────────────────────────

  describe('Fehlerbehandlung', () => {
    it('setzt error bei API-Fehler mit response.data.message', async () => {
      adminService.getStats.mockRejectedValue({
        response: { data: { message: 'Unauthorized' } },
      });

      const { result } = renderHook(() => useAdminDashboard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Unauthorized');
      expect(result.current.stats).toBeNull();
    });

    it('setzt error bei API-Fehler mit err.message', async () => {
      adminService.getTransactionStats.mockRejectedValue(new Error('Network Error'));

      const { result } = renderHook(() => useAdminDashboard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network Error');
    });

    it('setzt Fallback-Fehlermeldung bei unbekanntem Fehler', async () => {
      adminService.getSubscriberStats.mockRejectedValue({});

      const { result } = renderHook(() => useAdminDashboard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load dashboard data');
    });
  });

  // ── Refresh ─────────────────────────────────────

  describe('Refresh', () => {
    it('re-fetched alle Daten bei refresh()', async () => {
      const { result } = renderHook(() => useAdminDashboard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(adminService.getStats).toHaveBeenCalledTimes(1);

      await act(async () => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(adminService.getStats).toHaveBeenCalledTimes(2);
      expect(adminService.getTransactionStats).toHaveBeenCalledTimes(2);
      expect(adminService.getSubscriberStats).toHaveBeenCalledTimes(2);
    });

    it('setzt loading=true während refresh', async () => {
      const { result } = renderHook(() => useAdminDashboard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verzögerung simulieren
      let resolveStats;
      adminService.getStats.mockReturnValue(
        new Promise((resolve) => {
          resolveStats = resolve;
        }),
      );

      act(() => {
        result.current.refresh();
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolveStats(mockStatsResponse);
      });
    });

    it('setzt error=null vor einem erneuten Laden', async () => {
      adminService.getStats.mockRejectedValueOnce(new Error('fail'));

      const { result } = renderHook(() => useAdminDashboard());

      await waitFor(() => {
        expect(result.current.error).toBe('fail');
      });

      adminService.getStats.mockResolvedValue(mockStatsResponse);

      await act(async () => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.stats).toBeTruthy();
    });
  });

  // ── Unmount Safety ──────────────────────────────

  describe('Unmount-Safety', () => {
    it('setzt keinen State nach Unmount', async () => {
      let resolveStats;
      adminService.getStats.mockReturnValue(
        new Promise((resolve) => {
          resolveStats = resolve;
        }),
      );

      const { result, unmount } = renderHook(() => useAdminDashboard());

      expect(result.current.loading).toBe(true);

      unmount();

      // Resolve nach Unmount — sollte keinen Fehler werfen
      await act(async () => {
        resolveStats(mockStatsResponse);
      });

      // Kein State-Update nach Unmount → kein Fehler
    });

    it('setzt keinen Error-State nach Unmount', async () => {
      let rejectStats;
      adminService.getStats.mockReturnValue(
        new Promise((_, reject) => {
          rejectStats = reject;
        }),
      );

      const { unmount } = renderHook(() => useAdminDashboard());

      unmount();

      await act(async () => {
        rejectStats(new Error('after unmount'));
      });

      // Kein Fehler, da mountedRef.current === false
    });
  });
});
