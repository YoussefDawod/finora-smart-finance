/**
 * @fileoverview useAdminTransactionUsers Hook
 * @description Lädt User mit Transaktions-Statistiken für die gruppierte Transaktions-Ansicht.
 *
 * @module hooks/useAdminTransactionUsers
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminService } from '@/api/adminService';
import { useDebounce } from './useDebounce';
import { useAbortSignal, isAborted } from './useAbortSignal';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 15;
const DEFAULT_SORT = '-transactionCount';

/**
 * Hook für Admin Transaktions-User-Übersicht
 *
 * @returns {Object} users, pagination, loading, error, filters
 */
export function useAdminTransactionUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0, page: DEFAULT_PAGE, pages: 1, limit: DEFAULT_LIMIT,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [page, setPage] = useState(DEFAULT_PAGE);

  const debouncedSearch = useDebounce(search, 400);
  const { createSignal } = useAbortSignal();

  const fetchUsers = useCallback(async () => {
    const signal = createSignal();
    setLoading(true);
    setError(null);

    try {
      const params = { page, limit: DEFAULT_LIMIT, sort };
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await adminService.getTransactionUsers(params, { signal });

      const data = res.data?.data || res.data;
      setUsers(data.users || []);
      setPagination(
        data.pagination || { total: 0, page, pages: 1, limit: DEFAULT_LIMIT },
      );
    } catch (err) {
      if (isAborted(err)) return;
      setError(err.response?.data?.message || err.message || 'Failed to load users');
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [page, sort, debouncedSearch, createSignal]);

  useEffect(() => {
    setPage(DEFAULT_PAGE);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filters = useMemo(() => ({
    search, setSearch,
    sort, setSort,
    page, setPage,
  }), [search, sort, page]);

  return {
    users,
    pagination,
    loading,
    error,
    filters,
    refresh: fetchUsers,
  };
}
