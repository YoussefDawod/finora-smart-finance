/**
 * @fileoverview useAdminFeedbacks Hook
 * @description Verwaltet die Feedback-Liste für das Admin-Panel:
 *              Laden, Paginierung, Filter, Sortierung, Publish/Unpublish/Löschen.
 *
 * @module hooks/useAdminFeedbacks
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { adminService } from '@/api/adminService';
import { useDebounce } from './useDebounce';
import { useAbortSignal, isAborted } from './useAbortSignal';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 15;
const DEFAULT_SORT = '-createdAt';

export function useAdminFeedbacks(initialParams = {}) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: DEFAULT_PAGE,
    pages: 1,
    limit: DEFAULT_LIMIT,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Filter State
  const [search, setSearch] = useState(initialParams.search || '');
  const [ratingFilter, setRatingFilter] = useState(initialParams.ratingFilter || '');
  const [consentFilter, setConsentFilter] = useState(initialParams.consentFilter || '');
  const [publishedFilter, setPublishedFilter] = useState(initialParams.publishedFilter || '');
  const [sort, setSort] = useState(initialParams.sort || DEFAULT_SORT);
  const [page, setPage] = useState(initialParams.page || DEFAULT_PAGE);

  const debouncedSearch = useDebounce(search, 400);
  const mountedRef = useRef(true);
  const { createSignal } = useAbortSignal();

  // ── Fetch Feedbacks ─────────────────────────────

  const fetchFeedbacks = useCallback(async () => {
    const signal = createSignal();
    setLoading(true);
    setError(null);

    try {
      const params = { page, limit: DEFAULT_LIMIT, sort };
      if (debouncedSearch) params.search = debouncedSearch;
      if (ratingFilter) params.ratingFilter = ratingFilter;
      if (consentFilter) params.consentFilter = consentFilter;
      if (publishedFilter) params.publishedFilter = publishedFilter;

      const res = await adminService.getFeedbacks(params, { signal });
      if (signal.aborted) return;

      const data = res.data?.data || res.data;
      setFeedbacks(data.feedbacks || []);
      setPagination(data.pagination || { total: 0, page, pages: 1, limit: DEFAULT_LIMIT });
    } catch (err) {
      if (isAborted(err)) return;
      setError(err.response?.data?.message || err.message || 'Failed to load feedbacks');
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [page, sort, debouncedSearch, ratingFilter, consentFilter, publishedFilter, createSignal]);

  // ── Fetch Stats ─────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminService.getFeedbackStats();
      if (mountedRef.current) {
        setStats(res.data?.data || res.data);
      }
    } catch {
      // Stats-Fehler sind nicht kritisch
    }
  }, []);

  // Zurück auf Seite 1 bei Filteränderung
  useEffect(() => {
    setPage(DEFAULT_PAGE);
  }, [debouncedSearch, ratingFilter, consentFilter, publishedFilter]);

  useEffect(() => {
    mountedRef.current = true;
    fetchFeedbacks();
    fetchStats();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchFeedbacks, fetchStats]);

  // ── Aktionen ────────────────────────────────────

  const publishFeedback = useCallback(
    async feedbackId => {
      setActionLoading(feedbackId);
      try {
        await adminService.publishFeedback(feedbackId);
        if (!mountedRef.current) return { success: false };
        await Promise.all([fetchFeedbacks(), fetchStats()]);
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.error || err.message || 'Publish failed',
        };
      } finally {
        if (mountedRef.current) setActionLoading(null);
      }
    },
    [fetchFeedbacks, fetchStats]
  );

  const unpublishFeedback = useCallback(
    async feedbackId => {
      setActionLoading(feedbackId);
      try {
        await adminService.unpublishFeedback(feedbackId);
        if (!mountedRef.current) return { success: false };
        await Promise.all([fetchFeedbacks(), fetchStats()]);
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.error || err.message || 'Unpublish failed',
        };
      } finally {
        if (mountedRef.current) setActionLoading(null);
      }
    },
    [fetchFeedbacks, fetchStats]
  );

  const deleteFeedback = useCallback(
    async feedbackId => {
      setActionLoading(feedbackId);
      try {
        await adminService.deleteFeedback(feedbackId);
        if (!mountedRef.current) return { success: false };
        await Promise.all([fetchFeedbacks(), fetchStats()]);
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.error || err.message || 'Delete failed',
        };
      } finally {
        if (mountedRef.current) setActionLoading(null);
      }
    },
    [fetchFeedbacks, fetchStats]
  );

  // ── Memoized Objekte ────────────────────────────

  const actions = useMemo(
    () => ({
      publishFeedback,
      unpublishFeedback,
      deleteFeedback,
      refresh: () => {
        fetchFeedbacks();
        fetchStats();
      },
    }),
    [publishFeedback, unpublishFeedback, deleteFeedback, fetchFeedbacks, fetchStats]
  );

  const filters = useMemo(
    () => ({
      search,
      setSearch,
      ratingFilter,
      setRatingFilter,
      consentFilter,
      setConsentFilter,
      publishedFilter,
      setPublishedFilter,
      sort,
      setSort,
      page,
      setPage,
    }),
    [search, ratingFilter, consentFilter, publishedFilter, sort, page]
  );

  return {
    feedbacks,
    stats,
    pagination,
    loading,
    error,
    actionLoading,
    filters,
    actions,
  };
}

export default useAdminFeedbacks;
