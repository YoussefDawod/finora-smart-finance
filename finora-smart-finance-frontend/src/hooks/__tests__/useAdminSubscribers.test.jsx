/**
 * @fileoverview useAdminSubscribers Hook Tests
 * @description Tests für den useAdminSubscribers Custom Hook –
 *              Laden, Pagination, Filter (Status, Sprache, Suche), Sortierung, Lösch-Aktion, Unmount-Safety.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdminSubscribers } from '../useAdminSubscribers';

// ── Mock adminService ──────────────────────────────
vi.mock('@/api/adminService', () => ({
  adminService: {
    getSubscribers: vi.fn(),
    deleteSubscriber: vi.fn(),
  },
}));

// ── Mock useDebounce (sofort zurückgeben) ──────────
vi.mock('@/hooks', async () => {
  const actual = await vi.importActual('@/hooks');
  return {
    ...actual,
    useDebounce: val => val,
  };
});

import { adminService } from '@/api/adminService';

// ── Test-Daten ─────────────────────────────────────
const mockSub1 = {
  _id: 'sub1',
  email: 'alice@example.com',
  isConfirmed: true,
  language: 'de',
  subscribedAt: '2024-01-15T10:00:00Z',
  createdAt: '2024-01-15T10:00:00Z',
};

const mockSub2 = {
  _id: 'sub2',
  email: 'bob@example.com',
  isConfirmed: false,
  language: 'en',
  subscribedAt: '2024-02-20T14:30:00Z',
  createdAt: '2024-02-20T14:30:00Z',
};

const mockSubscribersResponse = {
  data: {
    data: {
      subscribers: [mockSub1, mockSub2],
      pagination: { total: 2, page: 1, pages: 1, limit: 15 },
    },
  },
};

describe('useAdminSubscribers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getSubscribers.mockResolvedValue(mockSubscribersResponse);
  });

  // ── Initialization ──────────────────────────────

  describe('Initialization', () => {
    it('startet mit loading=true und leeren Daten', () => {
      const { result } = renderHook(() => useAdminSubscribers());
      expect(result.current.loading).toBe(true);
      expect(result.current.subscribers).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.actionLoading).toBeNull();
    });

    it('ruft getSubscribers beim Mount auf', async () => {
      renderHook(() => useAdminSubscribers());

      await waitFor(() => {
        expect(adminService.getSubscribers).toHaveBeenCalledTimes(1);
      });
    });

    it('übergibt Standardparameter an getSubscribers', async () => {
      renderHook(() => useAdminSubscribers());

      await waitFor(() => {
        expect(adminService.getSubscribers).toHaveBeenCalledWith(
          { page: 1, limit: 15, sort: '-createdAt' },
          expect.objectContaining({})
        );
      });
    });
  });

  // ── Successful Loading ──────────────────────────

  describe('Erfolgreicher Datenabruf', () => {
    it('setzt subscribers und pagination nach Laden', async () => {
      const { result } = renderHook(() => useAdminSubscribers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.subscribers).toEqual([mockSub1, mockSub2]);
      expect(result.current.pagination.total).toBe(2);
      expect(result.current.pagination.page).toBe(1);
    });

    it('setzt loading=false nach Laden', async () => {
      const { result } = renderHook(() => useAdminSubscribers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('setzt error=null bei Erfolg', async () => {
      const { result } = renderHook(() => useAdminSubscribers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.error).toBeNull();
    });
  });

  // ── Error Handling ──────────────────────────────

  describe('Error Handling', () => {
    it('setzt error bei API-Fehler', async () => {
      adminService.getSubscribers.mockRejectedValue({
        response: { data: { message: 'Server Error' } },
      });

      const { result } = renderHook(() => useAdminSubscribers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.error).toBe('Server Error');
      expect(result.current.subscribers).toEqual([]);
    });

    it('nutzt Fallback-Nachricht bei fehlendem response.data', async () => {
      adminService.getSubscribers.mockRejectedValue(new Error('Network Error'));

      const { result } = renderHook(() => useAdminSubscribers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.error).toBe('Network Error');
    });
  });

  // ── Filters ─────────────────────────────────────

  describe('Filters', () => {
    it('stellt Filter-Funktionen bereit', async () => {
      const { result } = renderHook(() => useAdminSubscribers());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(typeof result.current.filters.setSearch).toBe('function');
      expect(typeof result.current.filters.setConfirmedFilter).toBe('function');
      expect(typeof result.current.filters.setLanguageFilter).toBe('function');
      expect(typeof result.current.filters.setSort).toBe('function');
      expect(typeof result.current.filters.setPage).toBe('function');
    });

    it('sendet confirmedFilter an API', async () => {
      const { result } = renderHook(() => useAdminSubscribers());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.filters.setConfirmedFilter('true');
      });

      await waitFor(() => {
        expect(adminService.getSubscribers).toHaveBeenCalledWith(
          expect.objectContaining({ isConfirmed: 'true' }),
          expect.objectContaining({})
        );
      });
    });

    it('sendet languageFilter an API', async () => {
      const { result } = renderHook(() => useAdminSubscribers());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.filters.setLanguageFilter('de');
      });

      await waitFor(() => {
        expect(adminService.getSubscribers).toHaveBeenCalledWith(
          expect.objectContaining({ language: 'de' }),
          expect.objectContaining({})
        );
      });
    });

    it('sendet Suche an API', async () => {
      const { result } = renderHook(() => useAdminSubscribers());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.filters.setSearch('alice');
      });

      await waitFor(() => {
        expect(adminService.getSubscribers).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'alice' }),
          expect.objectContaining({})
        );
      });
    });

    it('setzt leere Filter nicht in Params', async () => {
      const { result } = renderHook(() => useAdminSubscribers());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(adminService.getSubscribers).toHaveBeenCalledWith(
        { page: 1, limit: 15, sort: '-createdAt' },
        expect.objectContaining({})
      );
    });
  });

  // ── Sorting ─────────────────────────────────────

  describe('Sorting', () => {
    it('übergibt sort-Parameter an API', async () => {
      const { result } = renderHook(() => useAdminSubscribers());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.filters.setSort('email');
      });

      await waitFor(() => {
        expect(adminService.getSubscribers).toHaveBeenCalledWith(
          expect.objectContaining({ sort: 'email' }),
          expect.objectContaining({})
        );
      });
    });
  });

  // ── Pagination ──────────────────────────────────

  describe('Pagination', () => {
    it('übergibt page-Parameter an API', async () => {
      const { result } = renderHook(() => useAdminSubscribers());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.filters.setPage(2);
      });

      await waitFor(() => {
        expect(adminService.getSubscribers).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 }),
          expect.objectContaining({})
        );
      });
    });
  });

  // ── Actions ─────────────────────────────────────

  describe('Actions', () => {
    it('stellt alle Aktions-Funktionen bereit', async () => {
      const { result } = renderHook(() => useAdminSubscribers());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(typeof result.current.actions.deleteSubscriber).toBe('function');
      expect(typeof result.current.actions.refresh).toBe('function');
    });

    it('deleteSubscriber ruft adminService.deleteSubscriber auf und refresht', async () => {
      adminService.deleteSubscriber.mockResolvedValue({
        data: { data: { email: 'alice@example.com' } },
      });
      const { result } = renderHook(() => useAdminSubscribers());

      await waitFor(() => expect(result.current.loading).toBe(false));

      const callsBefore = adminService.getSubscribers.mock.calls.length;

      let actionResult;
      await act(async () => {
        actionResult = await result.current.actions.deleteSubscriber('sub1');
      });

      expect(adminService.deleteSubscriber).toHaveBeenCalledWith('sub1');
      expect(actionResult.success).toBe(true);
      // Refresh triggered
      expect(adminService.getSubscribers.mock.calls.length).toBeGreaterThan(callsBefore);
    });

    it('gibt Fehler zurück bei fehlgeschlagener Lösch-Aktion', async () => {
      adminService.deleteSubscriber.mockRejectedValue({
        response: { data: { message: 'Not found' } },
      });
      const { result } = renderHook(() => useAdminSubscribers());

      await waitFor(() => expect(result.current.loading).toBe(false));

      let actionResult;
      await act(async () => {
        actionResult = await result.current.actions.deleteSubscriber('sub1');
      });

      expect(actionResult.success).toBe(false);
      expect(actionResult.error).toBe('Not found');
    });

    it('setzt actionLoading während Lösch-Aktion', async () => {
      let resolveDelete;
      adminService.deleteSubscriber.mockReturnValue(
        new Promise(r => {
          resolveDelete = r;
        })
      );
      const { result } = renderHook(() => useAdminSubscribers());

      await waitFor(() => expect(result.current.loading).toBe(false));

      let deletePromise;
      act(() => {
        deletePromise = result.current.actions.deleteSubscriber('sub1');
      });

      // Während der Aktion ist actionLoading gesetzt
      expect(result.current.actionLoading).toBe('sub1');

      await act(async () => {
        resolveDelete({ data: { data: { email: 'alice@example.com' } } });
        await deletePromise;
      });

      expect(result.current.actionLoading).toBeNull();
    });
  });

  // ── Unmount Safety ──────────────────────────────

  describe('Unmount Safety', () => {
    it('setzt keinen State nach Unmount', async () => {
      let resolve;
      adminService.getSubscribers.mockReturnValue(
        new Promise(r => {
          resolve = r;
        })
      );

      const { unmount } = renderHook(() => useAdminSubscribers());
      unmount();

      // Resolve nach Unmount – darf keinen Fehler werfen
      await act(async () => {
        resolve(mockSubscribersResponse);
      });
    });
  });
});
