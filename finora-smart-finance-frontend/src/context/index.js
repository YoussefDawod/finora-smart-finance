/**
 * Context API Exports
 * Centralized export point for all contexts and providers
 */

// Contexts
export { AuthContext } from './AuthContext';
export { ThemeContext } from './ThemeContext';
export { ToastContext } from './ToastContext';
export { MotionContext } from './MotionContext';
export { TransactionContext } from './TransactionContext';

// Providers
export { AuthProvider } from './AuthContext';
export { ThemeProvider } from './ThemeContext';
export { ToastProvider } from './ToastContext';
export { MotionProvider } from './MotionContext';
export { TransactionProvider } from './TransactionContext';

// For convenience - use hooks instead
// export { useAuth } from '../hooks/useAuth';
// export { useTheme } from '../hooks/useTheme';
// export { useTransactions } from '../hooks/useTransactions';
// export { useToast } from '../hooks/useToast';
// export { useMotion } from '../hooks/useMotion';
