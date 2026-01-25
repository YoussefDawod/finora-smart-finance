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
    setFilter,
    setSort,
    clearFilter,
    clearError,
  };
}
