import { useState, useCallback, useEffect, useRef } from 'react';
import useToast from './useToast';
import { transactionService } from '../api/transactionService';

/**
 * Custom Hook für Transaktionen-Management
 * Features:
 *   - CRUD Operationen mit API-Integration
 *   - Pagination & Filtering
 *   - Optimistic Updates
 *   - Caching
 */
function useTransactions(initialPage = 1, initialLimit = 10) {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    pages: 0,
  });
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { success: showSuccess, error: showError } = useToast();
  
  // Ref um doppelte Fetches im StrictMode zu verhindern
  const isFetching = useRef(false);

  // ============================================
  // FETCH TRANSACTIONS
  // ============================================
  const fetchTransactions = useCallback(
    async (pageNum = initialPage, limitNum = initialLimit, filters = {}) => {
      // Verhindern von doppelten Requests
      if (isFetching.current) return;
      isFetching.current = true;
      
      setLoading(true);
      setError(null);

      try {
        const result = await transactionService.getTransactions({
          page: pageNum,
          limit: limitNum,
          ...filters,
        });

        setTransactions(result.data || []);
        setPagination({
          page: result.pagination?.page || pageNum,
          limit: result.pagination?.limit || limitNum,
          total: result.pagination?.total || 0,
          pages: result.pagination?.pages || 1,
        });

        return result;
      } catch (err) {
        setError(err.message);
        if (err.status === 403) {
          showError("You don't have permission");
        } else if (err.status === 401) {
          showError('Bitte neu einloggen');
        } else {
          showError('Fehler beim Laden der Transaktionen');
        }
        console.error('Fetch transactions error:', err);
        throw err;
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    },
    [initialPage, initialLimit, showError]
  );

  // ============================================
  // FETCH STATS FROM BACKEND
  // ============================================
  const fetchStats = useCallback(async () => {
    try {
      const result = await transactionService.getStatistics();
      setStats({
        totalIncome: result.totalIncome || 0,
        totalExpense: result.totalExpense || 0,
        balance: result.balance || 0,
        transactionCount: result.transactionCount || 0,
      });
    } catch (err) {
      console.error('Fetch stats error:', err);
      // Don't show error toast - stats are secondary
    }
  }, []);

  // ============================================
  // CREATE TRANSACTION
  // ============================================
  const createTransaction = useCallback(
    async (transactionData) => {
      try {
        // Optimistic Update
        const tempId = `temp-${Date.now()}`;
        const tempTransaction = {
          id: tempId,
          ...transactionData,
          createdAt: new Date().toISOString(),
        };
        setTransactions((prev) => [tempTransaction, ...prev]);

        // API Call
        const newTransaction = await transactionService.createTransaction(transactionData);

        // Update mit Server-Response
        setTransactions((prev) => prev.map((t) => (t.id === tempId ? newTransaction : t)));
        showSuccess('Transaktion erstellt');

        // Reload stats from backend
        await fetchStats();

        return newTransaction;
      } catch (err) {
        // Rollback bei Fehler
        setTransactions((prev) => prev.filter((t) => !t.id.startsWith('temp-')));
        if (err.status === 403) {
          showError("You don't have permission");
        } else if (err.status === 401) {
          showError('Bitte neu einloggen');
        } else {
          showError('Fehler beim Erstellen der Transaktion');
        }
        throw err;
      }
    },
    [showSuccess, showError, fetchStats]
  );

  // ============================================
  // UPDATE TRANSACTION
  // ============================================
  const updateTransaction = useCallback(
    async (id, updates) => {
      let oldTransaction;
      try {
        // Optimistic Update
        oldTransaction = transactions.find((t) => t.id === id);
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
        );

        // API Call
        const updated = await transactionService.updateTransaction(id, updates);
        setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
        showSuccess('Transaktion aktualisiert');

        // Reload stats from backend
        await fetchStats();

        return updated;
      } catch (err) {
        // Rollback bei Fehler
        if (oldTransaction) {
          setTransactions((prev) => prev.map((t) => (t.id === id ? oldTransaction : t)));
        }
        if (err.status === 403) {
          showError("You don't have permission");
        } else if (err.status === 401) {
          showError('Bitte neu einloggen');
        } else {
          showError('Fehler beim Aktualisieren der Transaktion');
        }
        throw err;
      }
    },
    [transactions, showSuccess, showError, fetchStats]
  );

  // ============================================
  // DELETE TRANSACTION
  // ============================================
  const deleteTransaction = useCallback(
    async (id) => {
      let oldTransactions;
      try {
        // Optimistic Update
        oldTransactions = transactions;
        setTransactions((prev) => prev.filter((t) => t.id !== id));

        // API Call
        await transactionService.deleteTransaction(id);
        showSuccess('Transaktion gelöscht');

        // Reload stats from backend
        await fetchStats();

        return true;
      } catch (err) {
        // Rollback bei Fehler
        setTransactions(oldTransactions);
        if (err.status === 403) {
          showError("You don't have permission");
        } else if (err.status === 401) {
          showError('Bitte neu einloggen');
        } else {
          showError('Fehler beim Löschen der Transaktion');
        }
        throw err;
      }
    },
    [transactions, showSuccess, showError, fetchStats]
  );

  // ============================================
  // INITIAL LOAD
  // ============================================
  useEffect(() => {
    fetchTransactions(initialPage, initialLimit);
    fetchStats();
  }, [initialPage, initialLimit, fetchTransactions, fetchStats]);

  // ============================================
  // CALCULATE STATS
  // ============================================
  const calculateStats = useCallback(() => {
    if (transactions.length === 0) {
      return {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        count: 0,
        averageExpense: 0,
      };
    }

    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome: income,
      totalExpense: expenses,
      balance: income - expenses,
      count: transactions.length,
      averageExpense: expenses / transactions.filter((t) => t.type === 'expense').length || 0,
    };
  }, [transactions]);

  // ============================================
  // FILTER & SEARCH
  // ============================================
  const filterTransactions = useCallback((filters) => {
    // Lokales Filtering (später mit Backend-Filter kombinieren)
    const { type, category, searchText, startDate, endDate } = filters;

    let filtered = transactions;

    if (type) {
      filtered = filtered.filter((t) => t.type === type);
    }

    if (category) {
      filtered = filtered.filter((t) => t.category === category);
    }

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(search) ||
          t.category.toLowerCase().includes(search)
      );
    }

    if (startDate) {
      filtered = filtered.filter((t) => new Date(t.date) >= new Date(startDate));
    }

    if (endDate) {
      filtered = filtered.filter((t) => new Date(t.date) <= new Date(endDate));
    }

    return filtered;
  }, [transactions]);

  // ============================================
  // CALCULATIONS
  // ============================================
  // calculateStats ist bereits oben definiert

  return {
    // States
    transactions,
    pagination,
    loading,
    error,
    stats,

    // Methods
    fetchTransactions,
    fetchStats,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    filterTransactions,
    calculateStats,
  };
}

export default useTransactions;
