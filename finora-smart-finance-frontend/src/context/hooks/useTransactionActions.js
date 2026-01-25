/**
 * useTransactionActions Hook
 * Extrahierte Action-Handler für TransactionContext
 */

import { useCallback } from 'react';
import i18n from '@/i18n';
import { transactionService } from '@/api';
import { ACTIONS } from '../reducers/transactionReducer';

/**
 * Custom Hook für Transaction CRUD Operations
 * @param {Function} dispatch - Reducer dispatch function
 * @param {Object} state - Current state
 * @param {boolean} isAuthenticated - Auth status
 * @param {Function} fetchDashboardData - Dashboard refresh function
 * @param {Function} fetchTransactions - List refresh function
 * @param {Function} setPage - Pagination setter
 */
export function useTransactionActions(dispatch, state, { isAuthenticated, fetchDashboardData, fetchTransactions, setPage }) {
  // ──────────────────────────────────────────────────────────────────────
  // CREATE - Add new transaction
  // ──────────────────────────────────────────────────────────────────────
  const createTransaction = useCallback(
    async (transactionData) => {
      dispatch({ type: ACTIONS.CREATE_START });
      try {
        const response = await transactionService.createTransaction(transactionData);
        const transaction = response.data.data || response.data;

        dispatch({ type: ACTIONS.CREATE_SUCCESS, payload: transaction });

        // Refetch: Dashboard + Liste aktualisieren
        await Promise.all([fetchDashboardData(), fetchTransactions(1)]);

        return transaction;
      } catch (err) {
        const errorMsg = err.response?.data?.message || i18n.t('transactions.errors.create');
        dispatch({ type: ACTIONS.CREATE_ERROR, payload: errorMsg });
        throw err;
      }
    },
    [dispatch, fetchDashboardData, fetchTransactions]
  );

  // ──────────────────────────────────────────────────────────────────────
  // UPDATE - Edit transaction
  // ──────────────────────────────────────────────────────────────────────
  const updateTransaction = useCallback(
    async (id, transactionData) => {
      dispatch({ type: ACTIONS.UPDATE_START });
      try {
        const response = await transactionService.updateTransaction(id, transactionData);
        const transaction = response.data.data || response.data;

        dispatch({ type: ACTIONS.UPDATE_SUCCESS, payload: transaction });

        // Dashboard-Daten aktualisieren
        await fetchDashboardData();

        return transaction;
      } catch (err) {
        const errorMsg = err.response?.data?.message || i18n.t('transactions.errors.update');
        dispatch({ type: ACTIONS.UPDATE_ERROR, payload: errorMsg });
        throw err;
      }
    },
    [dispatch, fetchDashboardData]
  );

  // ──────────────────────────────────────────────────────────────────────
  // DELETE - Remove transaction
  // ──────────────────────────────────────────────────────────────────────
  const deleteTransaction = useCallback(
    async (id) => {
      dispatch({ type: ACTIONS.DELETE_START });
      try {
        await transactionService.deleteTransaction(id);
        dispatch({ type: ACTIONS.DELETE_SUCCESS, payload: id });

        // Dashboard-Daten aktualisieren
        await fetchDashboardData();

        // Wenn aktuelle Seite leer wird, gehe zur vorherigen Seite
        if (state.transactions.length === 1 && state.pagination.page > 1) {
          setPage(state.pagination.page - 1);
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || i18n.t('transactions.errors.delete');
        dispatch({ type: ACTIONS.DELETE_ERROR, payload: errorMsg });
        throw err;
      }
    },
    [dispatch, fetchDashboardData, state.transactions.length, state.pagination.page, setPage]
  );

  return {
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
