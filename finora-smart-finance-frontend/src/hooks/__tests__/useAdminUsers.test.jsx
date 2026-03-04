/**
 * @fileoverview useAdminUsers Hook Tests
 * @description Tests für den useAdminUsers Custom Hook –
 *              Laden, Pagination, Filter, Sortierung, Aktionen, Unmount-Safety.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdminUsers } from '../useAdminUsers';

// ── Mock adminService ──────────────────────────────
vi.mock('@/api/adminService', () => ({
  adminService: {
    getUsers: vi.fn(),
    banUser: vi.fn(),
    unbanUser: vi.fn(),
    changeUserRole: vi.fn(),
    deleteUser: vi.fn(),
    resetPassword: vi.fn(),
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
const mockUser1 = {
  _id: 'u1',
  name: 'Alice',
  email: 'alice@example.com',
  role: 'user',
  isActive: true,
  isVerified: true,
  createdAt: '2024-01-15T10:00:00Z',
};

const mockUser2 = {
  _id: 'u2',
  name: 'Bob Admin',
  email: 'bob@example.com',
  role: 'admin',
  isActive: true,
  isVerified: true,
  createdAt: '2024-01-14T10:00:00Z',
};

const mockUsersResponse = {
  data: {
    data: {
      users: [mockUser1, mockUser2],
      pagination: { total: 2, page: 1, pages: 1, limit: 10 },
    },
  },
};

describe('useAdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getUsers.mockResolvedValue(mockUsersResponse);
  });

  // ── Initialization ──────────────────────────────

  describe('Initialization', () => {
    it('startet mit loading=true und leeren Daten', () => {
      const { result } = renderHook(() => useAdminUsers());
      expect(result.current.loading).toBe(true);
      expect(result.current.users).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.actionLoading).toBeNull();
    });

    it('ruft getUsers beim Mount auf', async () => {
      renderHook(() => useAdminUsers());

      await waitFor(() => {
        expect(adminService.getUsers).toHaveBeenCalledTimes(1);
      });
    });

    it('übergibt Standardparameter an getUsers', async () => {
      renderHook(() => useAdminUsers());

      await waitFor(() => {
        expect(adminService.getUsers).toHaveBeenCalledWith(
          { page: 1, limit: 10, sort: '-createdAt' },
          expect.objectContaining({}),
        );
      });
    });
  });

  // ── Successful Loading ──────────────────────────

  describe('Erfolgreicher Datenabruf', () => {
    it('setzt users und pagination nach Laden', async () => {
      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.users).toEqual([mockUser1, mockUser2]);
      expect(result.current.pagination.total).toBe(2);
      expect(result.current.pagination.page).toBe(1);
    });

    it('setzt loading=false nach Laden', async () => {
      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('setzt error=null bei Erfolg', async () => {
      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.error).toBeNull();
    });
  });

  // ── Error Handling ──────────────────────────────

  describe('Error Handling', () => {
    it('setzt error bei API-Fehler', async () => {
      adminService.getUsers.mockRejectedValue({
        response: { data: { message: 'Server Error' } },
      });

      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.error).toBe('Server Error');
      expect(result.current.users).toEqual([]);
    });

    it('nutzt Fallback-Nachricht bei fehlendem response.data', async () => {
      adminService.getUsers.mockRejectedValue(new Error('Network Error'));

      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.error).toBe('Network Error');
    });
  });

  // ── Filter ──────────────────────────────────────

  describe('Filters', () => {
    it('stellt Filter-Funktionen bereit', async () => {
      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(typeof result.current.filters.setSearch).toBe('function');
      expect(typeof result.current.filters.setRoleFilter).toBe('function');
      expect(typeof result.current.filters.setStatusFilter).toBe('function');
      expect(typeof result.current.filters.setVerifiedFilter).toBe('function');
      expect(typeof result.current.filters.setSort).toBe('function');
      expect(typeof result.current.filters.setPage).toBe('function');
    });

    it('sendet roleFilter an API', async () => {
      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.filters.setRoleFilter('admin');
      });

      await waitFor(() => {
        expect(adminService.getUsers).toHaveBeenCalledWith(
          expect.objectContaining({ role: 'admin' }),
          expect.objectContaining({}),
        );
      });
    });

    it('sendet statusFilter an API', async () => {
      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.filters.setStatusFilter('true');
      });

      await waitFor(() => {
        expect(adminService.getUsers).toHaveBeenCalledWith(
          expect.objectContaining({ isActive: 'true' }),
          expect.objectContaining({}),
        );
      });
    });

    it('sendet verifiedFilter an API', async () => {
      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.filters.setVerifiedFilter('true');
      });

      await waitFor(() => {
        expect(adminService.getUsers).toHaveBeenCalledWith(
          expect.objectContaining({ isVerified: 'true' }),
          expect.objectContaining({}),
        );
      });
    });

    it('sendet Suche an API', async () => {
      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.filters.setSearch('alice');
      });

      await waitFor(() => {
        expect(adminService.getUsers).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'alice' }),
          expect.objectContaining({}),
        );
      });
    });
  });

  // ── Sorting ─────────────────────────────────────

  describe('Sorting', () => {
    it('übergibt sort-Parameter an API', async () => {
      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.filters.setSort('name');
      });

      await waitFor(() => {
        expect(adminService.getUsers).toHaveBeenCalledWith(
          expect.objectContaining({ sort: 'name' }),
          expect.objectContaining({}),
        );
      });
    });
  });

  // ── Pagination ──────────────────────────────────

  describe('Pagination', () => {
    it('übergibt page-Parameter an API', async () => {
      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.filters.setPage(2);
      });

      await waitFor(() => {
        expect(adminService.getUsers).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 }),
          expect.objectContaining({}),
        );
      });
    });
  });

  // ── Actions ─────────────────────────────────────

  describe('Actions', () => {
    it('stellt alle Aktions-Funktionen bereit', async () => {
      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(typeof result.current.actions.banUser).toBe('function');
      expect(typeof result.current.actions.unbanUser).toBe('function');
      expect(typeof result.current.actions.changeRole).toBe('function');
      expect(typeof result.current.actions.deleteUser).toBe('function');
      expect(typeof result.current.actions.resetPassword).toBe('function');
      expect(typeof result.current.actions.refresh).toBe('function');
    });

    it('banUser ruft adminService.banUser auf und refresht', async () => {
      adminService.banUser.mockResolvedValue({ data: { data: { user: mockUser1 } } });
      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => expect(result.current.loading).toBe(false));

      const callsBefore = adminService.getUsers.mock.calls.length;

      let actionResult;
      await act(async () => {
        actionResult = await result.current.actions.banUser('u1', 'spam');
      });

      expect(adminService.banUser).toHaveBeenCalledWith('u1', 'spam');
      expect(actionResult.success).toBe(true);
      // Refresh triggered
      expect(adminService.getUsers.mock.calls.length).toBeGreaterThan(callsBefore);
    });

    it('unbanUser ruft adminService.unbanUser auf', async () => {
      adminService.unbanUser.mockResolvedValue({ data: { data: { user: mockUser1 } } });
      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => expect(result.current.loading).toBe(false));

      let actionResult;
      await act(async () => {
        actionResult = await result.current.actions.unbanUser('u1');
      });

      expect(adminService.unbanUser).toHaveBeenCalledWith('u1');
      expect(actionResult.success).toBe(true);
    });

    it('changeRole ruft adminService.changeUserRole auf', async () => {
      adminService.changeUserRole.mockResolvedValue({ data: { data: { user: mockUser1 } } });
      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => expect(result.current.loading).toBe(false));

      let actionResult;
      await act(async () => {
        actionResult = await result.current.actions.changeRole('u1', 'admin');
      });

      expect(adminService.changeUserRole).toHaveBeenCalledWith('u1', 'admin');
      expect(actionResult.success).toBe(true);
    });

    it('deleteUser ruft adminService.deleteUser auf', async () => {
      adminService.deleteUser.mockResolvedValue({ data: { data: {} } });
      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => expect(result.current.loading).toBe(false));

      let actionResult;
      await act(async () => {
        actionResult = await result.current.actions.deleteUser('u1');
      });

      expect(adminService.deleteUser).toHaveBeenCalledWith('u1');
      expect(actionResult.success).toBe(true);
    });

    it('resetPassword ruft adminService.resetPassword auf', async () => {
      adminService.resetPassword.mockResolvedValue({ data: { data: {} } });
      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => expect(result.current.loading).toBe(false));

      let actionResult;
      await act(async () => {
        actionResult = await result.current.actions.resetPassword('u1', 'newPass123');
      });

      expect(adminService.resetPassword).toHaveBeenCalledWith('u1', 'newPass123');
      expect(actionResult.success).toBe(true);
    });

    it('gibt Fehler zurück bei fehlgeschlagener Aktion', async () => {
      adminService.banUser.mockRejectedValue({
        response: { data: { message: 'Cannot ban admin' } },
      });
      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => expect(result.current.loading).toBe(false));

      let actionResult;
      await act(async () => {
        actionResult = await result.current.actions.banUser('u1');
      });

      expect(actionResult.success).toBe(false);
      expect(actionResult.error).toBe('Cannot ban admin');
    });
  });

  // ── Unmount Safety ──────────────────────────────

  describe('Unmount Safety', () => {
    it('setzt keinen State nach Unmount', async () => {
      let resolve;
      adminService.getUsers.mockReturnValue(
        new Promise((r) => {
          resolve = r;
        }),
      );

      const { unmount } = renderHook(() => useAdminUsers());
      unmount();

      // Resolve nach Unmount – darf keinen Fehler werfen
      await act(async () => {
        resolve(mockUsersResponse);
      });
    });
  });
});
