/**
 * @fileoverview useTheme Custom Hook
 * @description Wrapper around ThemeContext for theme management
 * Supports Light and Dark themes
 * 
 * USAGE:
 * const { theme, toggleTheme } = useTheme()
 * 
 * @module useTheme
 */

import { useContext } from 'react';
import { ThemeContext } from '@/context/ThemeContext';

/**
 * Hook to use Theme Context
 * @throws {Error} If used outside ThemeProvider
 * @returns {Object} Theme state and actions
 * @returns {'light'|'dark'} theme - Current theme
 * @returns {boolean} isDarkMode - Is dark mode active
 * @returns {'light'|'dark'} systemPreference - OS/Browser preference
 * @returns {boolean} isInitialized - Theme initialization complete
 * @returns {Function} setTheme - Set theme to light|dark
 * @returns {Function} toggleTheme - Toggle between light and dark
 * @returns {Function} resetToSystemPreference - Reset to system preference
 * 
 * @example
 * const { theme, toggleTheme } = useTheme();
 * 
 * return (
 *   <div>
 *     <button onClick={toggleTheme}>
 *       {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
 *     </button>
 *   </div>
 * )
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error(
      'useTheme must be used within a ThemeProvider. ' +
      'Make sure your component tree is wrapped with <ThemeProvider>.'
    );
  }

  return context;
}

export default useTheme;
