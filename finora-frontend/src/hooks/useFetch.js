import { useState, useEffect } from 'react';

/**
 * Custom hook for API calls with loading and error states
 * @param {Function} apiFunction - Async function that makes the API call
 * @param {boolean} immediate - Whether to call the function immediately
 */
export const useFetch = (apiFunction, immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = async (...params) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction(...params);
      setData(result);
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Ein Fehler ist aufgetreten';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, []);

  const refetch = () => execute();

  return {
    data,
    loading,
    error,
    execute,
    refetch,
  };
};
