/**
 * useTransactionFilters Hook
 * Extrahierte Filter- und Sortier-Logik für TransactionContext
 */

import { useCallback } from 'react';
import { ACTIONS } from '../reducers/transactionReducer';

/**
 * Custom Hook für Transaction Filter & Sort Operations
 * @param {Function} dispatch - Reducer dispatch function
 */
export function useTransactionFilters(dispatch) {
  // ──────────────────────────────────────────────────────────────────────
  // DASHBOARD MONTH/YEAR (syncs filter.startDate/endDate automatically)
  // ──────────────────────────────────────────────────────────────────────
  const setDashboardMonth = useCallback(
    (month, year, options = {}) => {
      dispatch({
        type: ACTIONS.SET_DASHBOARD_MONTH,
        payload: {
          month,
          year,
          startDate: options.startDate,
          endDate: options.endDate,
        },
      });
    },
    [dispatch]
  );

  // ──────────────────────────────────────────────────────────────────────
  // FILTER
  // ──────────────────────────────────────────────────────────────────────
  const setFilter = useCallback(
    (filterOptions) => {
      dispatch({ type: ACTIONS.SET_FILTER, payload: filterOptions });
    },
    [dispatch]
  );

  const clearFilter = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_FILTER });
  }, [dispatch]);

  // ──────────────────────────────────────────────────────────────────────
  // SORT
  // ──────────────────────────────────────────────────────────────────────
  const setSort = useCallback(
    (sortBy, sortOrder) => {
      dispatch({ type: ACTIONS.SET_SORT, payload: { sortBy, sortOrder } });
    },
    [dispatch]
  );

  // ──────────────────────────────────────────────────────────────────────
  // ERROR
  // ──────────────────────────────────────────────────────────────────────
  const clearError = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
  }, [dispatch]);

  return {
    setDashboardMonth,
    setFilter,
    setSort,
    clearFilter,
    clearError,
  };
}
