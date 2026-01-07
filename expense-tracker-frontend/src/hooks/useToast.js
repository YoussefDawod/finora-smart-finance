import { useContext } from 'react';
import { ToastContext } from '../context/ToastContext';

/**
 * Hook für Toast-Zugriff
 * Usage:
 *   const { success, error } = useToast();
 *   success('Erfolgreich erstellt!');
 *   error('Etwas ist schief gelaufen');
 */
function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
}

export default useToast;
