/**
 * @fileoverview useLocalStorage Custom Hook
 * @description Syncs state with localStorage
 * 
 * USAGE:
 * const [value, setValue] = useLocalStorage('key', defaultValue)
 * 
 * @module useLocalStorage
 */

import { useState, useEffect } from 'react';

/* eslint-disable no-undef */

/**
 * Hook for persistent state with localStorage
 * @param {string} key - localStorage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {[*, Function, Function]} State value, setter, remover
 * 
 * @example
 * const [theme, setTheme] = useLocalStorage('theme', 'light');
 * 
 * const handleChangeTheme = (newTheme) => {
 *   setTheme(newTheme); // Updates state AND localStorage
 * }
 */
export function useLocalStorage(key, defaultValue) {
  // State to store our value
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof globalThis.window === 'undefined') {
      return defaultValue;
    }

    try {
      // Get value from localStorage
      const item = globalThis.localStorage?.getItem(key);

      // Parse and return
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      globalThis.console?.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  // Update localStorage when state changes
  const setValue = (value) => {
    try {
      // Handle function updates like setState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      // Update state
      setStoredValue(valueToStore);

      // Save to localStorage
      if (typeof globalThis.window !== 'undefined') {
        globalThis.localStorage?.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      globalThis.console?.error(
        `Error writing to localStorage key "${key}":`,
        error
      );
    }
  };

  const removeValue = () => {
    try {
      setStoredValue(defaultValue);
      if (typeof globalThis.window !== 'undefined') {
        globalThis.localStorage?.removeItem(key);
      }
    } catch (error) {
      globalThis.console?.error(
        `Error removing localStorage key "${key}":`,
        error
      );
    }
  };

  // Listen for changes in other tabs
  useEffect(() => {
    if (typeof globalThis.window === 'undefined') {
      return;
    }

    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          globalThis.console?.error(
            `Error parsing storage change for key "${key}":`,
            error
          );
        }
      }
    };

    globalThis.window.addEventListener('storage', handleStorageChange);

    return () => {
      globalThis.window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;
