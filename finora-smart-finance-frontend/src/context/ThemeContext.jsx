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

import { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';

// ============================================
// 🎨 THEME CONSTANTS
// ============================================

 

const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

const STORAGE_KEYS = {
  THEME: 'et-theme-preference',
};

/**
 * Determines the initial theme from localStorage → system preference → light
 * @returns {'light' | 'dark'}
 */
function getInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved && Object.values(THEMES).includes(saved)) return saved;
  } catch { /* ignore */ }
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return THEMES.DARK;
  }
  return THEMES.LIGHT;
}

/**
 * Reads the current system color scheme preference
 * @returns {'light' | 'dark'}
 */
function getInitialSystemPreference() {
  if (typeof window === 'undefined') return THEMES.LIGHT;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? THEMES.DARK
    : THEMES.LIGHT;
}

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

  const [theme, setThemeState] = useState(getInitialTheme);
  const [systemPreference, setSystemPreference] = useState(getInitialSystemPreference);
  const isInitialized = true;
  
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

  // ============================================
  // 🎬 INITIALIZATION & LISTENERS
  // ============================================

  /**
   * Apply theme to DOM on mount
   * State is already initialized via lazy initializers (getInitialTheme / getInitialSystemPreference)
   */
  useEffect(() => {
    applyThemeToDom(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const value = useMemo(() => ({
    // State
    theme,
    systemPreference,
    isDarkMode: theme === THEMES.DARK,
    isInitialized,

    // Actions
    setTheme,
    toggleTheme,
    resetToSystemPreference,
  }), [theme, systemPreference, isInitialized, setTheme, toggleTheme, resetToSystemPreference]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Export context for Fast Refresh compatibility
export { ThemeContext }