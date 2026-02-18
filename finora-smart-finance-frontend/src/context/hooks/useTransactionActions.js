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
 * @param {Object} options - { isAuthenticated, fetchDashboardData, fetchTransactions, setPage }
 */
export function useTransactionActions(dispatch, state, { isAuthenticated, fetchDashboardData, fetchTransactions, setPage }) {
  // ──────────────────────────────────────────────────────────────────────
  // CREATE - Add new transaction (mit Optimistic UI)
  // ──────────────────────────────────────────────────────────────────────
  const createTransaction = useCallback(
    async (transactionData) => {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      
      dispatch({ type: ACTIONS.CREATE_START });
      
      // Optimistische UI-Aktualisierung: Zeige Transaktion sofort
      dispatch({ 
        type: ACTIONS.CREATE_OPTIMISTIC, 
        payload: { 
          ...transactionData, 
          _tempId: tempId,
          id: tempId, // Temporäre ID für UI
          createdAt: new Date().toISOString(),
        } 
      });

      try {
        const response = await transactionService.createTransaction(transactionData);
        const transaction = response.data.data || response.data;

        // 🔒 RACE CONDITION FIX: Prüfe ob User immer noch authenticated ist
        // Wenn User während API-Call ausgeloggt hat, ignoriere Response
        if (!isAuthenticated) {
          globalThis.console?.warn('User logged out during transaction creation - ignoring response');
          dispatch({ 
            type: ACTIONS.CREATE_ROLLBACK, 
            payload: { tempId, error: 'User logged out' } 
          });
          return null;
        }

        dispatch({ 
          type: ACTIONS.CREATE_SUCCESS, 
          payload: { transaction, tempId } 
        });

        // Dashboard-Daten aktualisieren (im Hintergrund)
        fetchDashboardData();

        return transaction;
      } catch (err) {
        const errorMsg = err.response?.data?.message || i18n.t('transactions.errors.create');
        // Rollback: Temporäre Transaktion entfernen
        dispatch({ 
          type: ACTIONS.CREATE_ROLLBACK, 
          payload: { tempId, error: errorMsg } 
        });
        throw err;
      }
    },
    [dispatch, fetchDashboardData, isAuthenticated]
  );

  // ──────────────────────────────────────────────────────────────────────
  // UPDATE - Edit transaction (mit Optimistic UI)
  // ──────────────────────────────────────────────────────────────────────
  const updateTransaction = useCallback(
    async (id, transactionData) => {
      dispatch({ type: ACTIONS.UPDATE_START });
      
      // Optimistische UI-Aktualisierung: Zeige neue Werte sofort
      dispatch({ 
        type: ACTIONS.UPDATE_OPTIMISTIC, 
        payload: { id, newData: { ...transactionData, id } } 
      });

      try {
        const response = await transactionService.updateTransaction(id, transactionData);
        const transaction = response.data.data || response.data;

        // 🔒 RACE CONDITION FIX: Prüfe Auth-Status
        if (!isAuthenticated) {
          globalThis.console?.warn('User logged out during transaction update - ignoring response');
          dispatch({ 
            type: ACTIONS.UPDATE_ROLLBACK, 
            payload: { id, error: 'User logged out' } 
          });
          return null;
        }

        dispatch({ type: ACTIONS.UPDATE_SUCCESS, payload: transaction });

        // Dashboard-Daten aktualisieren (im Hintergrund)
        fetchDashboardData();

        return transaction;
      } catch (err) {
        const errorMsg = err.response?.data?.message || i18n.t('transactions.errors.update');
        // Rollback: Originalwerte wiederherstellen
        dispatch({ 
          type: ACTIONS.UPDATE_ROLLBACK, 
          payload: { id, error: errorMsg } 
        });
        throw err;
      }
    },
    [dispatch, fetchDashboardData, isAuthenticated]
  );

  // ──────────────────────────────────────────────────────────────────────
  // DELETE - Remove transaction (mit Optimistic UI)
  // ──────────────────────────────────────────────────────────────────────
  const deleteTransaction = useCallback(
    async (id) => {
      dispatch({ type: ACTIONS.DELETE_START });
      
      // Optimistische UI-Aktualisierung: Zeige sofort als "pending"
      dispatch({ type: ACTIONS.DELETE_OPTIMISTIC, payload: id });

      try {
        await transactionService.deleteTransaction(id);
        
        // 🔒 RACE CONDITION FIX: Prüfe Auth-Status
        if (!isAuthenticated) {
          globalThis.console?.warn('User logged out during transaction deletion - ignoring response');
          dispatch({ 
            type: ACTIONS.DELETE_ROLLBACK, 
            payload: { id, error: 'User logged out' } 
          });
          return;
        }
        
        dispatch({ type: ACTIONS.DELETE_SUCCESS, payload: id });

        // Dashboard-Daten aktualisieren
        await fetchDashboardData();

        // Wenn aktuelle Seite leer wird, gehe zur vorherigen Seite
        if (state.transactions.length === 1 && state.pagination.page > 1) {
          setPage(state.pagination.page - 1);
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || i18n.t('transactions.errors.delete');
        // Rollback: Transaktion wiederherstellen
        dispatch({ 
          type: ACTIONS.DELETE_ROLLBACK, 
          payload: { id, error: errorMsg } 
        });
        throw err;
      }
    },
    [dispatch, fetchDashboardData, isAuthenticated, state.transactions.length, state.pagination.page, setPage]
  );

  return {
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
