import { useThemeContext } from '../context/ThemeContext';

export const useTheme = () => {
  const context = useThemeContext();
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export default useTheme;
