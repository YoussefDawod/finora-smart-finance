/**
 * @fileoverview Theme Context Provider - v2
 * @description Manages global theme state with:
 * - Light/Dark/Glassmorphic themes
 * - System preference auto-detection
 * - localStorage persistence
 * - Real-time CSS variable switching via data-* attributes
 * 
 * STATE SHAPE:
 * {
 *   theme: 'light' | 'dark',
 *   useGlass: boolean,
 *   systemPreference: 'light' | 'dark',
 *   isInitialized: boolean
 * }
 * 
 * HTML ATTRIBUTES:
 * - data-theme="light|dark" - Theme selection
 * - data-glass="true|false" - Glassmorphic extension
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
  GLASS: 'et-glass-preference',
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
  const [useGlass, setUseGlassState] = useState(false);
  const [systemPreference, setSystemPreference] = useState(THEMES.LIGHT);
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs for cleanup
  const mediaQueryRef = useRef(null);

  // ============================================
  // 💾 LOCALSTORAGE HELPERS
  // ============================================

  /**
   * Apply both theme and glass attributes to <html>
   * @param {string} themeValue - 'light' | 'dark'
   * @param {boolean} glassValue - true | false
   */
  const applyThemeToDom = useCallback((themeValue, glassValue) => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    html.setAttribute('data-theme', themeValue);
    html.setAttribute('data-glass', glassValue ? 'true' : 'false');
  }, []);

  /**
   * Save both theme and glass preferences
   * @param {string} themeValue
   * @param {boolean} glassValue
   */
  const savePreferences = useCallback((themeValue, glassValue) => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, themeValue);
      localStorage.setItem(STORAGE_KEYS.GLASS, glassValue ? 'true' : 'false');
    } catch (error) {
      console.error('Failed to save theme preferences:', error);
    }
  }, []);

  /**
   * Load saved preferences from localStorage
   * @returns {Object} { theme, useGlass }
   */
  const loadPreferences = useCallback(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      const savedGlass = localStorage.getItem(STORAGE_KEYS.GLASS);
      return {
        theme: savedTheme && Object.values(THEMES).includes(savedTheme) ? savedTheme : null,
        useGlass: savedGlass === 'true',
      };
    } catch (error) {
      console.error('Failed to load theme preferences:', error);
      return { theme: null, useGlass: false };
    }
  }, []);

  // ============================================
  // 🔍 SYSTEM PREFERENCE DETECTION
  // ============================================

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
    setUseGlassState(preferences.useGlass);
    applyThemeToDom(initialTheme, preferences.useGlass);
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
        applyThemeToDom(e.newValue, useGlass);
      } else if (e.key === STORAGE_KEYS.GLASS && e.newValue !== null) {
        const glassValue = e.newValue === 'true';
        setUseGlassState(glassValue);
        applyThemeToDom(theme, glassValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [useGlass, theme, applyThemeToDom]);

  // ============================================
  // 🎨 THEME ACTIONS
  // ============================================

  /**
   * Set theme explicitly
   * @param {'light' | 'dark'} newTheme
   */
  const setTheme = useCallback((newTheme) => {
    if (!Object.values(THEMES).includes(newTheme)) {
      console.warn(`Invalid theme: ${newTheme}. Using 'light' instead.`);
      newTheme = THEMES.LIGHT;
    }
    setThemeState(newTheme);
    applyThemeToDom(newTheme, useGlass);
    savePreferences(newTheme, useGlass);
  }, [useGlass, applyThemeToDom, savePreferences]);

  /**
   * Toggle between light and dark
   */
  const toggleTheme = useCallback(() => {
    const newTheme = theme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    setTheme(newTheme);
  }, [theme, setTheme]);

  /**
   * Set glass effect enabled/disabled
   * @param {boolean} enabled
   */
  const setGlassEnabled = useCallback((enabled) => {
    setUseGlassState(enabled);
    applyThemeToDom(theme, enabled);
    savePreferences(theme, enabled);
  }, [theme, applyThemeToDom, savePreferences]);

  /**
   * Toggle glass effect on/off
   */
  const toggleGlass = useCallback(() => {
    const newGlass = !useGlass;
    setGlassEnabled(newGlass);
  }, [useGlass, setGlassEnabled]);

  /**
   * Reset to system preference (theme only, keep glass setting)
   */
  const resetToSystemPreference = useCallback(() => {
    setTheme(systemPreference);
  }, [systemPreference, setTheme]);

  // ============================================
  // 📤 CONTEXT VALUE
  // ============================================

  const value = {
    // State
    theme,
    useGlass,
    systemPreference,
    isDarkMode: theme === THEMES.DARK,
    isInitialized,

    // Actions
    setTheme,
    toggleTheme,
    setGlassEnabled,
    toggleGlass,
    resetToSystemPreference,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Export context for Fast Refresh compatibility
export { ThemeContext };
