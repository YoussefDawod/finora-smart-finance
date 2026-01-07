/**
 * useAPIHook - API-Interceptor für standardisierte Fehlerbehandlung
 * Umhüllt API-Funktionen mit Loading und Error States
 */

import { useCallback, useState } from 'react';
import { handleError } from '../utils/errors';

/**
 * Generic API Hook für beliebige API-Funktionen
 * @param {Function} apiFunction - Zu wrappende API-Funktion
 * @returns {Object} { execute, loading, error, clearError }
 *
 * @example
 * const { execute: getTransactions, loading, error } = useAPI(
 *   (filters) => transactionService.getTransactions(filters)
 * );
 */
export const useAPIHook = (apiFunction) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiFunction(...args);
        return result;
      } catch (err) {
        const errorInfo = handleError(err);
        setError(errorInfo);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  return {
    execute,
    loading,
    error,
    clearError: () => setError(null),
  };
};

export default useAPIHook;
