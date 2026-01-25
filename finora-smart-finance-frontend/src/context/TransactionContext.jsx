/**
 * TransactionContext - Refactored
 * Schlanker Context Provider mit extrahierten Hooks und Reducer
 */

import { createContext, useReducer, useEffect, useContext, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { transactionReducer, initialState } from './reducers/transactionReducer';
import { useTransactionFetch } from './hooks/useTransactionFetch';
import { useTransactionActions } from './hooks/useTransactionActions';
import { useTransactionFilters } from './hooks/useTransactionFilters';
import { useTransactionPagination } from './hooks/useTransactionPagination';

// ============================================================================
// CONTEXT
// ============================================================================
const TransactionContext = createContext();

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================
function TransactionProvider({ children }) {
  const [state, dispatch] = useReducer(transactionReducer, initialState);
  const isInitialMount = useRef(true);

  // Auth Context
  const authContext = useContext(AuthContext);
  const isAuthenticated = authContext?.isAuthenticated || false;
  const user = authContext?.user;

  // ──────────────────────────────────────────────────────────────────────
  // HOOKS
  // ──────────────────────────────────────────────────────────────────────

  // Fetch Operations
  const { fetchDashboardData, fetchTransactions } = useTransactionFetch(dispatch, state, isAuthenticated);

  // Pagination
  const { setPage, setLimit, nextPage, prevPage } = useTransactionPagination(dispatch, state.pagination);

  // Filter & Sort
  const { setFilter, setSort, clearFilter, clearError } = useTransactionFilters(dispatch);

  // CRUD Actions (depends on fetch & pagination)
  const { createTransaction, updateTransaction, deleteTransaction } = useTransactionActions(dispatch, state, {
    isAuthenticated,
    fetchDashboardData,
    fetchTransactions,
    setPage,
  });

  // ──────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ──────────────────────────────────────────────────────────────────────

  // 1. Bei Login: Dashboard-Daten laden
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user, fetchDashboardData]);

  // 2. Bei Filter/Sort/Page-Änderung: Transaktionen neu laden
  useEffect(() => {
    if (isAuthenticated && user) {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        fetchTransactions();
        return;
      }
      fetchTransactions();
    }
  }, [
    isAuthenticated,
    user,
    state.filter,
    state.sortBy,
    state.sortOrder,
    state.pagination.page,
    state.pagination.limit,
    fetchTransactions,
  ]);

  // ──────────────────────────────────────────────────────────────────────
  // CONTEXT VALUE
  // ──────────────────────────────────────────────────────────────────────
  const value = {
    // State
    state,

    // Dashboard-Daten (aggregiert)
    dashboardData: state.dashboardData,
    dashboardLoading: state.dashboardLoading,

    // Transaktionsliste (paginiert)
    transactions: state.transactions,

    // Pagination
    pagination: state.pagination,
    currentPage: state.pagination.page,
    totalPages: state.pagination.pages,
    totalItems: state.pagination.total,
    pageSize: state.pagination.limit,

    // Loading & Error
    loading: state.loading,
    error: state.error,

    // Filter & Sort
    filter: state.filter,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,

    // Fetch Methods
    fetchDashboardData,
    fetchTransactions,

    // CRUD Methods
    createTransaction,
    updateTransaction,
    deleteTransaction,

    // Pagination Controls
    setPage,
    setLimit,
    nextPage,
    prevPage,

    // Filter & Sort Controls
    setFilter,
    setSort,
    clearFilter,
    clearError,

    // Legacy compatibility
    filteredTransactions: state.transactions,
    allTransactions: state.dashboardData?.recentTransactions || [],
  };

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
}

export { TransactionContext, TransactionProvider };
