import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';

/**
 * useStaleWhileRevalidate Hook
 * Serves stale data immediately, revalidates in background
 * Perfect for dashboards and frequently-accessed data
 * 
 * Usage:
 *   const { data, loading, error, refetch } = useStaleWhileRevalidate(
 *     '/transactions',
 *     { category: 'groceries' }
 *   );
 */
export function useStaleWhileRevalidate(endpoint, params = {}, options = {}) {
  const { staleTTL = 30 * 1000, cachePolicy = 'stale-while-revalidate' } = options;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRevalidating, setIsRevalidating] = useState(false);

  const cacheKey = apiClient.cache.generateKey(endpoint, params);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // STRATEGY: stale-while-revalidate
      if (cachePolicy === 'stale-while-revalidate') {
        // Check if we have stale data
        const staleData = apiClient.cache.get(cacheKey);
        const isStale = apiClient.cache.isStale(cacheKey, staleTTL);

        // Serve stale data immediately if available and not expired
        if (staleData && !isStale) {
          setData(staleData);
          setLoading(false);
          return;
        }

        // Serve stale data and revalidate in background
        if (staleData && isStale) {
          setData(staleData);
          setLoading(false);
          setIsRevalidating(true);

          try {
            const freshData = await apiClient.get(endpoint, params, {
              cache: true,
              forceRefresh: true,
            });
            setData(freshData);
          } catch (err) {
            console.warn('Revalidation failed, keeping stale data:', err);
          } finally {
            setIsRevalidating(false);
          }
          return;
        }

        // No cache, fetch fresh data
        setLoading(true);
        const freshData = await apiClient.get(endpoint, params, {
          cache: true,
        });
        setData(freshData);
      }
      // STRATEGY: cache-first (default)
      else if (cachePolicy === 'cache-first') {
        const cached = apiClient.cache.get(cacheKey);
        if (cached) {
          setData(cached);
          setLoading(false);
          return;
        }

        setLoading(true);
        const freshData = await apiClient.get(endpoint, params, {
          cache: true,
        });
        setData(freshData);
      }
      // STRATEGY: network-first
      else if (cachePolicy === 'network-first') {
        try {
          setLoading(true);
          const freshData = await apiClient.get(endpoint, params, {
            cache: true,
            forceRefresh: true,
          });
          setData(freshData);
        } catch (err) {
          const cached = apiClient.cache.get(cacheKey);
          if (cached) {
            setData(cached);
          } else {
            throw err;
          }
        }
      }

      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
      console.error('useStaleWhileRevalidate error:', err);
    }
  }, [endpoint, params, staleTTL, cacheKey, cachePolicy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const freshData = await apiClient.get(endpoint, params, {
        cache: true,
        forceRefresh: true,
      });
      setData(freshData);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, params]);

  return {
    data,
    loading,
    error,
    isRevalidating,
    refetch,
  };
}
