import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

/**
 * Generic Fetch Hook (Alternative zu useApi für simple Requests)
 * Für: GET-only requests, externe APIs, statische Daten
 */
function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(new AbortController());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const response = await axios.get(url, {
          signal: abortControllerRef.current.signal,
          timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || 10000),
          ...options,
        });

        if (isMountedRef.current) {
          setData(response.data);
          setError(null);
        }
      } catch (err) {
        if (axios.isCancel(err)) {
          return; // Request abgebrochen
        }

        if (isMountedRef.current) {
          setError(err.message);
          setData(null);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current.abort();
    };
  }, [url, options]);

  const refetch = useCallback(() => {
    abortControllerRef.current = new AbortController();
    setLoading(true);

    const fetchData = async () => {
      try {
        const response = await axios.get(url, {
          signal: abortControllerRef.current.signal,
          timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || 10000),
          ...options,
        });

        if (isMountedRef.current) {
          setData(response.data);
          setError(null);
        }
      } catch (err) {
        if (!axios.isCancel(err) && isMountedRef.current) {
          setError(err.message);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [url, options]);

  return { data, loading, error, refetch };
}

export default useFetch;
