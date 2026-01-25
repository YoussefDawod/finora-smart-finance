/**
 * useTransactionFetch Hook
 * Extrahierte Fetch-Logik für TransactionContext
 */

import { useCallback } from 'react';
import i18n from '@/i18n';
import { transactionService } from '@/api';
import { ACTIONS, initialState } from '../reducers/transactionReducer';

/**
 * Custom Hook für Transaction Fetch Operations
 * @param {Function} dispatch - Reducer dispatch function
 * @param {Object} state - Current state
 * @param {boolean} isAuthenticated - Auth status
 */
export function useTransactionFetch(dispatch, state, isAuthenticated) {
  // ──────────────────────────────────────────────────────────────────────
  // FETCH DASHBOARD DATA (aggregiert, keine vollen Transaktionen)
  // ──────────────────────────────────────────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    if (!isAuthenticated) {
      dispatch({ type: ACTIONS.FETCH_DASHBOARD_SUCCESS, payload: null });
      return;
    }

    dispatch({ type: ACTIONS.FETCH_DASHBOARD_START });
    try {
      const response = await transactionService.getDashboardData();
      dispatch({
        type: ACTIONS.FETCH_DASHBOARD_SUCCESS,
        payload: response.data.data,
      });
    } catch (err) {
      const errorMsg = err.response?.data?.message || i18n.t('dashboard.errors.load');
      dispatch({ type: ACTIONS.FETCH_DASHBOARD_ERROR, payload: errorMsg });
      console.error('Fetch dashboard error:', err);
    }
  }, [dispatch, isAuthenticated]);

  // ──────────────────────────────────────────────────────────────────────
  // FETCH TRANSACTIONS (paginiert mit Filtern)
  // ──────────────────────────────────────────────────────────────────────
  const fetchTransactions = useCallback(
    async (page = state.pagination.page) => {
      if (!isAuthenticated) {
        dispatch({
          type: ACTIONS.FETCH_LIST_SUCCESS,
          payload: { data: [], pagination: initialState.pagination },
        });
        return;
      }

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

        const response = await transactionService.getTransactions(params);
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
      isAuthenticated,
      state.pagination.page,
      state.pagination.limit,
      state.sortBy,
      state.sortOrder,
      state.filter,
    ]
  );

  return {
    fetchDashboardData,
    fetchTransactions,
  };
}
