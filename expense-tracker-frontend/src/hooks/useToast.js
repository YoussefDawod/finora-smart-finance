/**
 * @fileoverview useToast Custom Hook
 * @description Wrapper around ToastContext for easy toast notifications
 * 
 * USAGE:
 * const { success, error, warning, info } = useToast();
 * success('Changes saved!');
 * error('Something went wrong');
 * warning('Are you sure?');
 * info('FYI: New feature available');
 * 
 * @module useToast
 */

import { useContext } from 'react';
import { ToastContext } from '@/context/ToastContext';

/**
 * Hook to use Toast Context
 * @throws {Error} If used outside ToastProvider
 * @returns {Object} Toast actions and state
 */
export function useToast() {
  const context = useContext(ToastContext);

  if (context === undefined) {
    throw new Error(
      'useToast must be used within a ToastProvider. ' +
      'Make sure your component tree is wrapped with <ToastProvider>.'
    );
  }

  return context;
}

export default useToast;
