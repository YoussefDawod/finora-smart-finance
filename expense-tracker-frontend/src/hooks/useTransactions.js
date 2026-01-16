import { useContext } from 'react';
import { TransactionContext } from '../context/TransactionContext';

/**
 * Hook zur Verwendung des TransactionContext
 * 
 * @returns {Object} Alle Transaction-Funktionen und State
 * 
 * @example
 * const { transactions, createTransaction, loading } = useTransactions();
 */
export const useTransactions = () => {
  const context = useContext(TransactionContext);

  if (!context) {
    throw new Error(
      'useTransactions muss innerhalb von TransactionProvider verwendet werden'
    );
  }

  return context;
};

export default useTransactions;
