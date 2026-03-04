/**
 * @fileoverview useAdminTransactions Hook
 * @description Verwaltet die Transaktions-Liste für das Admin-Panel:
 *              Laden, Paginierung, Suche, Filter (Typ, Kategorie, Datum), Sortierung, Löschen.
 *
 * @module hooks/useAdminTransactions
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { adminService } from '@/api/adminService';
import { useDebounce } from './useDebounce';
import { useAbortSignal, isAborted } from './useAbortSignal';

// ── Standardwerte ─────────────────────────────────
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 15;
const DEFAULT_SORT = '-date';

/**
 * Hook für Admin Transaktions-Management
 *
 * @param {Object} [initialParams] - Optionale Startparameter
 * @returns {Object} transactions, pagination, loading, error, filters, actions
 */
export function useAdminTransactions(initialParams = {}) {
  // ── State ───────────────────────────────────────
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0, page: DEFAULT_PAGE, pages: 1, limit: DEFAULT_LIMIT,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Filter State
  const [search, setSearch] = useState(initialParams.search || '');
  const [typeFilter, setTypeFilter] = useState(initialParams.type || '');
  const [categoryFilter, setCategoryFilter] = useState(initialParams.category || '');
  const [startDate, setStartDate] = useState(initialParams.startDate || '');
  const [endDate, setEndDate] = useState(initialParams.endDate || '');
  const [sort, setSort] = useState(initialParams.sort || DEFAULT_SORT);
  const [page, setPage] = useState(initialParams.page || DEFAULT_PAGE);
  const [userId, setUserId] = useState(initialParams.userId || '');

  const debouncedSearch = useDebounce(search, 400);
  const mountedRef = useRef(true);
  const { createSignal } = useAbortSignal();

  // Sync userId wenn sich der initialParams.userId ändert (z.B. User-Wechsel)
  useEffect(() => {
    const newId = initialParams.userId || '';
    setUserId((prev) => (prev !== newId ? newId : prev));
  }, [initialParams.userId]);

  // ── Fetch Transactions ──────────────────────────

  const fetchTransactions = useCallback(async () => {
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
      if (typeFilter) params.type = typeFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (userId) params.userId = userId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await adminService.getTransactions(params, { signal });

      const data = res.data?.data || res.data;
      setTransactions(data.transactions || []);
      setPagination(
        data.pagination || { total: 0, page, pages: 1, limit: DEFAULT_LIMIT },
      );
    } catch (err) {
      if (isAborted(err)) return;
      setError(
        err.response?.data?.message || err.message || 'Failed to load transactions',
      );
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [page, sort, debouncedSearch, typeFilter, categoryFilter, startDate, endDate, userId, createSignal]);

  // Zurück auf Seite 1 bei Filteränderung
  useEffect(() => {
    setPage(DEFAULT_PAGE);
  }, [debouncedSearch, typeFilter, categoryFilter, startDate, endDate, userId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchTransactions();
    return () => { mountedRef.current = false; };
  }, [fetchTransactions]);

  // ── Aktionen ────────────────────────────────────

  const deleteTransaction = useCallback(async (transactionId) => {
    setActionLoading(transactionId);
    try {
      const result = await adminService.deleteTransaction(transactionId);
      if (!mountedRef.current) return { success: false };
      await fetchTransactions();
      return { success: true, data: result.data?.data || result.data };
    } catch (err) {
      if (!mountedRef.current) return { success: false };
      return {
        success: false,
        error: err.response?.data?.message || err.message || 'Delete failed',
      };
    } finally {
      if (mountedRef.current) setActionLoading(null);
    }
  }, [fetchTransactions]);

  // ── Memoized Objekte ────────────────────────────

  const actions = useMemo(() => ({
    deleteTransaction,
    refresh: fetchTransactions,
  }), [deleteTransaction, fetchTransactions]);

  const filters = useMemo(() => ({
    search, setSearch,
    typeFilter, setTypeFilter,
    categoryFilter, setCategoryFilter,
    startDate, setStartDate,
    endDate, setEndDate,
    sort, setSort,
    page, setPage,
    userId, setUserId,
  }), [search, typeFilter, categoryFilter, startDate, endDate, sort, page, userId]);

  return {
    transactions,
    pagination,
    loading,
    error,
    actionLoading,
    filters,
    actions,
  };
}

export default useAdminTransactions;
