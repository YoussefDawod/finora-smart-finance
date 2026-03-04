/**
 * @fileoverview useAdminAuditLog Hook
 * @description Verwaltet die Audit-Log-Liste für das Admin-Panel:
 *              Laden, Paginierung, Filter (Action, Datum), Sortierung.
 *              Nur lesend – keine Lösch-/Schreib-Aktionen.
 *
 * @module hooks/useAdminAuditLog
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminService } from '@/api/adminService';
import { useAbortSignal, isAborted } from './useAbortSignal';
import { useDebounce } from './useDebounce';

// ── Standardwerte ─────────────────────────────────
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const DEFAULT_SORT = '-createdAt';

/**
 * Hook für Admin Audit-Log Ansicht (read-only)
 *
 * @param {Object} [initialParams] - Optionale Startparameter
 * @returns {Object} logs, stats, pagination, loading, error, filters, actions
 */
export function useAdminAuditLog(initialParams = {}) {
  // ── State ───────────────────────────────────────
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0, page: DEFAULT_PAGE, pages: 1, limit: DEFAULT_LIMIT,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter State
  const [actionFilter, setActionFilter] = useState(initialParams.action || '');
  const [startDate, setStartDate] = useState(initialParams.startDate || '');
  const [endDate, setEndDate] = useState(initialParams.endDate || '');
  const [search, setSearch] = useState(initialParams.search || '');
  const [sort, setSort] = useState(initialParams.sort || DEFAULT_SORT);
  const [page, setPage] = useState(initialParams.page || DEFAULT_PAGE);

  const debouncedSearch = useDebounce(search, 400);
  const { createSignal } = useAbortSignal();

  // ── Fetch Logs ──────────────────────────────────

  const fetchLogs = useCallback(async () => {
    const signal = createSignal();
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: DEFAULT_LIMIT,
        sort,
      };
      if (actionFilter) params.action = actionFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (debouncedSearch) params.search = debouncedSearch;

      const [res, statsRes] = await Promise.all([
        adminService.getAuditLogs(params, { signal }),
        adminService.getAuditLogStats({ signal }),
      ]);
      if (signal.aborted) return;

      const data = res.data?.data || res.data;
      setLogs(data.logs || []);
      setPagination(
        data.pagination || { total: 0, page, pages: 1, limit: DEFAULT_LIMIT },
      );
      setStats(statsRes.data?.data || statsRes.data || null);
    } catch (err) {
      if (isAborted(err)) return;
      setError(
        err.response?.data?.message || err.message || 'Failed to load audit logs',
      );
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [page, sort, actionFilter, startDate, endDate, debouncedSearch, createSignal]);

  // Zurück auf Seite 1 bei Filteränderung
  useEffect(() => {
    setPage(DEFAULT_PAGE);
  }, [actionFilter, startDate, endDate, debouncedSearch]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ── Memoized Objekte ────────────────────────────

  const actions = useMemo(() => ({
    refresh: fetchLogs,
  }), [fetchLogs]);

  const filters = useMemo(() => ({
    actionFilter, setActionFilter,
    startDate, setStartDate,
    endDate, setEndDate,
    search, setSearch,
    sort, setSort,
    page, setPage,
  }), [actionFilter, startDate, endDate, search, sort, page]);

  return {
    logs,
    stats,
    pagination,
    loading,
    error,
    filters,
    actions,
  };
}

export default useAdminAuditLog;
