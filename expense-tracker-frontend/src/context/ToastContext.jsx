/**
 * @fileoverview Toast Notification Context Provider
 * @description Manages global toast notifications with auto-dismiss,
 * queue management, and accessibility support.
 * 
 * STATE SHAPE:
 * {
 *   toasts: [
 *     {
 *       id: string,
 *       message: string,
 *       type: 'success' | 'error' | 'warning' | 'info',
 *       duration: number (ms),
 *       action?: { label: string, onClick: () => void }
 *     }
 *   ]
 * }
 * 
 * QUEUE RULES:
 * - Max 3 toasts visible
 * - Newest on top (last added)
 * - Auto-dismiss by duration
 * - Manual dismiss via removeToast(id)
 * 
 * @module ToastContext
 */

import { createContext, useReducer, useCallback, useRef, useEffect } from 'react';

// ============================================
// 📋 TOAST TYPES & CONSTANTS
// ============================================

/**
 * @typedef {Object} Toast
 * @property {string} id - Unique identifier (uuid)
 * @property {string} message - Toast message text
 * @property {'success'|'error'|'warning'|'info'} type - Toast type
 * @property {number} duration - Auto-dismiss time in ms (0 = persistent)
 * @property {Object} [action] - Optional action button
 * @property {string} action.label - Button label
 * @property {() => void} action.onClick - Click handler
 */

/**
 * @typedef {Object} ToastState
 * @property {Toast[]} toasts
 */

/* eslint-disable no-undef */
const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

const DEFAULT_DURATION = 5000; // 5 seconds
const MAX_TOASTS = 3;

// Action Types
const TOAST_ACTIONS = {
  ADD_TOAST: 'ADD_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
  CLEAR_ALL: 'CLEAR_ALL',
};

// ============================================
// 🆔 UUID GENERATOR
// ============================================

/**
 * Generate simple UUID v4-like identifier
 * @returns {string}
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// 🔄 REDUCER
// ============================================

/** @type {ToastState} */
const initialState = {
  toasts: [],
};

/**
 * Toast Reducer
 * @param {ToastState} state
 * @param {Object} action
 * @returns {ToastState}
 */
function toastReducer(state, action) {
  switch (action.type) {
    case TOAST_ACTIONS.ADD_TOAST: {
      // Add new toast at the beginning (newest on top)
      let newToasts = [action.payload, ...state.toasts];
      
      // Keep only last 3 toasts (remove oldest)
      if (newToasts.length > MAX_TOASTS) {
        newToasts = newToasts.slice(0, MAX_TOASTS);
      }
      
      return {
        ...state,
        toasts: newToasts,
      };
    }

    case TOAST_ACTIONS.REMOVE_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.payload),
      };

    case TOAST_ACTIONS.CLEAR_ALL:
      return {
        ...state,
        toasts: [],
      };

    default:
      return state;
  }
}

// ============================================
// 📦 CONTEXT (without export for Fast Refresh)
// ============================================

const ToastContext = createContext(undefined);

// ============================================
// 🎯 PROVIDER COMPONENT
// ============================================

/**
 * ToastProvider Component
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function ToastProvider({ children }) {
  const [state, dispatch] = useReducer(toastReducer, initialState);
  
  // Store timeout IDs for cleanup
  const timeoutIdsRef = useRef(new Map());

  // ============================================
  // 🎬 CLEANUP
  // ============================================

  /**
   * Cleanup all timeouts on unmount
   */
  useEffect(() => {
    const timeoutMap = timeoutIdsRef.current;
    return () => {
      timeoutMap.forEach((timeoutId) => {
        globalThis.clearTimeout(timeoutId);
      });
      timeoutMap.clear();
    };
  }, []);

  // ============================================
  // 🔔 TOAST ACTIONS
  // ============================================

  /**
   * Remove a toast by ID (internal helper)
   * @param {string} id - Toast ID
   */
  const removeToastInternal = useCallback((id) => {
    // Clear timeout if exists
    const timeoutId = timeoutIdsRef.current.get(id);
    if (timeoutId) {
      globalThis.clearTimeout(timeoutId);
      timeoutIdsRef.current.delete(id);
    }

    dispatch({ type: TOAST_ACTIONS.REMOVE_TOAST, payload: id });
  }, []);

  /**
   * Add a new toast notification
   * @param {string} message - Toast message
   * @param {'success'|'error'|'warning'|'info'} [type='info'] - Toast type
   * @param {number} [duration=5000] - Auto-dismiss time in ms (0 = persistent)
   * @param {Object} [action] - Optional action button
   * @returns {string} - Toast ID for manual removal
   */
  const addToast = useCallback(
    (
      message,
      type = TOAST_TYPES.INFO,
      duration = DEFAULT_DURATION,
      action = null,
    ) => {
      if (!message) {
        globalThis.console?.warn('Toast message is required');
        return null;
      }

      if (!Object.values(TOAST_TYPES).includes(type)) {
        globalThis.console?.warn(
          `Invalid toast type: ${type}. Using 'info' instead.`
        );
        type = TOAST_TYPES.INFO;
      }

      const id = generateId();

      const toast = {
        id,
        message,
        type,
        duration,
        action,
      };

      dispatch({ type: TOAST_ACTIONS.ADD_TOAST, payload: toast });

      // Auto-dismiss if duration > 0
      if (duration > 0) {
        const timeoutId = globalThis.setTimeout(() => {
          removeToastInternal(id);
        }, duration);

        timeoutIdsRef.current.set(id, timeoutId);
      }

      return id;
    },
    [removeToastInternal]
  );

  /**
   * Remove a toast by ID
   * @param {string} id - Toast ID
   */
  const removeToast = useCallback((id) => {
    removeToastInternal(id);
  }, [removeToastInternal]);

  /**
   * Clear all toasts
   */
  const clearAllToasts = useCallback(() => {
    // Clear all timeouts
    timeoutIdsRef.current.forEach((timeoutId) => {
      globalThis.clearTimeout(timeoutId);
    });
    timeoutIdsRef.current.clear();

    dispatch({ type: TOAST_ACTIONS.CLEAR_ALL });
  }, []);

  /**
   * Helper: Add success toast
   * @param {string} message
   * @param {number} [duration=5000]
   * @returns {string} - Toast ID
   */
  const success = useCallback((message, duration = DEFAULT_DURATION) => {
    return addToast(message, TOAST_TYPES.SUCCESS, duration);
  }, [addToast]);

  /**
   * Helper: Add error toast
   * @param {string} message
   * @param {number} [duration=5000]
   * @returns {string} - Toast ID
   */
  const error = useCallback((message, duration = DEFAULT_DURATION) => {
    return addToast(message, TOAST_TYPES.ERROR, duration);
  }, [addToast]);

  /**
   * Helper: Add warning toast
   * @param {string} message
   * @param {number} [duration=5000]
   * @returns {string} - Toast ID
   */
  const warning = useCallback((message, duration = DEFAULT_DURATION) => {
    return addToast(message, TOAST_TYPES.WARNING, duration);
  }, [addToast]);

  /**
   * Helper: Add info toast
   * @param {string} message
   * @param {number} [duration=5000]
   * @returns {string} - Toast ID
   */
  const info = useCallback((message, duration = DEFAULT_DURATION) => {
    return addToast(message, TOAST_TYPES.INFO, duration);
  }, [addToast]);

  // ============================================
  // 📤 CONTEXT VALUE
  // ============================================

  const value = {
    // State
    toasts: state.toasts,
    
    // Actions
    addToast,
    removeToast,
    clearAllToasts,
    
    // Shortcuts
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

// Export context separately for Fast Refresh compatibility
export { ToastContext };
