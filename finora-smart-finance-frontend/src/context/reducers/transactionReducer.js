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

  // DASHBOARD MONTH/YEAR FILTER
  dashboardMonth: new Date().getMonth() + 1,
  dashboardYear: new Date().getFullYear(),

  // TRANSAKTIONSLISTE (paginiert vom Server)
  transactions: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },

  // Loading-States (initial true für Skeleton beim ersten Load)
  loading: true,
  dashboardLoading: true,

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
  SET_DASHBOARD_MONTH: 'SET_DASHBOARD_MONTH',

  // Transaktionsliste (paginiert)
  FETCH_LIST_START: 'FETCH_LIST_START',
  FETCH_LIST_SUCCESS: 'FETCH_LIST_SUCCESS',
  FETCH_LIST_ERROR: 'FETCH_LIST_ERROR',

  // Pagination
  SET_PAGE: 'SET_PAGE',
  SET_LIMIT: 'SET_LIMIT',

  // Create (mit Optimistic UI)
  CREATE_START: 'CREATE_START',
  CREATE_OPTIMISTIC: 'CREATE_OPTIMISTIC',
  CREATE_SUCCESS: 'CREATE_SUCCESS',
  CREATE_ROLLBACK: 'CREATE_ROLLBACK',
  CREATE_ERROR: 'CREATE_ERROR',

  // Update (mit Optimistic UI)
  UPDATE_START: 'UPDATE_START',
  UPDATE_OPTIMISTIC: 'UPDATE_OPTIMISTIC',
  UPDATE_SUCCESS: 'UPDATE_SUCCESS',
  UPDATE_ROLLBACK: 'UPDATE_ROLLBACK',
  UPDATE_ERROR: 'UPDATE_ERROR',

  // Delete (mit Optimistic UI)
  DELETE_START: 'DELETE_START',
  DELETE_OPTIMISTIC: 'DELETE_OPTIMISTIC',
  DELETE_SUCCESS: 'DELETE_SUCCESS',
  DELETE_ROLLBACK: 'DELETE_ROLLBACK',
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

    case ACTIONS.SET_DASHBOARD_MONTH:
      return {
        ...state,
        dashboardMonth: action.payload.month,
        dashboardYear: action.payload.year,
      };

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
    // CREATE (mit Optimistic UI)
    // ────────────────────────────────────────────────────────────────────
    case ACTIONS.CREATE_START:
      return { ...state, error: null };

    case ACTIONS.CREATE_OPTIMISTIC:
      // Sofortige UI-Aktualisierung: Temporäre Transaktion am Anfang einfügen
      return {
        ...state,
        transactions: [
          { ...action.payload, _pending: 'create', _tempId: action.payload._tempId },
          ...state.transactions,
        ],
        pagination: {
          ...state.pagination,
          total: state.pagination.total + 1,
        },
      };

    case ACTIONS.CREATE_SUCCESS:
      // Ersetze temporäre Transaktion mit echter Server-Antwort
      return {
        ...state,
        transactions: state.transactions.map((tx) =>
          tx._tempId === action.payload.tempId
            ? { ...action.payload.transaction, _pending: undefined, _tempId: undefined }
            : tx
        ),
        loading: false,
        pagination: { ...state.pagination, page: 1 },
      };

    case ACTIONS.CREATE_ROLLBACK:
      // Rollback: Temporäre Transaktion entfernen
      return {
        ...state,
        transactions: state.transactions.filter((tx) => tx._tempId !== action.payload.tempId),
        pagination: {
          ...state.pagination,
          total: Math.max(0, state.pagination.total - 1),
        },
        error: action.payload.error,
        loading: false,
      };

    case ACTIONS.CREATE_ERROR:
      return { ...state, loading: false, error: action.payload };

    // ────────────────────────────────────────────────────────────────────
    // UPDATE (mit Optimistic UI)
    // ────────────────────────────────────────────────────────────────────
    case ACTIONS.UPDATE_START:
      return { ...state, error: null };

    case ACTIONS.UPDATE_OPTIMISTIC:
      // Sofortige UI-Aktualisierung: Transaktion als "pending" markieren
      return {
        ...state,
        transactions: state.transactions.map((tx) =>
          tx.id === action.payload.id || tx._id === action.payload.id
            ? { ...action.payload.newData, _pending: 'update', _originalData: tx }
            : tx
        ),
      };

    case ACTIONS.UPDATE_SUCCESS:
      return {
        ...state,
        transactions: state.transactions.map((tx) =>
          tx.id === action.payload.id || tx._id === action.payload._id
            ? { ...action.payload, _pending: undefined, _originalData: undefined }
            : tx
        ),
        loading: false,
      };

    case ACTIONS.UPDATE_ROLLBACK:
      // Rollback: Originalwerte wiederherstellen
      return {
        ...state,
        transactions: state.transactions.map((tx) =>
          tx.id === action.payload.id || tx._id === action.payload.id
            ? { ...tx._originalData, _pending: undefined, _originalData: undefined }
            : tx
        ),
        error: action.payload.error,
        loading: false,
      };

    case ACTIONS.UPDATE_ERROR:
      return { ...state, loading: false, error: action.payload };

    // ────────────────────────────────────────────────────────────────────
    // DELETE (mit Optimistic UI)
    // ────────────────────────────────────────────────────────────────────
    case ACTIONS.DELETE_START:
      return { ...state, error: null };

    case ACTIONS.DELETE_OPTIMISTIC:
      // Sofortige UI-Aktualisierung: Transaktion als "pending" markieren
      return {
        ...state,
        transactions: state.transactions.map((tx) =>
          tx.id === action.payload || tx._id === action.payload
            ? { ...tx, _pending: 'delete' }
            : tx
        ),
      };

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

    case ACTIONS.DELETE_ROLLBACK:
      // Rollback: _pending Flag entfernen
      return {
        ...state,
        transactions: state.transactions.map((tx) =>
          tx.id === action.payload.id || tx._id === action.payload.id
            ? { ...tx, _pending: undefined }
            : tx
        ),
        error: action.payload.error,
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
