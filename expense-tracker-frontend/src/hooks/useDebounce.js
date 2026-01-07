import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 * 
 * Verzögert die Aktualisierung eines Wertes bis nach einer bestimmten Zeit ohne Änderung.
 * Ideal für Search-Input, Auto-Complete, etc.
 * 
 * @param {*} value - Der zu debouncende Wert
 * @param {number} delay - Verzögerung in Millisekunden (default: 500ms)
 * @returns {*} Der gedebouncte Wert
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   // API Call nur mit debouncedSearch
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Setze neuen Wert nach Verzögerung
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: Timer abbrechen wenn value sich ändert
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
