/**
 * TransactionContext - Refactored
 * Schlanker Context Provider mit extrahierten Hooks und Reducer
 * Unterstützt sowohl API-Modus (angemeldet) als auch localStorage-Modus (nicht angemeldet)
 */

import { createContext, useReducer, useEffect, useContext, useRef, useMemo, useCallback, useState } from 'react';
import { AuthContext } from './AuthContext';
import { transactionReducer, initialState } from './reducers/transactionReducer';
import { useTransactionFetch } from './hooks/useTransactionFetch';
import { useTransactionActions } from './hooks/useTransactionActions';
import { useTransactionFilters } from './hooks/useTransactionFilters';
import { useTransactionPagination } from './hooks/useTransactionPagination';
import {
  getFilteredLocalTransactions,
  computeLocalDashboardData,
  createLocalTransaction,
  updateLocalTransaction,
  deleteLocalTransaction,
  initLocalSession,
  clearGuestTransactions,
} from '@/utils/localTransactionStorage';

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

  // Local-mode refresh counter (triggers re-render when localStorage changes)
  const [localRefresh, setLocalRefresh] = useState(0);
  const triggerLocalRefresh = useCallback(() => setLocalRefresh((c) => c + 1), []);

  // Session-Check: Bei neuer Tab-Session lokale Transaktionen löschen
  useEffect(() => {
    if (!isAuthenticated) {
      initLocalSession();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ──────────────────────────────────────────────────────────────────────
  // CLEANUP Guest-Daten beim Logout
  // ──────────────────────────────────────────────────────────────────────
  const prevAuthRef = useRef(isAuthenticated);
  useEffect(() => {
    // Wenn User sich ausloggt (isAuthenticated: true → false)
    if (prevAuthRef.current === true && isAuthenticated === false) {
      clearGuestTransactions();
      triggerLocalRefresh(); // Trigger re-render to show empty state
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, triggerLocalRefresh]);

  // ──────────────────────────────────────────────────────────────────────
  // HOOKS
  // ──────────────────────────────────────────────────────────────────────

  // Fetch Operations (API mode only)
  const { fetchDashboardData, fetchTransactions } = useTransactionFetch(dispatch, state);

  // Pagination
  const { setPage, setLimit, nextPage, prevPage } = useTransactionPagination(dispatch, state.pagination);

  // Filter & Sort
  const { setDashboardMonth, setFilter, setSort, clearFilter, clearError } = useTransactionFilters(dispatch);

  // CRUD Actions (API mode)
  const { createTransaction: apiCreate, updateTransaction: apiUpdate, deleteTransaction: apiDelete } = useTransactionActions(dispatch, state, {
    isAuthenticated,
    fetchDashboardData,
    fetchTransactions,
    setPage,
  });

  // ──────────────────────────────────────────────────────────────────────
  // LOCAL MODE: localStorage-basierte CRUD
  // ──────────────────────────────────────────────────────────────────────
  const localCreate = useCallback(async (data) => {
    const tx = createLocalTransaction(data);
    triggerLocalRefresh();
    return tx;
  }, [triggerLocalRefresh]);

  const localUpdate = useCallback(async (id, data) => {
    const tx = updateLocalTransaction(id, data);
    triggerLocalRefresh();
    return tx;
  }, [triggerLocalRefresh]);

  const localDelete = useCallback(async (id) => {
    deleteLocalTransaction(id);
    triggerLocalRefresh();
  }, [triggerLocalRefresh]);

  // ──────────────────────────────────────────────────────────────────────
  // LOCAL MODE: Dashboard + Transaktionsdaten aus localStorage
  // ──────────────────────────────────────────────────────────────────────
  const localData = useMemo(() => {
    if (isAuthenticated) return null;
    // localRefresh is used as dependency to trigger recalculation
    void localRefresh;
    const dashboard = computeLocalDashboardData(state.dashboardMonth, state.dashboardYear);
    const { data, pagination } = getFilteredLocalTransactions({
      filter: state.filter,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder,
      page: state.pagination.page,
      limit: state.pagination.limit,
    });
    return { dashboard, transactions: data, pagination };
  }, [isAuthenticated, localRefresh, state.dashboardMonth, state.dashboardYear, state.filter, state.sortBy, state.sortOrder, state.pagination.page, state.pagination.limit]);

  // ──────────────────────────────────────────────────────────────────────
  // EFFECTS (API mode only)
  // ──────────────────────────────────────────────────────────────────────

  // 1. Bei Login: Dashboard-Daten und Transaktionen initial laden
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData();
      fetchTransactions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  // 2. Bei Dashboard-Monat Änderung: Dashboard-Daten neu laden
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (isInitialMount.current) return;
    fetchDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.dashboardMonth, state.dashboardYear, isAuthenticated, user]);

  // 3. Bei Filter/Sort/Page-Änderung: Transaktionen neu laden
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchTransactions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isAuthenticated,
    user,
    state.filter,
    state.sortBy,
    state.sortOrder,
    state.pagination.page,
    state.pagination.limit,
  ]);

  // ──────────────────────────────────────────────────────────────────────
  // CONTEXT VALUE
  // ──────────────────────────────────────────────────────────────────────
  const isLocal = !isAuthenticated;

  const value = {
    // State
    state,
    isLocal,

    // Dashboard-Daten (aggregiert)
    dashboardData: isLocal ? localData?.dashboard : state.dashboardData,
    dashboardLoading: isLocal ? false : state.dashboardLoading,
    dashboardMonth: state.dashboardMonth,
    dashboardYear: state.dashboardYear,

    // Transaktionsliste (paginiert)
    transactions: isLocal ? (localData?.transactions || []) : state.transactions,

    // Pagination
    pagination: isLocal ? (localData?.pagination || initialState.pagination) : state.pagination,
    currentPage: isLocal ? (localData?.pagination?.page || 1) : state.pagination.page,
    totalPages: isLocal ? (localData?.pagination?.pages || 1) : state.pagination.pages,
    totalItems: isLocal ? (localData?.pagination?.total || 0) : state.pagination.total,
    pageSize: isLocal ? (localData?.pagination?.limit || 20) : state.pagination.limit,

    // Loading & Error
    loading: isLocal ? false : state.loading,
    error: isLocal ? null : state.error,

    // Filter & Sort
    filter: state.filter,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,

    // Fetch Methods
    fetchDashboardData: isLocal ? triggerLocalRefresh : fetchDashboardData,
    fetchTransactions: isLocal ? triggerLocalRefresh : fetchTransactions,

    // CRUD Methods
    createTransaction: isLocal ? localCreate : apiCreate,
    updateTransaction: isLocal ? localUpdate : apiUpdate,
    deleteTransaction: isLocal ? localDelete : apiDelete,

    // Pagination Controls
    setPage,
    setLimit,
    nextPage,
    prevPage,

    // Dashboard Month Controls
    setDashboardMonth,

    // Filter & Sort Controls
    setFilter,
    setSort,
    clearFilter,
    clearError,

    // Legacy compatibility
    filteredTransactions: isLocal ? (localData?.transactions || []) : state.transactions,
    allTransactions: isLocal
      ? (localData?.dashboard?.recentTransactions || [])
      : (state.dashboardData?.recentTransactions || []),
  };

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
}

export { TransactionContext, TransactionProvider };
