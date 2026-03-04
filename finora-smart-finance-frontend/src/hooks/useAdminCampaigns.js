/**
 * @fileoverview useAdminCampaigns Hook
 * @description Verwaltet die Campaign-Liste für das Admin-Panel:
 *              Laden, Paginierung, Suche, Filter (Status, Sprache), Sortierung, CRUD + Send.
 *
 * @module hooks/useAdminCampaigns
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
 * Hook für Admin Campaign-Management
 *
 * @param {Object} [initialParams] - Optionale Startparameter
 * @returns {Object} campaigns, stats, pagination, loading, error, filters, actions
 */
export function useAdminCampaigns(initialParams = {}) {
  // ── State ───────────────────────────────────────
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0, page: DEFAULT_PAGE, pages: 1, limit: DEFAULT_LIMIT,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Filter State
  const [search, setSearch] = useState(initialParams.search || '');
  const [statusFilter, setStatusFilter] = useState(initialParams.status || '');
  const [languageFilter, setLanguageFilter] = useState(initialParams.language || '');
  const [sort, setSort] = useState(initialParams.sort || DEFAULT_SORT);
  const [page, setPage] = useState(initialParams.page || DEFAULT_PAGE);

  const debouncedSearch = useDebounce(search, 400);
  const mountedRef = useRef(true);
  const { createSignal } = useAbortSignal();

  // ── Fetch Campaigns ─────────────────────────────

  const fetchCampaigns = useCallback(async () => {
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
      if (statusFilter) params.status = statusFilter;
      if (languageFilter) params.language = languageFilter;

      const res = await adminService.getCampaigns(params, { signal });
      if (signal.aborted) return;

      const data = res.data?.data || res.data;
      setCampaigns(data.campaigns || []);
      setPagination(
        data.pagination || { total: 0, page, pages: 1, limit: DEFAULT_LIMIT },
      );
    } catch (err) {
      if (isAborted(err)) return;
      setError(
        err.response?.data?.error || err.message || 'Failed to load campaigns',
      );
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [page, sort, debouncedSearch, statusFilter, languageFilter, createSignal]);

  // ── Fetch Stats ─────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminService.getCampaignStats({});
      if (!mountedRef.current) return;
      setStats(res.data?.data || res.data);
    } catch {
      // Stats sind optional, Fehler still ignorieren
    }
  }, []);

  // Zurück auf Seite 1 bei Filteränderung
  useEffect(() => {
    setPage(DEFAULT_PAGE);
  }, [debouncedSearch, statusFilter, languageFilter]);

  useEffect(() => {
    mountedRef.current = true;
    fetchCampaigns();
    fetchStats();
    return () => { mountedRef.current = false; };
  }, [fetchCampaigns, fetchStats]);

  // ── Aktionen ────────────────────────────────────

  const deleteCampaign = useCallback(async (campaignId) => {
    setActionLoading(campaignId);
    try {
      const result = await adminService.deleteCampaign(campaignId);
      if (!mountedRef.current) return { success: false };
      await fetchCampaigns();
      await fetchStats();
      return { success: true, data: result.data?.data || result.data };
    } catch (err) {
      if (!mountedRef.current) return { success: false };
      return {
        success: false,
        error: err.response?.data?.error || err.message || 'Delete failed',
      };
    } finally {
      if (mountedRef.current) setActionLoading(null);
    }
  }, [fetchCampaigns, fetchStats]);

  const sendCampaign = useCallback(async (campaignId) => {
    setActionLoading(campaignId);
    try {
      const result = await adminService.sendCampaign(campaignId);
      if (!mountedRef.current) return { success: false };
      await fetchCampaigns();
      await fetchStats();
      return { success: true, data: result.data?.data || result.data };
    } catch (err) {
      if (!mountedRef.current) return { success: false };
      return {
        success: false,
        code: err.response?.data?.code,
        error: err.response?.data?.error || err.message || 'Send failed',
      };
    } finally {
      if (mountedRef.current) setActionLoading(null);
    }
  }, [fetchCampaigns, fetchStats]);

  const resetAllCampaigns = useCallback(async () => {
    setActionLoading('reset-all');
    try {
      const result = await adminService.deleteAllCampaigns();
      if (!mountedRef.current) return { success: false };
      await fetchCampaigns();
      await fetchStats();
      return { success: true, data: result.data?.data || result.data };
    } catch (err) {
      if (!mountedRef.current) return { success: false };
      return {
        success: false,
        error: err.response?.data?.error || err.message || 'Reset failed',
      };
    } finally {
      if (mountedRef.current) setActionLoading(null);
    }
  }, [fetchCampaigns, fetchStats]);

  // ── Memoized Objekte ────────────────────────────

  const actions = useMemo(() => ({
    deleteCampaign,
    sendCampaign,
    resetAllCampaigns,
    refresh: () => { fetchCampaigns(); fetchStats(); },
  }), [deleteCampaign, sendCampaign, resetAllCampaigns, fetchCampaigns, fetchStats]);

  const filters = useMemo(() => ({
    search, setSearch,
    statusFilter, setStatusFilter,
    languageFilter, setLanguageFilter,
    sort, setSort,
    page, setPage,
  }), [search, statusFilter, languageFilter, sort, page]);

  return {
    campaigns,
    stats,
    pagination,
    loading,
    error,
    actionLoading,
    filters,
    actions,
  };
}

export default useAdminCampaigns;
