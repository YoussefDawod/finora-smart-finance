/**
 * @fileoverview Transaction Reducer Tests
 * @description Tests für Transaction State Management inkl. Optimistic UI & Rollback
 */

import { describe, it, expect } from 'vitest';
import { transactionReducer, initialState, ACTIONS } from './transactionReducer';

// ============================================================================
// HELPERS
// ============================================================================
const tx1 = { id: 'tx-1', _id: 'tx-1', amount: 100, type: 'income', category: 'Gehalt' };
const tx2 = { id: 'tx-2', _id: 'tx-2', amount: 50, type: 'expense', category: 'Essen' };
const tx3 = { id: 'tx-3', _id: 'tx-3', amount: 200, type: 'expense', category: 'Miete' };

const stateWithTransactions = {
  ...initialState,
  transactions: [tx1, tx2, tx3],
  pagination: { page: 1, limit: 20, total: 3, pages: 1 },
  loading: false,
  dashboardLoading: false,
};

// ============================================================================
// INITIAL STATE
// ============================================================================
describe('transactionReducer', () => {
  describe('Initial State', () => {
    it('should have correct initial values', () => {
      expect(initialState.dashboardData).toBeNull();
      expect(initialState.transactions).toEqual([]);
      expect(initialState.pagination).toEqual({ page: 1, limit: 20, total: 0, pages: 0 });
      expect(initialState.loading).toBe(true);
      expect(initialState.dashboardLoading).toBe(true);
      expect(initialState.error).toBeNull();
      // Filter hat aktuelle Monatsgrenzen als Default
      expect(initialState.filter.type).toBeNull();
      expect(initialState.filter.category).toBeNull();
      expect(initialState.filter.searchQuery).toBe('');
      expect(initialState.filter.startDate).toBeTruthy();
      expect(initialState.filter.endDate).toBeTruthy();
      // Prüfe dass startDate mit YYYY-MM-01 endet (erster Tag des Monats)
      expect(initialState.filter.startDate).toMatch(/^\d{4}-\d{2}-01$/);
      expect(initialState.sortBy).toBe('date');
      expect(initialState.sortOrder).toBe('desc');
    });

    it('should have current month/year as dashboard defaults', () => {
      const now = new Date();
      expect(initialState.dashboardMonth).toBe(now.getMonth() + 1);
      expect(initialState.dashboardYear).toBe(now.getFullYear());
    });
  });

  // ============================================================================
  // DASHBOARD
  // ============================================================================
  describe('Dashboard Actions', () => {
    it('FETCH_DASHBOARD_START sets dashboardLoading and clears error', () => {
      const state = transactionReducer(
        { ...initialState, error: 'old error' },
        { type: ACTIONS.FETCH_DASHBOARD_START }
      );
      expect(state.dashboardLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('FETCH_DASHBOARD_SUCCESS sets dashboardData and stops loading', () => {
      const payload = { summary: { income: 1000 }, categoryBreakdown: [] };
      const state = transactionReducer(initialState, {
        type: ACTIONS.FETCH_DASHBOARD_SUCCESS,
        payload,
      });
      expect(state.dashboardData).toEqual(payload);
      expect(state.dashboardLoading).toBe(false);
    });

    it('FETCH_DASHBOARD_ERROR sets error and stops loading', () => {
      const state = transactionReducer(initialState, {
        type: ACTIONS.FETCH_DASHBOARD_ERROR,
        payload: 'Dashboard failed',
      });
      expect(state.error).toBe('Dashboard failed');
      expect(state.dashboardLoading).toBe(false);
    });

    it('SET_DASHBOARD_MONTH updates month, year and syncs filter dates', () => {
      const state = transactionReducer(initialState, {
        type: ACTIONS.SET_DASHBOARD_MONTH,
        payload: { month: 6, year: 2025 },
      });
      expect(state.dashboardMonth).toBe(6);
      expect(state.dashboardYear).toBe(2025);
      // Filter-Daten werden synchronisiert
      expect(state.filter.startDate).toBe('2025-06-01');
      expect(state.filter.endDate).toBe('2025-06-30');
      expect(state.pagination.page).toBe(1);
    });

    it('SET_DASHBOARD_MONTH with explicit dates uses those dates', () => {
      const state = transactionReducer(initialState, {
        type: ACTIONS.SET_DASHBOARD_MONTH,
        payload: { month: 2, year: 2025, startDate: '2025-01-01', endDate: '2025-12-31' },
      });
      expect(state.dashboardMonth).toBe(2);
      expect(state.dashboardYear).toBe(2025);
      expect(state.filter.startDate).toBe('2025-01-01');
      expect(state.filter.endDate).toBe('2025-12-31');
    });
  });

  // ============================================================================
  // TRANSAKTIONSLISTE
  // ============================================================================
  describe('Transaction List Actions', () => {
    it('FETCH_LIST_START sets loading and clears error', () => {
      const state = transactionReducer(
        { ...initialState, error: 'old', loading: false },
        { type: ACTIONS.FETCH_LIST_START }
      );
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('FETCH_LIST_SUCCESS sets transactions and pagination', () => {
      const payload = {
        data: [tx1, tx2],
        pagination: { page: 2, limit: 10, total: 20, pages: 2 },
      };
      const state = transactionReducer(initialState, {
        type: ACTIONS.FETCH_LIST_SUCCESS,
        payload,
      });
      expect(state.transactions).toEqual([tx1, tx2]);
      expect(state.pagination).toEqual(payload.pagination);
      expect(state.loading).toBe(false);
    });

    it('FETCH_LIST_ERROR sets error and stops loading', () => {
      const state = transactionReducer(initialState, {
        type: ACTIONS.FETCH_LIST_ERROR,
        payload: 'List failed',
      });
      expect(state.error).toBe('List failed');
      expect(state.loading).toBe(false);
    });
  });

  // ============================================================================
  // PAGINATION
  // ============================================================================
  describe('Pagination Actions', () => {
    it('SET_PAGE updates current page', () => {
      const state = transactionReducer(stateWithTransactions, {
        type: ACTIONS.SET_PAGE,
        payload: 3,
      });
      expect(state.pagination.page).toBe(3);
      expect(state.pagination.limit).toBe(20); // unchanged
    });

    it('SET_LIMIT updates limit and resets page to 1', () => {
      const base = {
        ...stateWithTransactions,
        pagination: { ...stateWithTransactions.pagination, page: 5 },
      };
      const state = transactionReducer(base, {
        type: ACTIONS.SET_LIMIT,
        payload: 50,
      });
      expect(state.pagination.limit).toBe(50);
      expect(state.pagination.page).toBe(1);
    });
  });

  // ============================================================================
  // CREATE (Optimistic UI)
  // ============================================================================
  describe('Create Actions (Optimistic UI)', () => {
    it('CREATE_START clears error', () => {
      const state = transactionReducer(
        { ...stateWithTransactions, error: 'old' },
        { type: ACTIONS.CREATE_START }
      );
      expect(state.error).toBeNull();
    });

    it('CREATE_OPTIMISTIC prepends temp transaction and increments total', () => {
      const tempTx = { _tempId: 'temp-1', amount: 300, type: 'income' };
      const state = transactionReducer(stateWithTransactions, {
        type: ACTIONS.CREATE_OPTIMISTIC,
        payload: tempTx,
      });
      expect(state.transactions[0]._tempId).toBe('temp-1');
      expect(state.transactions[0]._pending).toBe('create');
      expect(state.transactions.length).toBe(4);
      expect(state.pagination.total).toBe(4);
    });

    it('CREATE_SUCCESS replaces temp transaction with server response', () => {
      const withTemp = {
        ...stateWithTransactions,
        transactions: [
          { _tempId: 'temp-1', amount: 300, _pending: 'create' },
          ...stateWithTransactions.transactions,
        ],
      };
      const serverTx = { id: 'real-1', _id: 'real-1', amount: 300, type: 'income' };
      const state = transactionReducer(withTemp, {
        type: ACTIONS.CREATE_SUCCESS,
        payload: { tempId: 'temp-1', transaction: serverTx },
      });
      const replaced = state.transactions[0];
      expect(replaced.id).toBe('real-1');
      expect(replaced._pending).toBeUndefined();
      expect(replaced._tempId).toBeUndefined();
      expect(state.loading).toBe(false);
      expect(state.pagination.page).toBe(1);
    });

    it('CREATE_ROLLBACK removes temp transaction and decrements total', () => {
      const withTemp = {
        ...stateWithTransactions,
        transactions: [
          { _tempId: 'temp-1', _pending: 'create' },
          ...stateWithTransactions.transactions,
        ],
        pagination: { ...stateWithTransactions.pagination, total: 4 },
      };
      const state = transactionReducer(withTemp, {
        type: ACTIONS.CREATE_ROLLBACK,
        payload: { tempId: 'temp-1', error: 'Server error' },
      });
      expect(state.transactions.length).toBe(3);
      expect(state.transactions.find((t) => t._tempId === 'temp-1')).toBeUndefined();
      expect(state.pagination.total).toBe(3);
      expect(state.error).toBe('Server error');
    });

    it('CREATE_ROLLBACK total cannot go below 0', () => {
      const base = {
        ...stateWithTransactions,
        transactions: [{ _tempId: 'temp-1', _pending: 'create' }],
        pagination: { ...stateWithTransactions.pagination, total: 0 },
      };
      const state = transactionReducer(base, {
        type: ACTIONS.CREATE_ROLLBACK,
        payload: { tempId: 'temp-1', error: 'err' },
      });
      expect(state.pagination.total).toBe(0);
    });

    it('CREATE_ERROR sets error and stops loading', () => {
      const state = transactionReducer(stateWithTransactions, {
        type: ACTIONS.CREATE_ERROR,
        payload: 'Create failed',
      });
      expect(state.error).toBe('Create failed');
      expect(state.loading).toBe(false);
    });
  });

  // ============================================================================
  // UPDATE (Optimistic UI)
  // ============================================================================
  describe('Update Actions (Optimistic UI)', () => {
    it('UPDATE_START clears error', () => {
      const state = transactionReducer(
        { ...stateWithTransactions, error: 'old' },
        { type: ACTIONS.UPDATE_START }
      );
      expect(state.error).toBeNull();
    });

    it('UPDATE_OPTIMISTIC marks transaction pending and stores original', () => {
      const state = transactionReducer(stateWithTransactions, {
        type: ACTIONS.UPDATE_OPTIMISTIC,
        payload: { id: 'tx-1', newData: { id: 'tx-1', amount: 999, type: 'income' } },
      });
      // Payload.newData replaces the matched transaction
      const updated = state.transactions.find((t) => t.id === 'tx-1');
      expect(updated._pending).toBe('update');
      expect(updated._originalData).toEqual(tx1);
    });

    it('UPDATE_SUCCESS replaces transaction with server response', () => {
      const withPending = {
        ...stateWithTransactions,
        transactions: stateWithTransactions.transactions.map((t) =>
          t.id === 'tx-1' ? { ...t, amount: 999, _pending: 'update', _originalData: tx1 } : t
        ),
      };
      const serverTx = { id: 'tx-1', _id: 'tx-1', amount: 999, type: 'income' };
      const state = transactionReducer(withPending, {
        type: ACTIONS.UPDATE_SUCCESS,
        payload: serverTx,
      });
      const updated = state.transactions.find((t) => t.id === 'tx-1');
      expect(updated.amount).toBe(999);
      expect(updated._pending).toBeUndefined();
      expect(updated._originalData).toBeUndefined();
    });

    it('UPDATE_ROLLBACK restores original data', () => {
      const withPending = {
        ...stateWithTransactions,
        transactions: stateWithTransactions.transactions.map((t) =>
          t.id === 'tx-2'
            ? { ...t, amount: 999, _pending: 'update', _originalData: { ...tx2 } }
            : t
        ),
      };
      const state = transactionReducer(withPending, {
        type: ACTIONS.UPDATE_ROLLBACK,
        payload: { id: 'tx-2', error: 'Update failed' },
      });
      const restored = state.transactions.find((t) => t.id === 'tx-2');
      expect(restored.amount).toBe(50); // Original value
      expect(restored._pending).toBeUndefined();
      expect(restored._originalData).toBeUndefined();
      expect(state.error).toBe('Update failed');
    });

    it('UPDATE_ERROR sets error', () => {
      const state = transactionReducer(stateWithTransactions, {
        type: ACTIONS.UPDATE_ERROR,
        payload: 'Update error',
      });
      expect(state.error).toBe('Update error');
      expect(state.loading).toBe(false);
    });
  });

  // ============================================================================
  // DELETE (Optimistic UI)
  // ============================================================================
  describe('Delete Actions (Optimistic UI)', () => {
    it('DELETE_START clears error', () => {
      const state = transactionReducer(
        { ...stateWithTransactions, error: 'old' },
        { type: ACTIONS.DELETE_START }
      );
      expect(state.error).toBeNull();
    });

    it('DELETE_OPTIMISTIC marks transaction as pending delete', () => {
      const state = transactionReducer(stateWithTransactions, {
        type: ACTIONS.DELETE_OPTIMISTIC,
        payload: 'tx-2',
      });
      const deleted = state.transactions.find((t) => t.id === 'tx-2');
      expect(deleted._pending).toBe('delete');
    });

    it('DELETE_SUCCESS removes transaction and decrements total', () => {
      const state = transactionReducer(stateWithTransactions, {
        type: ACTIONS.DELETE_SUCCESS,
        payload: 'tx-2',
      });
      expect(state.transactions.find((t) => t.id === 'tx-2')).toBeUndefined();
      expect(state.transactions.length).toBe(2);
      expect(state.pagination.total).toBe(2);
    });

    it('DELETE_SUCCESS total cannot go below 0', () => {
      const base = {
        ...stateWithTransactions,
        transactions: [tx1],
        pagination: { ...stateWithTransactions.pagination, total: 0 },
      };
      const state = transactionReducer(base, {
        type: ACTIONS.DELETE_SUCCESS,
        payload: 'tx-1',
      });
      expect(state.pagination.total).toBe(0);
    });

    it('DELETE_ROLLBACK restores pending flag', () => {
      const withPending = {
        ...stateWithTransactions,
        transactions: stateWithTransactions.transactions.map((t) =>
          t.id === 'tx-3' ? { ...t, _pending: 'delete' } : t
        ),
      };
      const state = transactionReducer(withPending, {
        type: ACTIONS.DELETE_ROLLBACK,
        payload: { id: 'tx-3', error: 'Delete failed' },
      });
      const restored = state.transactions.find((t) => t.id === 'tx-3');
      expect(restored._pending).toBeUndefined();
      expect(state.error).toBe('Delete failed');
    });

    it('DELETE_ERROR sets error', () => {
      const state = transactionReducer(stateWithTransactions, {
        type: ACTIONS.DELETE_ERROR,
        payload: 'Delete error',
      });
      expect(state.error).toBe('Delete error');
      expect(state.loading).toBe(false);
    });
  });

  // ============================================================================
  // FILTER & SORT
  // ============================================================================
  describe('Filter & Sort Actions', () => {
    it('SET_FILTER merges filter and resets page to 1', () => {
      const base = {
        ...stateWithTransactions,
        pagination: { ...stateWithTransactions.pagination, page: 3 },
      };
      const state = transactionReducer(base, {
        type: ACTIONS.SET_FILTER,
        payload: { type: 'income', category: 'Gehalt' },
      });
      expect(state.filter.type).toBe('income');
      expect(state.filter.category).toBe('Gehalt');
      // Unchanged filters stay
      expect(state.filter.searchQuery).toBe('');
      expect(state.pagination.page).toBe(1);
    });

    it('SET_SORT updates sort and resets page to 1', () => {
      const base = {
        ...stateWithTransactions,
        pagination: { ...stateWithTransactions.pagination, page: 5 },
      };
      const state = transactionReducer(base, {
        type: ACTIONS.SET_SORT,
        payload: { sortBy: 'amount', sortOrder: 'asc' },
      });
      expect(state.sortBy).toBe('amount');
      expect(state.sortOrder).toBe('asc');
      expect(state.pagination.page).toBe(1);
    });

    it('CLEAR_FILTER resets filter, sort, and page to current month defaults', () => {
      const modified = {
        ...stateWithTransactions,
        filter: { type: 'income', category: 'Gehalt', startDate: '2025-01-01', endDate: '2025-12-31', searchQuery: 'test' },
        sortBy: 'amount',
        sortOrder: 'asc',
        dashboardMonth: 6,
        dashboardYear: 2025,
        pagination: { ...stateWithTransactions.pagination, page: 4 },
      };
      const state = transactionReducer(modified, { type: ACTIONS.CLEAR_FILTER });
      expect(state.filter.type).toBeNull();
      expect(state.filter.category).toBeNull();
      expect(state.filter.searchQuery).toBe('');
      // Dates reset to current month (not null)
      expect(state.filter.startDate).toBeTruthy();
      expect(state.filter.endDate).toBeTruthy();
      // Dashboard month/year reset to current
      const now = new Date();
      expect(state.dashboardMonth).toBe(now.getMonth() + 1);
      expect(state.dashboardYear).toBe(now.getFullYear());
      expect(state.sortBy).toBe(initialState.sortBy);
      expect(state.sortOrder).toBe(initialState.sortOrder);
      expect(state.pagination.page).toBe(1);
    });

    it('SET_FILTER with startDate syncs dashboardMonth/Year', () => {
      const state = transactionReducer(initialState, {
        type: ACTIONS.SET_FILTER,
        payload: { startDate: '2025-03-15' },
      });
      expect(state.filter.startDate).toBe('2025-03-15');
      expect(state.dashboardMonth).toBe(3);
      expect(state.dashboardYear).toBe(2025);
    });
  });

  // ============================================================================
  // ERROR
  // ============================================================================
  describe('Error Handling', () => {
    it('CLEAR_ERROR resets error to null', () => {
      const state = transactionReducer(
        { ...initialState, error: 'Something went wrong' },
        { type: ACTIONS.CLEAR_ERROR }
      );
      expect(state.error).toBeNull();
    });
  });

  // ============================================================================
  // DEFAULT
  // ============================================================================
  describe('Default Case', () => {
    it('returns current state for unknown action', () => {
      const state = transactionReducer(stateWithTransactions, {
        type: 'UNKNOWN_ACTION',
      });
      expect(state).toBe(stateWithTransactions);
    });
  });

  // ============================================================================
  // ACTION TYPES COMPLETENESS
  // ============================================================================
  describe('ACTIONS constant', () => {
    it('should export all 28 action types', () => {
      expect(Object.keys(ACTIONS).length).toBe(28);
    });

    it('each action type value should match its key', () => {
      for (const [key, value] of Object.entries(ACTIONS)) {
        expect(value).toBe(key);
      }
    });
  });
});
