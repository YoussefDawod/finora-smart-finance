/**
 * @fileoverview Theme Context Provider - v2
 * @description Manages global theme state with:
 * - Light/Dark themes
 * - System preference auto-detection
 * - localStorage persistence
 * - Real-time CSS variable switching via data-* attributes
 * 
 * STATE SHAPE:
 * {
 *   theme: 'light' | 'dark',
 *   systemPreference: 'light' | 'dark',
 *   isInitialized: boolean
 * }
 * 
 * HTML ATTRIBUTES:
 * - data-theme="light|dark" - Theme selection
 * 
 * @module ThemeContext
 */

import { createContext, useState, useEffect, useCallback, useRef } from 'react';

// ============================================
// 🎨 THEME CONSTANTS
// ============================================

/* eslint-disable no-undef */

const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

const STORAGE_KEYS = {
  THEME: 'et-theme-preference',
};

// ============================================
// 🎯 CONTEXT
// ============================================

const ThemeContext = createContext(undefined);

// ============================================
// 🎨 PROVIDER COMPONENT
// ============================================

/**
 * ThemeProvider Component
 * Manages theme state and applies data-* attributes to <html>
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @returns {React.ReactNode}
 */
export function ThemeProvider({ children }) {
  // ============================================
  // 📊 STATE
  // ============================================

  const [theme, setThemeState] = useState(THEMES.LIGHT);
  const [systemPreference, setSystemPreference] = useState(THEMES.LIGHT);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // for cleanup
  const mediaQueryRef = useRef(null);

  // ============================================
  // 💾 LOCALSTORAGE HELPERS
  // ============================================

  /**
   * Apply theme attribute to <html>
   * @param {string} themeValue - 'light' | 'dark'
   */
  const applyThemeToDom = useCallback((themeValue) => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    html.setAttribute('data-theme', themeValue);
  }, []);

  /**
   * Save theme preference
   * @param {string} themeValue
   */
  const savePreferences = useCallback((themeValue) => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, themeValue);
    } catch (error) {
      console.error('Failed to save theme preferences:', error);
    }
  }, []);

  /**
   * Load saved preferences from localStorage
   * @returns {Object} { theme }
   */
  const loadPreferences = useCallback(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      return {
        theme: savedTheme && Object.values(THEMES).includes(savedTheme) ? savedTheme : null,
      };
    } catch (error) {
      console.error('Failed to load theme preferences:', error);
      return { theme: null };
    }
  }, []);

  /**
   * Get system color scheme preference
   * @returns {'light' | 'dark'}
   */
  const getSystemPreference = useCallback(() => {
    if (typeof window === 'undefined') return THEMES.LIGHT;
    return window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? THEMES.DARK 
      : THEMES.LIGHT;
  }, []);

  // ============================================
  // 🎬 INITIALIZATION & LISTENERS
  // ============================================

  /**
   * Initialize theme on mount
   * Priority: localStorage > system preference > light
   */
  useEffect(() => {
    const preferences = loadPreferences();
    const systemPref = getSystemPreference();
    
    setSystemPreference(systemPref);

    let initialTheme = THEMES.LIGHT;
    if (preferences.theme) {
      initialTheme = preferences.theme;
    } else if (systemPref === THEMES.DARK) {
      initialTheme = THEMES.DARK;
    }

    setThemeState(initialTheme);
    applyThemeToDom(initialTheme);
    setIsInitialized(true);
  }, [getSystemPreference, loadPreferences, applyThemeToDom]);

  /**
   * System preference listener
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const newPreference = e.matches ? THEMES.DARK : THEMES.LIGHT;
      setSystemPreference(newPreference);
      // Don't auto-switch; let user control via ThemeSelector
    };

    mediaQuery.addEventListener('change', handleChange);
    mediaQueryRef.current = mediaQuery;

    return () => {
      if (mediaQueryRef.current) {
        mediaQueryRef.current.removeEventListener('change', handleChange);
      }
    };
  }, []);

  /**
   * Cross-tab sync listener
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEYS.THEME && e.newValue) {
        setThemeState(e.newValue);
        applyThemeToDom(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [theme, applyThemeToDom]);

  // ============================================
  // 🎮 PUBLIC API
  // ============================================

  /**
   * Set theme
   * @param {'light' | 'dark'} newTheme
   */
  const setTheme = useCallback((newTheme) => {
    if (!Object.values(THEMES).includes(newTheme)) {
      console.warn(`Invalid theme: ${newTheme}. Using 'light' instead.`);
      newTheme = THEMES.LIGHT;
    }
    setThemeState(newTheme);
    applyThemeToDom(newTheme);
    savePreferences(newTheme);
  }, [applyThemeToDom, savePreferences]);

  /**
   * Toggle between light and dark
   */
  const toggleTheme = useCallback(() => {
    const newTheme = theme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    setTheme(newTheme);
  }, [theme, setTheme]);

/**
   * Reset to system preference
   */
  const resetToSystemPreference = useCallback(() => {
    setTheme(systemPreference);
  }, [systemPreference, setTheme]);

  // ============================================
  // 🔌 CONTEXT VALUE
  // ============================================

  const value = {
    // State
    theme,
    systemPreference,
    isDarkMode: theme === THEMES.DARK,
    isInitialized,

    // Actions
    setTheme,
    toggleTheme,
    resetToSystemPreference,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Export context for Fast Refresh compatibility
export { ThemeContext }