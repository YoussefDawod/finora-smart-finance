/**
 * @fileoverview useTheme Custom Hook
 * @description Wrapper around ThemeContext for theme management
 * Supports Light, Dark, and Glassmorphic themes
 * 
 * USAGE:
 * const { theme, toggleTheme, toggleGlass } = useTheme()
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
 * @returns {boolean} useGlass - Is glassmorphic effect enabled
 * @returns {'light'|'dark'} systemPreference - OS/Browser preference
 * @returns {boolean} isInitialized - Theme initialization complete
 * @returns {Function} setTheme - Set theme to light|dark
 * @returns {Function} toggleTheme - Toggle between light and dark
 * @returns {Function} setGlassEnabled - Enable/disable glassmorphic effect
 * @returns {Function} toggleGlass - Toggle glassmorphic effect
 * @returns {Function} resetToSystemPreference - Reset to system preference
 * 
 * @example
 * const { theme, toggleTheme, useGlass, toggleGlass } = useTheme();
 * 
 * return (
 *   <div>
 *     <button onClick={toggleTheme}>
 *       {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
 *     </button>
 *     <button onClick={toggleGlass}>
 *       {useGlass ? '✨ Normal' : '💎 Glass'}
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
