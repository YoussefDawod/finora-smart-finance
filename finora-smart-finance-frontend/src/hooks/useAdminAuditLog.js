/**
 * @fileoverview useAdminAuditLog Hook
 * @description Verwaltet die Audit-Log-Liste für das Admin-Panel:
 *              Laden, Paginierung, Filter (Action, Datum, Land), Sortierung,
 *              Monatsbasierte Ansicht, Selektion, Löschen, Export.
 *
 * @module hooks/useAdminAuditLog
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { adminService } from '@/api/adminService';
import { useAbortSignal, isAborted } from './useAbortSignal';
import { useDebounce } from './useDebounce';
import { useAuth } from './useAuth';
import { exportToCSV, exportToPDF } from '@/utils/exportAuditLog';

// ── Standardwerte ─────────────────────────────────
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const DEFAULT_SORT = '-createdAt';

/**
 * Berechnet Start-/Enddatum für einen Monat (YYYY-MM)
 * @param {string} ym - Format: 'YYYY-MM'
 * @returns {{ startDate: string, endDate: string }}
 */
function monthToDateRange(ym) {
  if (!ym) return { startDate: '', endDate: '' };
  const [year, month] = ym.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

/**
 * Gibt den aktuellen Monat als YYYY-MM zurück
 */
function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Hook für Admin Audit-Log Ansicht
 *
 * @param {Object} [initialParams] - Optionale Startparameter
 * @returns {Object} logs, stats, pagination, loading, error, filters, actions, selection
 */
export function useAdminAuditLog(initialParams = {}) {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();

  // ── State ───────────────────────────────────────
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: DEFAULT_PAGE,
    pages: 1,
    limit: DEFAULT_LIMIT,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter State
  const [actionFilter, setActionFilter] = useState(initialParams.action || '');
  const [countryFilter, setCountryFilter] = useState(initialParams.country || '');
  const [selectedMonth, setSelectedMonth] = useState(initialParams.month || getCurrentMonth());
  const [search, setSearch] = useState(initialParams.search || '');
  const [sort, setSort] = useState(initialParams.sort || DEFAULT_SORT);
  const [page, setPage] = useState(initialParams.page || DEFAULT_PAGE);

  // Selection State
  const [selectedIds, setSelectedIds] = useState(new Set());

  const debouncedSearch = useDebounce(search, 400);
  const { createSignal } = useAbortSignal();

  // ── MonthRange (berechnet aus selectedMonth) ────
  const monthRange = useMemo(() => monthToDateRange(selectedMonth), [selectedMonth]);

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
      if (countryFilter) params.country = countryFilter;
      if (monthRange.startDate) params.startDate = monthRange.startDate;
      if (monthRange.endDate) params.endDate = monthRange.endDate;
      if (debouncedSearch) params.search = debouncedSearch;

      const [res, statsRes] = await Promise.all([
        adminService.getAuditLogs(params, { signal }),
        adminService.getAuditLogStats({ signal }),
      ]);
      if (signal.aborted) return;

      const data = res.data?.data || res.data;
      setLogs(data.logs || []);
      setPagination(data.pagination || { total: 0, page, pages: 1, limit: DEFAULT_LIMIT });
      setStats(statsRes.data?.data || statsRes.data || null);
    } catch (err) {
      if (isAborted(err)) return;
      setError(err.response?.data?.message || err.message || 'Failed to load audit logs');
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [
    page,
    sort,
    actionFilter,
    countryFilter,
    monthRange.startDate,
    monthRange.endDate,
    debouncedSearch,
    createSignal,
  ]);

  // Zurück auf Seite 1 bei Filteränderung
  useEffect(() => {
    setPage(DEFAULT_PAGE);
    setSelectedIds(new Set());
  }, [actionFilter, countryFilter, selectedMonth, debouncedSearch]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ── Selection ───────────────────────────────────

  const handleSelectId = useCallback(id => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      const allIds = logs.map(l => l._id || l.id);
      const allSelected = allIds.length > 0 && allIds.every(id => prev.has(id));
      if (allSelected) {
        return new Set();
      }
      return new Set(allIds);
    });
  }, [logs]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // ── Delete ──────────────────────────────────────

  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);
    try {
      await adminService.deleteAuditLogsBulk([...selectedIds]);
      setSelectedIds(new Set());
      await fetchLogs();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  }, [selectedIds, fetchLogs]);

  const handleDeleteAll = useCallback(async () => {
    setIsDeleting(true);
    try {
      await adminService.deleteAllAuditLogs();
      setSelectedIds(new Set());
      await fetchLogs();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  }, [fetchLogs]);

  // ── Export ──────────────────────────────────────

  const handleExportCSV = useCallback(() => {
    const filename = `audit-log-${selectedMonth}`;
    exportToCSV(logs, filename, t);
  }, [logs, selectedMonth, t]);

  const handleExportPDF = useCallback(() => {
    const filename = `audit-log-${selectedMonth}`;
    exportToPDF(logs, filename, t, { name: authUser?.name, email: authUser?.email });
  }, [logs, selectedMonth, t, authUser]);

  // ── Month Navigation ────────────────────────────

  const goToPrevMonth = useCallback(() => {
    setSelectedMonth(prev => {
      const [y, m] = prev.split('-').map(Number);
      const d = new Date(y, m - 2, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setSelectedMonth(prev => {
      const [y, m] = prev.split('-').map(Number);
      const d = new Date(y, m, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
  }, []);

  // ── Memoized Objekte ────────────────────────────

  const actions = useMemo(
    () => ({
      refresh: fetchLogs,
      deleteSelected: handleDeleteSelected,
      deleteAll: handleDeleteAll,
      exportCSV: handleExportCSV,
      exportPDF: handleExportPDF,
      goToPrevMonth,
      goToNextMonth,
    }),
    [
      fetchLogs,
      handleDeleteSelected,
      handleDeleteAll,
      handleExportCSV,
      handleExportPDF,
      goToPrevMonth,
      goToNextMonth,
    ]
  );

  const filters = useMemo(
    () => ({
      actionFilter,
      setActionFilter,
      countryFilter,
      setCountryFilter,
      selectedMonth,
      setSelectedMonth,
      search,
      setSearch,
      sort,
      setSort,
      page,
      setPage,
    }),
    [actionFilter, countryFilter, selectedMonth, search, sort, page]
  );

  const selection = useMemo(
    () => ({
      selectedIds,
      handleSelectId,
      handleSelectAll,
      handleClearSelection,
    }),
    [selectedIds, handleSelectId, handleSelectAll, handleClearSelection]
  );

  return {
    logs,
    stats,
    pagination,
    loading,
    isDeleting,
    error,
    filters,
    actions,
    selection,
  };
}

export default useAdminAuditLog;
