/**
 * @fileoverview useAdminSubscribers Hook
 * @description Verwaltet die Subscriber-Liste für das Admin-Panel:
 *              Laden, Paginierung, Suche, Filter (Status, Sprache), Sortierung, Löschen.
 *
 * @module hooks/useAdminSubscribers
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { adminService } from '@/api/adminService';
import { useDebounce } from './useDebounce';
import { useAbortSignal, isAborted } from './useAbortSignal';

// ── Standardwerte ─────────────────────────────────
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 15;
const DEFAULT_SORT = '-createdAt';

/**
 * Hook für Admin Subscriber-Management
 *
 * @param {Object} [initialParams] - Optionale Startparameter
 * @returns {Object} subscribers, pagination, loading, error, filters, actions
 */
export function useAdminSubscribers(initialParams = {}) {
  // ── State ───────────────────────────────────────
  const [subscribers, setSubscribers] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0, page: DEFAULT_PAGE, pages: 1, limit: DEFAULT_LIMIT,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Filter State
  const [search, setSearch] = useState(initialParams.search || '');
  const [confirmedFilter, setConfirmedFilter] = useState(initialParams.isConfirmed || '');
  const [languageFilter, setLanguageFilter] = useState(initialParams.language || '');
  const [sort, setSort] = useState(initialParams.sort || DEFAULT_SORT);
  const [page, setPage] = useState(initialParams.page || DEFAULT_PAGE);

  const debouncedSearch = useDebounce(search, 400);
  const mountedRef = useRef(true);
  const { createSignal } = useAbortSignal();

  // ── Fetch Subscribers ───────────────────────────

  const fetchSubscribers = useCallback(async () => {
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
      if (confirmedFilter) params.isConfirmed = confirmedFilter;
      if (languageFilter) params.language = languageFilter;

      const res = await adminService.getSubscribers(params, { signal });
      if (signal.aborted) return;

      const data = res.data?.data || res.data;
      setSubscribers(data.subscribers || []);
      setPagination(
        data.pagination || { total: 0, page, pages: 1, limit: DEFAULT_LIMIT },
      );
    } catch (err) {
      if (isAborted(err)) return;
      setError(
        err.response?.data?.message || err.message || 'Failed to load subscribers',
      );
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [page, sort, debouncedSearch, confirmedFilter, languageFilter, createSignal]);

  // Zurück auf Seite 1 bei Filteränderung
  useEffect(() => {
    setPage(DEFAULT_PAGE);
  }, [debouncedSearch, confirmedFilter, languageFilter]);

  useEffect(() => {
    mountedRef.current = true;
    fetchSubscribers();
    return () => { mountedRef.current = false; };
  }, [fetchSubscribers]);

  // ── Aktionen ────────────────────────────────────

  const deleteSubscriber = useCallback(async (subscriberId) => {
    setActionLoading(subscriberId);
    try {
      const result = await adminService.deleteSubscriber(subscriberId);
      if (!mountedRef.current) return { success: false };
      await fetchSubscribers();
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
  }, [fetchSubscribers]);

  // ── Memoized Objekte ────────────────────────────

  const actions = useMemo(() => ({
    deleteSubscriber,
    refresh: fetchSubscribers,
  }), [deleteSubscriber, fetchSubscribers]);

  const filters = useMemo(() => ({
    search, setSearch,
    confirmedFilter, setConfirmedFilter,
    languageFilter, setLanguageFilter,
    sort, setSort,
    page, setPage,
  }), [search, confirmedFilter, languageFilter, sort, page]);

  return {
    subscribers,
    pagination,
    loading,
    error,
    actionLoading,
    filters,
    actions,
  };
}

export default useAdminSubscribers;
