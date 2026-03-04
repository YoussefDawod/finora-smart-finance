/**
 * @fileoverview useAdminTransactions Hook Tests
 * @description Tests für den useAdminTransactions Custom Hook –
 *              Laden, Pagination, Filter (Typ, Kategorie, Datum), Sortierung, Lösch-Aktion, Unmount-Safety.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdminTransactions } from '../useAdminTransactions';

// ── Mock adminService ──────────────────────────────
vi.mock('@/api/adminService', () => ({
  adminService: {
    getTransactions: vi.fn(),
    deleteTransaction: vi.fn(),
  },
}));

// ── Mock useDebounce (sofort zurückgeben) ──────────
vi.mock('@/hooks', async () => {
  const actual = await vi.importActual('@/hooks');
  return {
    ...actual,
    useDebounce: (val) => val,
  };
});

import { adminService } from '@/api/adminService';

// ── Test-Daten ─────────────────────────────────────
const mockTx1 = {
  _id: 'tx1',
  description: 'Gehalt Januar',
  amount: 3000,
  category: 'Gehalt',
  type: 'income',
  date: '2024-01-31',
  userId: { _id: 'u1', name: 'Alice', email: 'alice@example.com' },
};

const mockTx2 = {
  _id: 'tx2',
  description: 'Miete Februar',
  amount: 800,
  category: 'Miete',
  type: 'expense',
  date: '2024-02-01',
  userId: { _id: 'u2', name: 'Bob', email: 'bob@example.com' },
};

const mockTransactionsResponse = {
  data: {
    data: {
      transactions: [mockTx1, mockTx2],
      pagination: { total: 2, page: 1, pages: 1, limit: 15 },
    },
  },
};

describe('useAdminTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getTransactions.mockResolvedValue(mockTransactionsResponse);
  });

  // ── Initialization ──────────────────────────────

  describe('Initialization', () => {
    it('startet mit loading=true und leeren Daten', () => {
      const { result } = renderHook(() => useAdminTransactions());
      expect(result.current.loading).toBe(true);
      expect(result.current.transactions).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.actionLoading).toBeNull();
    });

    it('ruft getTransactions beim Mount auf', async () => {
      renderHook(() => useAdminTransactions());

      await waitFor(() => {
        expect(adminService.getTransactions).toHaveBeenCalledTimes(1);
      });
    });

    it('übergibt Standardparameter an getTransactions', async () => {
      renderHook(() => useAdminTransactions());

      await waitFor(() => {
        expect(adminService.getTransactions).toHaveBeenCalledWith(
          { page: 1, limit: 15, sort: '-date' },
          expect.objectContaining({}),
        );
      });
    });
  });

  // ── Successful Loading ──────────────────────────

  describe('Erfolgreicher Datenabruf', () => {
    it('setzt transactions und pagination nach Laden', async () => {
      const { result } = renderHook(() => useAdminTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.transactions).toEqual([mockTx1, mockTx2]);
      expect(result.current.pagination.total).toBe(2);
      expect(result.current.pagination.page).toBe(1);
    });

    it('setzt loading=false nach Laden', async () => {
      const { result } = renderHook(() => useAdminTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('setzt error=null bei Erfolg', async () => {
      const { result } = renderHook(() => useAdminTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.error).toBeNull();
    });
  });

  // ── Error Handling ──────────────────────────────

  describe('Error Handling', () => {
    it('setzt error bei API-Fehler', async () => {
      adminService.getTransactions.mockRejectedValue({
        response: { data: { message: 'Server Error' } },
      });

      const { result } = renderHook(() => useAdminTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.error).toBe('Server Error');
      expect(result.current.transactions).toEqual([]);
    });

    it('nutzt Fallback-Nachricht bei fehlendem response.data', async () => {
      adminService.getTransactions.mockRejectedValue(new Error('Network Error'));

      const { result } = renderHook(() => useAdminTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.error).toBe('Network Error');
    });
  });

  // ── Filter ──────────────────────────────────────

  describe('Filters', () => {
    it('stellt Filter-Funktionen bereit', async () => {
      const { result } = renderHook(() => useAdminTransactions());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(typeof result.current.filters.setSearch).toBe('function');
      expect(typeof result.current.filters.setTypeFilter).toBe('function');
      expect(typeof result.current.filters.setCategoryFilter).toBe('function');
      expect(typeof result.current.filters.setStartDate).toBe('function');
      expect(typeof result.current.filters.setEndDate).toBe('function');
      expect(typeof result.current.filters.setSort).toBe('function');
      expect(typeof result.current.filters.setPage).toBe('function');
    });

    it('sendet typeFilter an API', async () => {
      const { result } = renderHook(() => useAdminTransactions());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.filters.setTypeFilter('income');
      });

      await waitFor(() => {
        expect(adminService.getTransactions).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'income' }),
          expect.objectContaining({}),
        );
      });
    });

    it('sendet categoryFilter an API', async () => {
      const { result } = renderHook(() => useAdminTransactions());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.filters.setCategoryFilter('Miete');
      });

      await waitFor(() => {
        expect(adminService.getTransactions).toHaveBeenCalledWith(
          expect.objectContaining({ category: 'Miete' }),
          expect.objectContaining({}),
        );
      });
    });

    it('sendet startDate an API', async () => {
      const { result } = renderHook(() => useAdminTransactions());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.filters.setStartDate('2024-01-01');
      });

      await waitFor(() => {
        expect(adminService.getTransactions).toHaveBeenCalledWith(
          expect.objectContaining({ startDate: '2024-01-01' }),
          expect.objectContaining({}),
        );
      });
    });

    it('sendet endDate an API', async () => {
      const { result } = renderHook(() => useAdminTransactions());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.filters.setEndDate('2024-12-31');
      });

      await waitFor(() => {
        expect(adminService.getTransactions).toHaveBeenCalledWith(
          expect.objectContaining({ endDate: '2024-12-31' }),
          expect.objectContaining({}),
        );
      });
    });

    it('sendet Suche an API', async () => {
      const { result } = renderHook(() => useAdminTransactions());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.filters.setSearch('Gehalt');
      });

      await waitFor(() => {
        expect(adminService.getTransactions).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'Gehalt' }),
          expect.objectContaining({}),
        );
      });
    });

    it('setzt leere Filter nicht in Params', async () => {
      const { result } = renderHook(() => useAdminTransactions());

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Default-Aufruf ohne leere Strings
      expect(adminService.getTransactions).toHaveBeenCalledWith(
        { page: 1, limit: 15, sort: '-date' },
        expect.objectContaining({}),
      );
    });
  });

  // ── Sorting ─────────────────────────────────────

  describe('Sorting', () => {
    it('übergibt sort-Parameter an API', async () => {
      const { result } = renderHook(() => useAdminTransactions());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.filters.setSort('amount');
      });

      await waitFor(() => {
        expect(adminService.getTransactions).toHaveBeenCalledWith(
          expect.objectContaining({ sort: 'amount' }),
          expect.objectContaining({}),
        );
      });
    });
  });

  // ── Pagination ──────────────────────────────────

  describe('Pagination', () => {
    it('übergibt page-Parameter an API', async () => {
      const { result } = renderHook(() => useAdminTransactions());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.filters.setPage(2);
      });

      await waitFor(() => {
        expect(adminService.getTransactions).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 }),
          expect.objectContaining({}),
        );
      });
    });
  });

  // ── Actions ─────────────────────────────────────

  describe('Actions', () => {
    it('stellt alle Aktions-Funktionen bereit', async () => {
      const { result } = renderHook(() => useAdminTransactions());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(typeof result.current.actions.deleteTransaction).toBe('function');
      expect(typeof result.current.actions.refresh).toBe('function');
    });

    it('deleteTransaction ruft adminService.deleteTransaction auf und refresht', async () => {
      adminService.deleteTransaction.mockResolvedValue({ data: { data: { id: 'tx1' } } });
      const { result } = renderHook(() => useAdminTransactions());

      await waitFor(() => expect(result.current.loading).toBe(false));

      const callsBefore = adminService.getTransactions.mock.calls.length;

      let actionResult;
      await act(async () => {
        actionResult = await result.current.actions.deleteTransaction('tx1');
      });

      expect(adminService.deleteTransaction).toHaveBeenCalledWith('tx1');
      expect(actionResult.success).toBe(true);
      // Refresh triggered
      expect(adminService.getTransactions.mock.calls.length).toBeGreaterThan(callsBefore);
    });

    it('gibt Fehler zurück bei fehlgeschlagener Lösch-Aktion', async () => {
      adminService.deleteTransaction.mockRejectedValue({
        response: { data: { message: 'Not found' } },
      });
      const { result } = renderHook(() => useAdminTransactions());

      await waitFor(() => expect(result.current.loading).toBe(false));

      let actionResult;
      await act(async () => {
        actionResult = await result.current.actions.deleteTransaction('tx1');
      });

      expect(actionResult.success).toBe(false);
      expect(actionResult.error).toBe('Not found');
    });

    it('setzt actionLoading während Lösch-Aktion', async () => {
      let resolveDelete;
      adminService.deleteTransaction.mockReturnValue(
        new Promise((r) => { resolveDelete = r; }),
      );
      const { result } = renderHook(() => useAdminTransactions());

      await waitFor(() => expect(result.current.loading).toBe(false));

      let deletePromise;
      act(() => {
        deletePromise = result.current.actions.deleteTransaction('tx1');
      });

      // Während der Aktion ist actionLoading gesetzt
      expect(result.current.actionLoading).toBe('tx1');

      await act(async () => {
        resolveDelete({ data: { data: { id: 'tx1' } } });
        await deletePromise;
      });

      expect(result.current.actionLoading).toBeNull();
    });
  });

  // ── Unmount Safety ──────────────────────────────

  describe('Unmount Safety', () => {
    it('setzt keinen State nach Unmount', async () => {
      let resolve;
      adminService.getTransactions.mockReturnValue(
        new Promise((r) => { resolve = r; }),
      );

      const { unmount } = renderHook(() => useAdminTransactions());
      unmount();

      // Resolve nach Unmount – darf keinen Fehler werfen
      await act(async () => {
        resolve(mockTransactionsResponse);
      });
    });
  });
});
