/**
 * Transaction Reducer Module
 * Zentrale State-Management Logik für Transaktionen
 */

// ============================================================================
// INITIAL STATE
// ============================================================================
export const initialState = {
  // DASHBOARD-DATEN (aggregiert vom Server, keine vollständigen Transaktionen)
  dashboardData: null,

  // TRANSAKTIONSLISTE (paginiert vom Server)
  transactions: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },

  // Loading-States
  loading: false,
  dashboardLoading: false,

  error: null,

  // Filter für Transaktionsliste
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
// ACTION TYPES
// ============================================================================
export const ACTIONS = {
  // Dashboard (aggregierte Daten)
  FETCH_DASHBOARD_START: 'FETCH_DASHBOARD_START',
  FETCH_DASHBOARD_SUCCESS: 'FETCH_DASHBOARD_SUCCESS',
  FETCH_DASHBOARD_ERROR: 'FETCH_DASHBOARD_ERROR',

  // Transaktionsliste (paginiert)
  FETCH_LIST_START: 'FETCH_LIST_START',
  FETCH_LIST_SUCCESS: 'FETCH_LIST_SUCCESS',
  FETCH_LIST_ERROR: 'FETCH_LIST_ERROR',

  // Pagination
  SET_PAGE: 'SET_PAGE',
  SET_LIMIT: 'SET_LIMIT',

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
export function transactionReducer(state, action) {
  switch (action.type) {
    // ────────────────────────────────────────────────────────────────────
    // DASHBOARD (aggregierte Daten für Cards, Charts)
    // ────────────────────────────────────────────────────────────────────
    case ACTIONS.FETCH_DASHBOARD_START:
      return { ...state, dashboardLoading: true, error: null };

    case ACTIONS.FETCH_DASHBOARD_SUCCESS:
      return { ...state, dashboardData: action.payload, dashboardLoading: false };

    case ACTIONS.FETCH_DASHBOARD_ERROR:
      return { ...state, dashboardLoading: false, error: action.payload };

    // ────────────────────────────────────────────────────────────────────
    // TRANSAKTIONSLISTE (paginiert)
    // ────────────────────────────────────────────────────────────────────
    case ACTIONS.FETCH_LIST_START:
      return { ...state, loading: true, error: null };

    case ACTIONS.FETCH_LIST_SUCCESS:
      return {
        ...state,
        transactions: action.payload.data,
        pagination: action.payload.pagination,
        loading: false,
      };

    case ACTIONS.FETCH_LIST_ERROR:
      return { ...state, loading: false, error: action.payload };

    // ────────────────────────────────────────────────────────────────────
    // PAGINATION
    // ────────────────────────────────────────────────────────────────────
    case ACTIONS.SET_PAGE:
      return {
        ...state,
        pagination: { ...state.pagination, page: action.payload },
      };

    case ACTIONS.SET_LIMIT:
      return {
        ...state,
        pagination: { ...state.pagination, limit: action.payload, page: 1 },
      };

    // ────────────────────────────────────────────────────────────────────
    // CREATE
    // ────────────────────────────────────────────────────────────────────
    case ACTIONS.CREATE_START:
      return { ...state, loading: true, error: null };

    case ACTIONS.CREATE_SUCCESS:
      return {
        ...state,
        loading: false,
        pagination: { ...state.pagination, page: 1 },
      };

    case ACTIONS.CREATE_ERROR:
      return { ...state, loading: false, error: action.payload };

    // ────────────────────────────────────────────────────────────────────
    // UPDATE
    // ────────────────────────────────────────────────────────────────────
    case ACTIONS.UPDATE_START:
      return { ...state, loading: true, error: null };

    case ACTIONS.UPDATE_SUCCESS:
      return {
        ...state,
        transactions: state.transactions.map((tx) =>
          tx.id === action.payload.id || tx._id === action.payload._id ? action.payload : tx
        ),
        loading: false,
      };

    case ACTIONS.UPDATE_ERROR:
      return { ...state, loading: false, error: action.payload };

    // ────────────────────────────────────────────────────────────────────
    // DELETE
    // ────────────────────────────────────────────────────────────────────
    case ACTIONS.DELETE_START:
      return { ...state, loading: true, error: null };

    case ACTIONS.DELETE_SUCCESS:
      return {
        ...state,
        transactions: state.transactions.filter(
          (tx) => tx.id !== action.payload && tx._id !== action.payload
        ),
        pagination: {
          ...state.pagination,
          total: Math.max(0, state.pagination.total - 1),
        },
        loading: false,
      };

    case ACTIONS.DELETE_ERROR:
      return { ...state, loading: false, error: action.payload };

    // ────────────────────────────────────────────────────────────────────
    // FILTER & SORT
    // ────────────────────────────────────────────────────────────────────
    case ACTIONS.SET_FILTER:
      return {
        ...state,
        filter: { ...state.filter, ...action.payload },
        pagination: { ...state.pagination, page: 1 },
      };

    case ACTIONS.SET_SORT:
      return {
        ...state,
        sortBy: action.payload.sortBy,
        sortOrder: action.payload.sortOrder,
        pagination: { ...state.pagination, page: 1 },
      };

    case ACTIONS.CLEAR_FILTER:
      return {
        ...state,
        filter: initialState.filter,
        sortBy: initialState.sortBy,
        sortOrder: initialState.sortOrder,
        pagination: { ...state.pagination, page: 1 },
      };

    // ────────────────────────────────────────────────────────────────────
    // ERROR
    // ────────────────────────────────────────────────────────────────────
    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
}
