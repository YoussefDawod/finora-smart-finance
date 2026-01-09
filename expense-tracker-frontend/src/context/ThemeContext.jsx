import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'expense-tracker-theme';
const THEME_OPTIONS = ['light', 'dark', 'system'];

const getSystemTheme = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return 'system';
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return THEME_OPTIONS.includes(saved) ? saved : 'system';
  });
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => setSystemTheme(event.matches ? 'dark' : 'light');

    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = useCallback((nextTheme) => {
    const safeTheme = THEME_OPTIONS.includes(nextTheme) ? nextTheme : 'system';
    setThemeState(safeTheme);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, safeTheme);
    }
  }, []);

  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }

    root.dataset.themeMode = theme;
    root.dataset.themeResolved = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme, theme]);

  const toggleTheme = useCallback(() => {
    const sequence = ['light', 'dark', 'system'];
    const currentIndex = sequence.indexOf(theme);
    const next = sequence[(currentIndex + 1) % sequence.length];
    setTheme(next);
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme, options: THEME_OPTIONS }),
    [resolvedTheme, setTheme, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useThemeContext = () => useContext(ThemeContext);
