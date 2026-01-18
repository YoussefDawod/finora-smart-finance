import { createContext, useCallback, useEffect, useReducer, useContext } from 'react';
import { transactionService } from '../api';
import { AuthContext } from './AuthContext';

// ============================================================================
// CONTEXT ERSTELLEN
// ============================================================================
const TransactionContext = createContext();

// ============================================================================
// INITIAL STATE
// ============================================================================
const initialState = {
  transactions: [],
  loading: false,
  error: null,
  filter: {
    type: null, // 'income' | 'expense' | null
    category: null,
    startDate: null,
    endDate: null,
    searchQuery: '',
  },
  sortBy: 'date', // 'date' | 'amount'
  sortOrder: 'desc', // 'asc' | 'desc'
};

// ============================================================================
// ACTIONS
// ============================================================================
const ACTIONS = {
  // Fetch
  FETCH_START: 'FETCH_START',
  FETCH_SUCCESS: 'FETCH_SUCCESS',
  FETCH_ERROR: 'FETCH_ERROR',

  // Create
  CREATE_START: 'CREATE_START',
  CREATE_SUCCESS: 'CREATE_SUCCESS',
  CREATE_ERROR: 'CREATE_ERROR',

  // Update
  UPDATE_START: 'UPDATE_START',
  UPDATE_SUCCESS: 'UPDATE_SUCCESS',
  UPDATE_ERROR: 'UPDATE_ERROR',

  // Delete
  DELETE_START: 'DELETE_START',
  DELETE_SUCCESS: 'DELETE_SUCCESS',
  DELETE_ERROR: 'DELETE_ERROR',

  // Filter & Sort
  SET_FILTER: 'SET_FILTER',
  SET_SORT: 'SET_SORT',
  CLEAR_FILTER: 'CLEAR_FILTER',

  // Error Handling
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// ============================================================================
// REDUCER
// ============================================================================
const transactionReducer = (state, action) => {
  switch (action.type) {
    // ────────────────────────────────────────────────────────────────────
    // FETCH (List)
    // ────────────────────────────────────────────────────────────────────
    case ACTIONS.FETCH_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case ACTIONS.FETCH_SUCCESS:
      return {
        ...state,
        transactions: action.payload,
        loading: false,
        error: null,
      };

    case ACTIONS.FETCH_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // ────────────────────────────────────────────────────────────────────
    // CREATE
    // ────────────────────────────────────────────────────────────────────
    case ACTIONS.CREATE_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case ACTIONS.CREATE_SUCCESS:
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
        loading: false,
        error: null,
      };

    case ACTIONS.CREATE_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // ────────────────────────────────────────────────────────────────────
    // UPDATE
    // ────────────────────────────────────────────────────────────────────
    case ACTIONS.UPDATE_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case ACTIONS.UPDATE_SUCCESS:
      return {
        ...state,
        transactions: state.transactions.map((tx) =>
          tx.id === action.payload.id ? action.payload : tx
        ),
        loading: false,
        error: null,
      };

    case ACTIONS.UPDATE_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // ────────────────────────────────────────────────────────────────────
    // DELETE
    // ────────────────────────────────────────────────────────────────────
    case ACTIONS.DELETE_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case ACTIONS.DELETE_SUCCESS:
      return {
        ...state,
        transactions: state.transactions.filter(
          (tx) => tx.id !== action.payload
        ),
        loading: false,
        error: null,
      };

    case ACTIONS.DELETE_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // ────────────────────────────────────────────────────────────────────
    // FILTER & SORT
    // ────────────────────────────────────────────────────────────────────
    case ACTIONS.SET_FILTER:
      return {
        ...state,
        filter: {
          ...state.filter,
          ...action.payload,
        },
      };

    case ACTIONS.SET_SORT:
      return {
        ...state,
        sortBy: action.payload.sortBy,
        sortOrder: action.payload.sortOrder,
      };

    case ACTIONS.CLEAR_FILTER:
      return {
        ...state,
        filter: initialState.filter,
        sortBy: initialState.sortBy,
        sortOrder: initialState.sortOrder,
      };

    // ────────────────────────────────────────────────────────────────────
    // ERROR
    // ────────────────────────────────────────────────────────────────────
    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// ============================================================================
// PROVIDER KOMPONENTE
// ============================================================================
const TransactionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(transactionReducer, initialState);
  
  // Get auth context to check if user is authenticated
  const authContext = useContext(AuthContext);
  const isAuthenticated = authContext?.isAuthenticated || false;
  const user = authContext?.user;

  // ──────────────────────────────────────────────────────────────────────
  // FETCH TRANSACTIONS (nur wenn user authentifiziert ist)
  // ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  // ──────────────────────────────────────────────────────────────────────
  // FETCH - Get all transactions
  // ──────────────────────────────────────────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    // Skip if not authenticated
    if (!isAuthenticated) {
      dispatch({ type: ACTIONS.FETCH_SUCCESS, payload: [] });
      return;
    }

    dispatch({ type: ACTIONS.FETCH_START });
    try {
      const response = await transactionService.getTransactions();
      dispatch({
        type: ACTIONS.FETCH_SUCCESS,
        payload: response.data.data || [],
      });
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Fehler beim Laden der Transaktionen';
      dispatch({
        type: ACTIONS.FETCH_ERROR,
        payload: errorMsg,
      });
      console.error('Fetch transactions error:', err);
    }
  }, [isAuthenticated]);

  // ──────────────────────────────────────────────────────────────────────
  // CREATE - Add new transaction
  // ──────────────────────────────────────────────────────────────────────
  const createTransaction = useCallback(async (transactionData) => {
    dispatch({ type: ACTIONS.CREATE_START });
    try {
      const response = await transactionService.createTransaction(
        transactionData
      );
      // API returns { success: true, data: transaction, message: string }
      // So we need to extract response.data.data
      const transaction = response.data.data || response.data;
      
      dispatch({
        type: ACTIONS.CREATE_SUCCESS,
        payload: transaction,
      });
      return transaction;
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Fehler beim Erstellen der Transaktion';
      dispatch({
        type: ACTIONS.CREATE_ERROR,
        payload: errorMsg,
      });
      throw err;
    }
  }, []);

  // ──────────────────────────────────────────────────────────────────────
  // UPDATE - Edit transaction
  // ──────────────────────────────────────────────────────────────────────
  const updateTransaction = useCallback(async (id, transactionData) => {
    dispatch({ type: ACTIONS.UPDATE_START });
    try {
      const response = await transactionService.updateTransaction(
        id,
        transactionData
      );
      // API returns { success: true, data: transaction, message: string }
      // So we need to extract response.data.data
      const transaction = response.data.data || response.data;
      dispatch({
        type: ACTIONS.UPDATE_SUCCESS,
        payload: transaction,
      });
      return transaction;
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        'Fehler beim Aktualisieren der Transaktion';
      dispatch({
        type: ACTIONS.UPDATE_ERROR,
        payload: errorMsg,
      });
      throw err;
    }
  }, []);

  // ──────────────────────────────────────────────────────────────────────
  // DELETE - Remove transaction
  // ──────────────────────────────────────────────────────────────────────
  const deleteTransaction = useCallback(async (id) => {
    dispatch({ type: ACTIONS.DELETE_START });
    try {
      await transactionService.deleteTransaction(id);
      dispatch({
        type: ACTIONS.DELETE_SUCCESS,
        payload: id,
      });
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Fehler beim Löschen der Transaktion';
      dispatch({
        type: ACTIONS.DELETE_ERROR,
        payload: errorMsg,
      });
      throw err;
    }
  }, []);

  // ──────────────────────────────────────────────────────────────────────
  // FILTER - Set filter options
  // ──────────────────────────────────────────────────────────────────────
  const setFilter = useCallback((filterOptions) => {
    dispatch({
      type: ACTIONS.SET_FILTER,
      payload: filterOptions,
    });
  }, []);

  // ──────────────────────────────────────────────────────────────────────
  // SORT - Set sort options
  // ──────────────────────────────────────────────────────────────────────
  const setSort = useCallback((sortBy, sortOrder) => {
    dispatch({
      type: ACTIONS.SET_SORT,
      payload: { sortBy, sortOrder },
    });
  }, []);

  // ──────────────────────────────────────────────────────────────────────
  // CLEAR FILTER - Reset all filters
  // ──────────────────────────────────────────────────────────────────────
  const clearFilter = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_FILTER });
  }, []);

  // ──────────────────────────────────────────────────────────────────────
  // CLEAR ERROR - Clear error message
  // ──────────────────────────────────────────────────────────────────────
  const clearError = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
  }, []);

  // ──────────────────────────────────────────────────────────────────────
  // GET FILTERED TRANSACTIONS
  // ──────────────────────────────────────────────────────────────────────
  const getFilteredTransactions = useCallback(() => {
    let filtered = [...state.transactions];

    // Filter by type (income/expense)
    if (state.filter.type) {
      filtered = filtered.filter((tx) => tx.type === state.filter.type);
    }

    // Filter by category
    if (state.filter.category) {
      filtered = filtered.filter((tx) => tx.category === state.filter.category);
    }

    // Filter by date range
    if (state.filter.startDate) {
      filtered = filtered.filter(
        (tx) => new Date(tx.date) >= new Date(state.filter.startDate)
      );
    }
    if (state.filter.endDate) {
      filtered = filtered.filter(
        (tx) => new Date(tx.date) <= new Date(state.filter.endDate)
      );
    }

    // Filter by search query
    const rawQuery = state.filter.searchQuery || '';
    const query = rawQuery.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((tx) => {
        const description = String(tx.description || '').toLowerCase();
        const category = String(tx.category || '').toLowerCase();
        const notes = String(tx.notes || '').toLowerCase();
        const tags = Array.isArray(tx.tags) ? tx.tags.join(' ').toLowerCase() : '';
        return (
          description.includes(query) ||
          category.includes(query) ||
          notes.includes(query) ||
          tags.includes(query)
        );
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[state.sortBy];
      let bVal = b[state.sortBy];

      if (state.sortBy === 'date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (state.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [state.transactions, state.filter, state.sortBy, state.sortOrder]);

  // ──────────────────────────────────────────────────────────────────────
  // CONTEXT VALUE
  // ──────────────────────────────────────────────────────────────────────
  const value = {
    // State
    state,
    transactions: state.transactions,
    filteredTransactions: getFilteredTransactions(),
    loading: state.loading,
    error: state.error,
    filter: state.filter,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,

    // Methods
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    setFilter,
    setSort,
    clearFilter,
    clearError,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

export { TransactionContext, TransactionProvider };
