/**
 * @fileoverview useAdminDashboard Hook
 * @description Lädt alle Admin-Dashboard-Daten parallel (Stats, Transaction-Stats, Subscriber-Stats).
 *              Stellt Loading/Error/Refresh-State bereit.
 *
 * @module hooks/useAdminDashboard
 */

import { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/api/adminService';
import { useAbortSignal, isAborted } from './useAbortSignal';

/**
 * @typedef {Object} AdminDashboardData
 * @property {Object|null} stats - Hauptstatistiken (overview + recentUsers)
 * @property {Object|null} transactionStats - Transaktionsstatistiken
 * @property {Object|null} subscriberStats - Newsletter-Statistiken
 * @property {boolean} loading - Daten werden geladen
 * @property {string|null} error - Fehlermeldung
 * @property {Function} refresh - Daten neu laden
 */

/**
 * Hook für Admin-Dashboard-Daten
 * @returns {AdminDashboardData}
 */
export function useAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [transactionStats, setTransactionStats] = useState(null);
  const [subscriberStats, setSubscriberStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { createSignal } = useAbortSignal();

  const fetchData = useCallback(async () => {
    const signal = createSignal();
    setLoading(true);
    setError(null);

    try {
      const [statsRes, txStatsRes, subStatsRes] = await Promise.all([
        adminService.getStats({ signal }),
        adminService.getTransactionStats({ signal }),
        adminService.getSubscriberStats({ signal }),
      ]);

      setStats(statsRes.data?.data || statsRes.data);
      setTransactionStats(txStatsRes.data?.data || txStatsRes.data);
      setSubscriberStats(subStatsRes.data?.data || subStatsRes.data);
    } catch (err) {
      if (isAborted(err)) return;
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [createSignal]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    stats,
    transactionStats,
    subscriberStats,
    loading,
    error,
    refresh: fetchData,
  };
}

export default useAdminDashboard;
