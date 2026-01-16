/**
 * @fileoverview useDebounce Custom Hook
 * @description Debounces a value with optional callback
 * 
 * USAGE:
 * const debouncedValue = useDebounce(searchQuery, 300)
 * 
 * @module useDebounce
 */

import { useState, useEffect } from 'react';

/* eslint-disable no-undef */

/**
 * Debounce a value
 * @param {*} value - Value to debounce
 * @param {number} [delay=300] - Debounce delay in ms
 * @param {Function} [callback] - Optional callback when value changes
 * @returns {*} Debounced value
 * 
 * @example
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebounce(searchQuery, 500);
 * 
 * useEffect(() => {
 *   if (debouncedQuery) {
 *     fetchTransactions(debouncedQuery);
 *   }
 * }, [debouncedQuery]);
 * 
 * return (
 *   <input
 *     value={searchQuery}
 *     onChange={(e) => setSearchQuery(e.target.value)}
 *     placeholder="Search..."
 *   />
 * )
 */
export function useDebounce(value, delay = 300, callback) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set timeout to update debounced value
    const timeoutId = globalThis.setTimeout(() => {
      setDebouncedValue(value);

      // Call optional callback
      if (callback && typeof callback === 'function') {
        callback(value);
      }
    }, delay);

    // Cleanup: Cancel timeout if value changes before delay completes
    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [value, delay, callback]);

  return debouncedValue;
}

export default useDebounce;
