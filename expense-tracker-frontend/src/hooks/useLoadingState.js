/**
 * React hook for managing loading states with automatic skeleton display.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { LOADING_STATES, loadingStateManager } from '../utils/loadingStateManager';

/**
 * Hook for managing loading states with skeleton support.
 * @param {Object} options
 * @param {string} options.key - Unique identifier for this loading state
 * @param {Function} options.fetchFn - Async function to fetch data
 * @param {*} options.initialData - Initial data value
 * @param {boolean} options.autoFetch - Auto-fetch on mount (default: false)
 * @param {number} options.skeletonDelay - Delay before showing skeleton (default: 200ms)
 * @param {number} options.skeletonThreshold - Max time before error (default: 3000ms)
 * @param {Array} options.dependencies - Dependencies to trigger re-fetch
 * @returns {Object} Loading state and control functions
 */
export function useLoadingState({
  key,
  fetchFn,
  initialData = null,
  autoFetch = false,
  skeletonDelay = 200,
  skeletonThreshold = 3000,
  dependencies = [],
} = {}) {
  const [state, setState] = useState(LOADING_STATES.IDLE);
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  /**
   * Fetches data and manages loading states.
   */
  const fetch = useCallback(async () => {
    if (!fetchFn) {
      console.warn('useLoadingState: fetchFn is required');
      return;
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(LOADING_STATES.LOADING);
    setError(null);

    if (key) {
      loadingStateManager.setState(key, LOADING_STATES.LOADING);
      loadingStateManager.setLoadingTimeout(key, skeletonDelay, skeletonThreshold);
    }

    const startTime = Date.now();

    try {
      const result = await fetchFn({ signal: abortControllerRef.current.signal });

      if (!isMountedRef.current) return;

      const duration = Date.now() - startTime;

      // Don't show skeleton for fast loads (< 200ms)
      if (duration < skeletonDelay) {
        setState(LOADING_STATES.SUCCESS);
        setData(result);

        if (key) {
          loadingStateManager.clearTimeout(key);
          loadingStateManager.setState(key, LOADING_STATES.SUCCESS, result);
        }
      } else {
        setState(LOADING_STATES.SUCCESS);
        setData(result);

        if (key) {
          loadingStateManager.clearTimeout(key);
          loadingStateManager.setState(key, LOADING_STATES.SUCCESS, result);
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;

      if (!isMountedRef.current) return;

      setState(LOADING_STATES.ERROR);
      setError(err);

      if (key) {
        loadingStateManager.clearTimeout(key);
        loadingStateManager.setState(key, LOADING_STATES.ERROR, { error: err });
      }
    }
  }, [fetchFn, key, skeletonDelay, skeletonThreshold]);

  /**
   * Retries fetching data.
   */
  const retry = useCallback(() => {
    fetch();
  }, [fetch]);

  /**
   * Manually sets state.
   * @param {string} newState
   */
  const setManualState = useCallback(
    (newState) => {
      setState(newState);
      if (key) {
        loadingStateManager.setState(key, newState);
      }
    },
    [key]
  );

  /**
   * Resets to idle state.
   */
  const reset = useCallback(() => {
    setState(LOADING_STATES.IDLE);
    setData(initialData);
    setError(null);

    if (key) {
      loadingStateManager.clearState(key);
    }
  }, [key, initialData]);

  // Auto-fetch on mount or dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
  }, [autoFetch, fetch, ...dependencies]);

  // Subscribe to state changes from manager
  useEffect(() => {
    if (!key) return;

    const unsubscribe = loadingStateManager.subscribe(key, (newState) => {
      if (isMountedRef.current) {
        setState(newState.state);
        if (newState.data) {
          setData(newState.data);
        }
      }
    });

    return unsubscribe;
  }, [key]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (key) {
        loadingStateManager.clearTimeout(key);
      }
    };
  }, [key]);

  return {
    state,
    data,
    error,
    isIdle: state === LOADING_STATES.IDLE,
    isLoading: state === LOADING_STATES.LOADING,
    isSuccess: state === LOADING_STATES.SUCCESS,
    isError: state === LOADING_STATES.ERROR,
    isSkeleton: state === LOADING_STATES.SKELETON,
    fetch,
    retry,
    reset,
    setState: setManualState,
  };
}

export default useLoadingState;
