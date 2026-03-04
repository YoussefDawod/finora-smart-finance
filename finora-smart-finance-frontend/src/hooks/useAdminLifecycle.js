/**
 * @fileoverview useAdminLifecycle Hook
 * @description Verwaltet Lifecycle-Statistiken, User-Detail, Reset und
 *              manuelle Trigger-Aktion für das Admin-Lifecycle-Panel.
 *
 * @module hooks/useAdminLifecycle
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { adminService } from '@/api/adminService';
import { useAbortSignal, isAborted } from './useAbortSignal';

/**
 * Hook für die Admin-Lifecycle-Verwaltung
 *
 * @returns {Object} stats, userDetail, loading, actionLoading, error, actions
 */
export function useAdminLifecycle() {
  // ── State ───────────────────────────────────────
  const [stats, setStats] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [triggerResult, setTriggerResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  const { createSignal } = useAbortSignal();

  // ── Fetch Stats ─────────────────────────────────

  const fetchStats = useCallback(async () => {
    const signal = createSignal();
    setLoading(true);
    setError(null);

    try {
      const res = await adminService.getLifecycleStats({ signal });

      setStats(res.data?.data || res.data);
    } catch (err) {
      if (isAborted(err)) return;
      setError(
        err.response?.data?.message || err.message || 'Failed to load lifecycle stats',
      );
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [createSignal]);

  // ── Fetch User Detail ───────────────────────────

  const fetchUserDetail = useCallback(async (userId) => {
    setActionLoading('detail');
    try {
      const res = await adminService.getUserLifecycleDetail(userId);
      if (!mountedRef.current) return null;

      const data = res.data?.data || res.data;
      setUserDetail(data);
      return data;
    } catch (err) {
      if (!mountedRef.current) return null;
      throw err;
    } finally {
      if (mountedRef.current) setActionLoading(null);
    }
  }, []);

  // ── Reset User Retention ────────────────────────

  const resetRetention = useCallback(async (userId) => {
    setActionLoading('reset');
    try {
      await adminService.resetUserRetention(userId);
      if (!mountedRef.current) return;

      // Refresh stats + user detail
      await fetchStats();
      if (userDetail?.user?._id === userId) {
        await fetchUserDetail(userId);
      }
    } finally {
      if (mountedRef.current) setActionLoading(null);
    }
  }, [fetchStats, fetchUserDetail, userDetail]);

  // ── Trigger Processing ──────────────────────────

  const triggerProcessing = useCallback(async () => {
    setActionLoading('trigger');
    try {
      const res = await adminService.triggerRetentionProcessing();
      if (!mountedRef.current) return null;

      const data = res.data?.data || res.data;
      setTriggerResult(data);

      // Refresh stats after trigger
      await fetchStats();
      return data;
    } finally {
      if (mountedRef.current) setActionLoading(null);
    }
  }, [fetchStats]);

  // ── Dismiss Trigger Result ──────────────────

  const dismissTriggerResult = useCallback(() => {
    setTriggerResult(null);
  }, []);

  // ── Close Detail ────────────────────────────────

  const closeDetail = useCallback(() => {
    setUserDetail(null);
  }, []);

  // ── Initial Fetch ───────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    fetchStats();
    return () => { mountedRef.current = false; };
  }, [fetchStats]);

  // ── Memoized Actions ────────────────────────────

  const actions = useMemo(() => ({
    refresh: fetchStats,
    fetchUserDetail,
    resetRetention,
    triggerProcessing,
    dismissTriggerResult,
    closeDetail,
  }), [fetchStats, fetchUserDetail, resetRetention, triggerProcessing, dismissTriggerResult, closeDetail]);

  return {
    stats,
    userDetail,
    triggerResult,
    loading,
    actionLoading,
    error,
    actions,
  };
}

export default useAdminLifecycle;
