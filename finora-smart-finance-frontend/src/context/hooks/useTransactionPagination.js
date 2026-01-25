/**
 * useTransactionPagination Hook
 * Extrahierte Pagination-Logik für TransactionContext
 */

import { useCallback } from 'react';
import { ACTIONS } from '../reducers/transactionReducer';

/**
 * Custom Hook für Transaction Pagination
 * @param {Function} dispatch - Reducer dispatch function
 * @param {Object} pagination - Current pagination state
 */
export function useTransactionPagination(dispatch, pagination) {
  const setPage = useCallback(
    (page) => {
      dispatch({ type: ACTIONS.SET_PAGE, payload: page });
    },
    [dispatch]
  );

  const setLimit = useCallback(
    (limit) => {
      dispatch({ type: ACTIONS.SET_LIMIT, payload: limit });
    },
    [dispatch]
  );

  const nextPage = useCallback(() => {
    if (pagination.page < pagination.pages) {
      dispatch({ type: ACTIONS.SET_PAGE, payload: pagination.page + 1 });
    }
  }, [dispatch, pagination.page, pagination.pages]);

  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      dispatch({ type: ACTIONS.SET_PAGE, payload: pagination.page - 1 });
    }
  }, [dispatch, pagination.page]);

  return {
    setPage,
    setLimit,
    nextPage,
    prevPage,
  };
}
