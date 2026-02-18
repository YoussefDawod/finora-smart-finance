/**
 * useBudget Hook
 * Manages budget-related state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import i18n from '@/i18n';
import { userService } from '@/api';
import { useAuth } from './useAuth';

/**
 * Hook for managing budget status and settings
 * @returns {Object} Budget state and operations
 */
export function useBudget() {
  const { isAuthenticated } = useAuth();
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch current budget status from API
   */
  const fetchBudgetStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await userService.getBudgetStatus();
      setBudgetStatus(response.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || i18n.t('settings.budget.loadError'));
      setBudgetStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update budget settings (limit and threshold)
   * @param {Object} budgetSettings
   * @param {number} budgetSettings.monthlyLimit
   * @param {number} budgetSettings.alertThreshold
   */
  const updateBudget = useCallback(async (budgetSettings) => {
    setError(null);
    try {
      await userService.updatePreferences({
        budget: budgetSettings,
      });
      // Refetch to get updated status
      await fetchBudgetStatus();
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || i18n.t('settings.budget.saveError');
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [fetchBudgetStatus]);

  /**
   * Clear budget (set limit to 0)
   */
  const clearBudget = useCallback(async () => {
    return updateBudget({ monthlyLimit: 0, alertThreshold: 80 });
  }, [updateBudget]);

  // Initial fetch (only when authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      fetchBudgetStatus();
    } else {
      setIsLoading(false);
      setBudgetStatus(null);
    }
  }, [fetchBudgetStatus, isAuthenticated]);

  return {
    budgetStatus,
    isLoading,
    error,
    fetchBudgetStatus,
    updateBudget,
    clearBudget,
    hasBudget: budgetStatus?.hasBudget || false,
  };
}

export default useBudget;
