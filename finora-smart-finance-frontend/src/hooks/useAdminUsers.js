/**
 * @fileoverview useAdminUsers Hook
 * @description Verwaltet die User-Liste für das Admin-Panel:
 *              Laden, Paginierung, Suche, Filter, Sortierung und Aktionen.
 *
 * @module hooks/useAdminUsers
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { adminService } from '@/api/adminService';
import { useDebounce } from './useDebounce';
import { useAbortSignal, isAborted } from './useAbortSignal';

// ── Standardwerte ─────────────────────────────────
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const DEFAULT_SORT = '-createdAt';

/**
 * Hook für Admin User-Management
 *
 * @param {Object} [initialParams] - Optionale Startparameter
 * @returns {Object} users, pagination, loading, error, filters, actions
 */
export function useAdminUsers(initialParams = {}) {
  // ── State ───────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: DEFAULT_PAGE,
    pages: 1,
    limit: DEFAULT_LIMIT,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // userId der laufenden Aktion

  // Filter State
  const [search, setSearch] = useState(initialParams.search || '');
  const [roleFilter, setRoleFilter] = useState(initialParams.role || '');
  const [statusFilter, setStatusFilter] = useState(initialParams.isActive || '');
  const [verifiedFilter, setVerifiedFilter] = useState(initialParams.isVerified || '');
  const [sort, setSort] = useState(initialParams.sort || DEFAULT_SORT);
  const [page, setPage] = useState(initialParams.page || DEFAULT_PAGE);

  const debouncedSearch = useDebounce(search, 400);
  const mountedRef = useRef(true);
  const { createSignal } = useAbortSignal();

  // ── Fetch Users ─────────────────────────────────

  const fetchUsers = useCallback(async () => {
    const signal = createSignal();
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: DEFAULT_LIMIT,
        sort,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.isActive = statusFilter;
      if (verifiedFilter) params.isVerified = verifiedFilter;

      const res = await adminService.getUsers(params, { signal });

      const data = res.data?.data || res.data;
      setUsers(data.users || []);
      setPagination(data.pagination || { total: 0, page, pages: 1, limit: DEFAULT_LIMIT });
    } catch (err) {
      if (isAborted(err)) return;
      setError(err.response?.data?.message || err.message || 'Failed to load users');
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [page, sort, debouncedSearch, roleFilter, statusFilter, verifiedFilter, createSignal]);

  // Zurück auf Seite 1 bei Filteränderung
  useEffect(() => {
    setPage(DEFAULT_PAGE);
  }, [debouncedSearch, roleFilter, statusFilter, verifiedFilter]);

  useEffect(() => {
    mountedRef.current = true;
    fetchUsers();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchUsers]);

  // ── Aktionen ────────────────────────────────────

  const executeAction = useCallback(async (actionFn, userId) => {
    setActionLoading(userId);
    try {
      const result = await actionFn();
      if (!mountedRef.current) return { success: false };
      return { success: true, data: result.data?.data || result.data };
    } catch (err) {
      if (!mountedRef.current) return { success: false };
      return {
        success: false,
        error: err.response?.data?.message || err.message || 'Action failed',
      };
    } finally {
      if (mountedRef.current) setActionLoading(null);
    }
  }, []);

  const banUser = useCallback(
    async (userId, reason = '') => {
      const result = await executeAction(() => adminService.banUser(userId, reason), userId);
      if (result.success) await fetchUsers();
      return result;
    },
    [executeAction, fetchUsers]
  );

  const unbanUser = useCallback(
    async userId => {
      const result = await executeAction(() => adminService.unbanUser(userId), userId);
      if (result.success) await fetchUsers();
      return result;
    },
    [executeAction, fetchUsers]
  );

  const changeRole = useCallback(
    async (userId, role) => {
      const result = await executeAction(() => adminService.changeUserRole(userId, role), userId);
      if (result.success) await fetchUsers();
      return result;
    },
    [executeAction, fetchUsers]
  );

  const deleteUser = useCallback(
    async userId => {
      const result = await executeAction(() => adminService.deleteUser(userId), userId);
      if (result.success) await fetchUsers();
      return result;
    },
    [executeAction, fetchUsers]
  );

  const resetPassword = useCallback(
    async (userId, newPassword) => {
      const result = await executeAction(
        () => adminService.resetPassword(userId, newPassword),
        userId
      );
      return result;
    },
    [executeAction]
  );

  const createUser = useCallback(
    async userData => {
      setActionLoading('create');
      try {
        const result = await adminService.createUser(userData);
        if (!mountedRef.current) return { success: false };
        await fetchUsers();
        return { success: true, data: result.data?.data || result.data };
      } catch (err) {
        if (!mountedRef.current) return { success: false };
        return {
          success: false,
          error: err.response?.data?.message || err.message || 'Create failed',
        };
      } finally {
        if (mountedRef.current) setActionLoading(null);
      }
    },
    [fetchUsers]
  );

  const updateUser = useCallback(
    async (userId, data) => {
      const result = await executeAction(() => adminService.updateUser(userId, data), userId);
      if (result.success) await fetchUsers();
      return result;
    },
    [executeAction, fetchUsers]
  );

  // ── Memoized Actions Objekt ─────────────────────

  const actions = useMemo(
    () => ({
      banUser,
      unbanUser,
      changeRole,
      deleteUser,
      resetPassword,
      createUser,
      updateUser,
      refresh: fetchUsers,
    }),
    [banUser, unbanUser, changeRole, deleteUser, resetPassword, createUser, updateUser, fetchUsers]
  );

  const filters = useMemo(
    () => ({
      search,
      setSearch,
      roleFilter,
      setRoleFilter,
      statusFilter,
      setStatusFilter,
      verifiedFilter,
      setVerifiedFilter,
      sort,
      setSort,
      page,
      setPage,
    }),
    [search, roleFilter, statusFilter, verifiedFilter, sort, page]
  );

  return {
    users,
    pagination,
    loading,
    error,
    actionLoading,
    filters,
    actions,
  };
}

export default useAdminUsers;
