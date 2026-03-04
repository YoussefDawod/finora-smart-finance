/**
 * @fileoverview useLifecycle Hook
 * @description Hook für Lifecycle-Status, Quota und Export-Bestätigung
 *
 * @module hooks/useLifecycle
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { userService } from '@/api';
import { useToast } from './useToast';

/**
 * Hook für den Transaction-Lifecycle-Status
 * @returns {Object} Lifecycle-Daten und Aktionen
 */
export function useLifecycle() {
  const { t } = useTranslation();
  const { success, error: showError } = useToast();

  const [lifecycleStatus, setLifecycleStatus] = useState(null);
  const [quota, setQuota] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Lifecycle-Status vom Backend laden
   */
  const fetchLifecycleStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await userService.getLifecycleStatus();
      setLifecycleStatus(response.data.data);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Quota-Status laden
   */
  const fetchQuota = useCallback(async () => {
    try {
      const response = await userService.getQuota();
      setQuota(response.data.data);
      return response.data.data;
    } catch {
      // Quota-Fehler sind nicht kritisch — still behandeln
      setQuota(null);
      return null;
    }
  }, []);

  /**
   * Export als bestätigt markieren
   */
  const confirmExport = useCallback(async () => {
    try {
      await userService.confirmExport();
      success(t('lifecycle.retention.exportConfirmedSuccess'));
      // Status neu laden
      await fetchLifecycleStatus();
      return true;
    } catch (err) {
      showError(err.response?.data?.message || err.message);
      return false;
    }
  }, [t, success, showError, fetchLifecycleStatus]);

  return {
    // State
    lifecycleStatus,
    quota,
    isLoading,
    error,
    // Actions
    fetchLifecycleStatus,
    fetchQuota,
    confirmExport,
  };
}
