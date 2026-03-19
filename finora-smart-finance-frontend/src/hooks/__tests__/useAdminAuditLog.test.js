/**
 * @fileoverview useAdminAuditLog Hook Tests
 * @description Tests für den useAdminAuditLog Custom Hook –
 *              Laden, Pagination, Filter (Aktion, Datum), Sortierung, Unmount-Safety.
 *              Hinweis: Dieser Hook ist read-only – keine Lösch-Aktionen.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdminAuditLog } from '../useAdminAuditLog';

// ── Mock adminService ──────────────────────────────
vi.mock('@/api/adminService', () => ({
  adminService: {
    getAuditLogs: vi.fn(),
    getAuditLogStats: vi.fn(),
  },
}));

// ── Mock useAuth ───────────────────────────────────
vi.mock('../useAuth', () => ({
  useAuth: () => ({ user: { name: 'Test Admin', email: 'admin@test.de' }, isAuthenticated: true }),
}));

import { adminService } from '@/api/adminService';

// ── Test-Daten ─────────────────────────────────────
const mockLog1 = {
  _id: 'log1',
  adminId: 'a1',
  adminName: 'Super Admin',
  action: 'USER_BANNED',
  targetUserId: 'u1',
  targetUserName: 'Alice Müller',
  details: { reason: 'Spam' },
  ipAddress: '192.168.1.1',
  createdAt: '2024-03-15T10:00:00Z',
};

const mockLog2 = {
  _id: 'log2',
  adminId: 'a1',
  adminName: 'Super Admin',
  action: 'USER_CREATED',
  targetUserId: 'u2',
  targetUserName: 'Bob Test',
  details: {},
  ipAddress: '10.0.0.1',
  createdAt: '2024-03-16T08:30:00Z',
};

const mockLogsResponse = {
  data: {
    data: {
      logs: [mockLog1, mockLog2],
      pagination: { total: 2, page: 1, pages: 1, limit: 20 },
    },
  },
};

const mockStatsResponse = {
  data: {
    data: {
      totalEntries: 42,
      mostCommonAction: 'USER_BANNED',
      activeAdmins: 3,
    },
  },
};

describe('useAdminAuditLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getAuditLogs.mockResolvedValue(mockLogsResponse);
    adminService.getAuditLogStats.mockResolvedValue(mockStatsResponse);
  });

  // ── Initialization ──────────────────────────────

  describe('Initialization', () => {
    it('startet mit loading=true und leeren Daten', () => {
      const { result } = renderHook(() => useAdminAuditLog());
      expect(result.current.loading).toBe(true);
      expect(result.current.logs).toEqual([]);
      expect(result.current.stats).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('ruft getAuditLogs beim Mount auf', async () => {
      renderHook(() => useAdminAuditLog());

      await waitFor(() => {
        expect(adminService.getAuditLogs).toHaveBeenCalledTimes(1);
      });
    });

    it('übergibt Standardparameter an getAuditLogs', async () => {
      renderHook(() => useAdminAuditLog());

      await waitFor(() => {
        expect(adminService.getAuditLogs).toHaveBeenCalledWith(
          expect.objectContaining({ page: 1, limit: 20, sort: '-createdAt' }),
          expect.objectContaining({})
        );
      });
    });
  });

  // ── Successful Loading ──────────────────────────

  describe('Erfolgreicher Datenabruf', () => {
    it('setzt logs und pagination nach Laden', async () => {
      const { result } = renderHook(() => useAdminAuditLog());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.logs).toEqual([mockLog1, mockLog2]);
      expect(result.current.pagination.total).toBe(2);
      expect(result.current.pagination.page).toBe(1);
    });

    it('setzt loading=false nach Laden', async () => {
      const { result } = renderHook(() => useAdminAuditLog());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('setzt error=null bei Erfolg', async () => {
      const { result } = renderHook(() => useAdminAuditLog());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.error).toBeNull();
    });
  });

  // ── Error Handling ──────────────────────────────

  describe('Error Handling', () => {
    it('setzt error bei API-Fehler', async () => {
      adminService.getAuditLogs.mockRejectedValue({
        response: { data: { message: 'Forbidden' } },
      });

      const { result } = renderHook(() => useAdminAuditLog());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.error).toBe('Forbidden');
      expect(result.current.logs).toEqual([]);
    });

    it('nutzt Fallback-Nachricht bei fehlendem response.data', async () => {
      adminService.getAuditLogs.mockRejectedValue(new Error('Network Error'));

      const { result } = renderHook(() => useAdminAuditLog());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.error).toBe('Network Error');
    });
  });

  // ── Filters ─────────────────────────────────────

  describe('Filters', () => {
    it('stellt Filter-Funktionen bereit', async () => {
      const { result } = renderHook(() => useAdminAuditLog());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(typeof result.current.filters.setActionFilter).toBe('function');
      expect(typeof result.current.filters.setSelectedMonth).toBe('function');
      expect(typeof result.current.filters.setSort).toBe('function');
      expect(typeof result.current.filters.setPage).toBe('function');
    });

    it('sendet actionFilter an API', async () => {
      const { result } = renderHook(() => useAdminAuditLog());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.filters.setActionFilter('USER_BANNED');
      });

      await waitFor(() => {
        expect(adminService.getAuditLogs).toHaveBeenCalledWith(
          expect.objectContaining({ action: 'USER_BANNED' }),
          expect.objectContaining({})
        );
      });
    });

    it('sendet startDate/endDate aus selectedMonth an API', async () => {
      const { result } = renderHook(() => useAdminAuditLog());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.filters.setSelectedMonth('2024-03');
      });

      await waitFor(() => {
        const call = adminService.getAuditLogs.mock.calls.at(-1)[0];
        expect(typeof call.startDate).toBe('string');
        expect(call.startDate.length).toBeGreaterThan(0);
        expect(typeof call.endDate).toBe('string');
        expect(call.endDate.length).toBeGreaterThan(0);
      });
    });

    it('setzt selectedMonth im filters-Objekt', async () => {
      const { result } = renderHook(() => useAdminAuditLog());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.filters.setSelectedMonth('2024-06');
      });

      expect(result.current.filters.selectedMonth).toBe('2024-06');
    });

    it('setzt leere optionale Filter nicht in Params', async () => {
      const { result } = renderHook(() => useAdminAuditLog());

      await waitFor(() => expect(result.current.loading).toBe(false));

      // action und country sollen bei leerem Wert nicht übergeben werden
      expect(adminService.getAuditLogs).toHaveBeenCalledWith(
        expect.not.objectContaining({ action: expect.anything() }),
        expect.objectContaining({})
      );
      expect(adminService.getAuditLogs).toHaveBeenCalledWith(
        expect.not.objectContaining({ country: expect.anything() }),
        expect.objectContaining({})
      );
    });
  });

  // ── Sorting ─────────────────────────────────────

  describe('Sorting', () => {
    it('übergibt sort-Parameter an API', async () => {
      const { result } = renderHook(() => useAdminAuditLog());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.filters.setSort('action');
      });

      await waitFor(() => {
        expect(adminService.getAuditLogs).toHaveBeenCalledWith(
          expect.objectContaining({ sort: 'action' }),
          expect.objectContaining({})
        );
      });
    });
  });

  // ── Pagination ──────────────────────────────────

  describe('Pagination', () => {
    it('übergibt page-Parameter an API', async () => {
      const { result } = renderHook(() => useAdminAuditLog());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.filters.setPage(3);
      });

      await waitFor(() => {
        expect(adminService.getAuditLogs).toHaveBeenCalledWith(
          expect.objectContaining({ page: 3 }),
          expect.objectContaining({})
        );
      });
    });
  });

  // ── Actions ─────────────────────────────────────

  describe('Actions', () => {
    it('stellt refresh-Funktion bereit (read-only Hook)', async () => {
      const { result } = renderHook(() => useAdminAuditLog());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(typeof result.current.actions.refresh).toBe('function');
    });

    it('refresh löst erneuten API-Aufruf aus', async () => {
      const { result } = renderHook(() => useAdminAuditLog());

      await waitFor(() => expect(result.current.loading).toBe(false));

      const callsBefore = adminService.getAuditLogs.mock.calls.length;

      await act(async () => {
        result.current.actions.refresh();
      });

      await waitFor(() => {
        expect(adminService.getAuditLogs.mock.calls.length).toBeGreaterThan(callsBefore);
      });
    });
  });

  // ── Unmount Safety ──────────────────────────────

  describe('Unmount Safety', () => {
    it('setzt keinen State nach Unmount', async () => {
      let resolve;
      adminService.getAuditLogs.mockReturnValue(
        new Promise(r => {
          resolve = r;
        })
      );

      const { unmount } = renderHook(() => useAdminAuditLog());
      unmount();

      // Resolve nach Unmount – darf keinen Fehler werfen
      await act(async () => {
        resolve(mockLogsResponse);
      });
    });
  });

  // ── Stats ───────────────────────────────────────

  describe('Stats', () => {
    it('lädt Stats parallel zu Logs', async () => {
      const { result } = renderHook(() => useAdminAuditLog());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(adminService.getAuditLogStats).toHaveBeenCalledTimes(1);
    });

    it('setzt Stats nach erfolgreichem Laden', async () => {
      const { result } = renderHook(() => useAdminAuditLog());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual({
        totalEntries: 42,
        mostCommonAction: 'USER_BANNED',
        activeAdmins: 3,
      });
    });

    it('setzt stats=null wenn getAuditLogStats fehlschlägt aber logs erfolgreich', async () => {
      adminService.getAuditLogStats.mockRejectedValue(new Error('Stats Error'));

      const { result } = renderHook(() => useAdminAuditLog());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Da Promise.all rejected, wird error gesetzt
      // stats bleibt null (initial)
      expect(result.current.stats).toBeNull();
    });
  });
});
