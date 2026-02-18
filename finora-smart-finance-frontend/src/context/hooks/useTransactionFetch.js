/**
 * useTransactionFetch Hook
 * Extrahierte Fetch-Logik für TransactionContext
 */

import { useCallback } from 'react';
import i18n from '@/i18n';
import { transactionService } from '@/api';
import { retryAsync } from '@/utils/retry';
import { ACTIONS, initialState } from '../reducers/transactionReducer';

/**
 * Custom Hook für Transaction Fetch Operations
 * @param {Function} dispatch - Reducer dispatch function
 * @param {Object} state - Current state
 */
export function useTransactionFetch(dispatch, state) {
  const shouldRetry = useCallback((error) => {
    const status = error?.response?.status;
    return !status || status >= 500 || status === 429;
  }, []);

  // ──────────────────────────────────────────────────────────────────────
  // FETCH DASHBOARD DATA (aggregiert, keine vollen Transaktionen)
  // Verwendet dashboardMonth und dashboardYear aus dem State
  // ──────────────────────────────────────────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    dispatch({ type: ACTIONS.FETCH_DASHBOARD_START });
    try {
      const response = await retryAsync(
        () => transactionService.getDashboardData({
          month: state.dashboardMonth,
          year: state.dashboardYear,
        }),
        {
          retries: 2,
          delay: 400,
          factor: 2,
          shouldRetry,
        }
      );
      dispatch({
        type: ACTIONS.FETCH_DASHBOARD_SUCCESS,
        payload: response.data.data,
      });
    } catch (err) {
      const errorMsg = err.response?.data?.message || i18n.t('dashboard.errors.load');
      dispatch({ type: ACTIONS.FETCH_DASHBOARD_ERROR, payload: errorMsg });
      console.error('Fetch dashboard error:', err);
    }
  }, [dispatch, shouldRetry, state.dashboardMonth, state.dashboardYear]);

  // ──────────────────────────────────────────────────────────────────────
  // FETCH TRANSACTIONS (paginiert mit Filtern)
  // ──────────────────────────────────────────────────────────────────────
  const fetchTransactions = useCallback(
    async (page = state.pagination.page) => {
      dispatch({ type: ACTIONS.FETCH_LIST_START });
      try {
        const params = {
          page,
          limit: state.pagination.limit,
          sort: state.sortBy,
          order: state.sortOrder,
          type: state.filter.type || undefined,
          category: state.filter.category || undefined,
          startDate: state.filter.startDate || undefined,
          endDate: state.filter.endDate || undefined,
          search: state.filter.searchQuery || undefined,
        };

        // Entferne undefined-Werte
        Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

        const response = await retryAsync(() => transactionService.getTransactions(params), {
          retries: 2,
          delay: 400,
          factor: 2,
          shouldRetry,
        });
        dispatch({
          type: ACTIONS.FETCH_LIST_SUCCESS,
          payload: {
            data: response.data.data || [],
            pagination: response.data.pagination || initialState.pagination,
          },
        });
      } catch (err) {
        const errorMsg = err.response?.data?.message || i18n.t('transactions.errors.load');
        dispatch({ type: ACTIONS.FETCH_LIST_ERROR, payload: errorMsg });
        console.error('Fetch transactions error:', err);
      }
    },
    [
      dispatch,
      state.pagination.page,
      state.pagination.limit,
      state.sortBy,
      state.sortOrder,
      state.filter,
      shouldRetry,
    ]
  );

  return {
    fetchDashboardData,
    fetchTransactions,
  };
}
