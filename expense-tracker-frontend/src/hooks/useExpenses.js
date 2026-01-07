import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { transactionService } from '../api/transactionService';
import useToast from './useToast';

/**
 * Enhanced useExpenses Hook mit Optimistic Updates
 * Features:
 *   - Optimistic Create/Update/Delete
 *   - Rollback bei Fehlern
 *   - Offline Sync Queue
 *   - Caching
 *   - Batch Operations
 */
export function useExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncQueue, setSyncQueue] = useState([]);
  const previousExpensesRef = useRef(null);
  const [filters, setFilters] = useState({
    category: 'all',
    searchTerm: '',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const { showSuccess, showError, showWarning } = useToast();

  // ============================================
  // FETCH EXPENSES
  // ============================================
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const apiFilters = {
        ...filters,
        category: filters.category === 'all' ? undefined : filters.category,
      };
      const result = await transactionService.getTransactions(apiFilters);
      setExpenses(result.data || result || []);
      setSyncQueue([]); // Clear sync queue after successful fetch
    } catch (error) {
      showError('Fehler beim Laden der Ausgaben');
      console.error('Fetch expenses error:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, showError]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // ============================================
  // MEMOIZED FILTERED EXPENSES
  // ============================================
  const filteredExpenses = useMemo(() => {
    let result = expenses;

    // Search filter
    if (filters.searchTerm) {
      result = result.filter((exp) =>
        exp.description?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // Sorting
    const sortFn = (a, b) => {
      const aVal = a[filters.sortBy] || 0;
      const bVal = b[filters.sortBy] || 0;
      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    };

    return result.sort(sortFn);
  }, [expenses, filters.searchTerm, filters.sortBy, filters.sortOrder]);

  // ============================================
  // STATISTICS
  // ============================================
  const statistics = useMemo(() => {
    const total = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const count = expenses.length;
    const average = count > 0 ? total / count : 0;

    const byCategory = expenses.reduce((acc, exp) => {
      const category = exp.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + (exp.amount || 0);
      return acc;
    }, {});

    return { total, count, average, byCategory };
  }, [expenses]);

  // ============================================
  // CREATE - with Optimistic Update
  // ============================================
  const addExpense = useCallback(
    async (expenseData) => {
      const optimisticExpense = {
        id: `temp-${crypto.getRandomValues(new Uint8Array(8)).join('')}`,
        ...expenseData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _optimistic: true,
      };

      previousExpensesRef.current = expenses;
      setExpenses((prev) => [optimisticExpense, ...prev]);

      try {
        const newExpense = await transactionService.createTransaction(expenseData);

        setExpenses((prev) =>
          prev.map((exp) =>
            exp.id === optimisticExpense.id
              ? { ...newExpense, _optimistic: false }
              : exp
          )
        );

        showSuccess('✅ Ausgabe erfolgreich hinzugefügt');
        return newExpense;
      } catch (error) {
        setExpenses(previousExpensesRef.current);

        setSyncQueue((prev) => [
          ...prev,
          {
            id: optimisticExpense.id,
            type: 'CREATE',
            data: expenseData,
            timestamp: Date.now(),
          },
        ]);

        showError('❌ Fehler beim Hinzufügen. Wird erneut versucht...');
        throw error;
      }
    },
    [expenses, showSuccess, showError]
  );

  // ============================================
  // UPDATE - with Optimistic Update
  // ============================================
  const updateExpense = useCallback(
    async (id, updates) => {
      previousExpensesRef.current = expenses;

      setExpenses((prev) =>
        prev.map((exp) =>
          exp.id === id
            ? {
                ...exp,
                ...updates,
                updatedAt: new Date().toISOString(),
                _optimistic: true,
              }
            : exp
        )
      );

      try {
        const updated = await transactionService.updateTransaction(id, updates);

        setExpenses((prev) =>
          prev.map((exp) =>
            exp.id === id ? { ...updated, _optimistic: false } : exp
          )
        );

        showSuccess('✅ Ausgabe aktualisiert');
        return updated;
      } catch (error) {
        setExpenses(previousExpensesRef.current);

        setSyncQueue((prev) => [
          ...prev,
          {
            id,
            type: 'UPDATE',
            data: updates,
            timestamp: Date.now(),
          },
        ]);

        showError('❌ Fehler beim Aktualisieren. Wird erneut versucht...');
        throw error;
      }
    },
    [expenses, showSuccess, showError]
  );

  // ============================================
  // DELETE - with Optimistic Update
  // ============================================
  const deleteExpense = useCallback(
    async (id) => {
      previousExpensesRef.current = expenses;

      setExpenses((prev) => prev.filter((exp) => exp.id !== id));

      try {
        await transactionService.deleteTransaction(id);
        showSuccess('✅ Ausgabe gelöscht');
      } catch (error) {
        setExpenses(previousExpensesRef.current);

        setSyncQueue((prev) => [
          ...prev,
          {
            id,
            type: 'DELETE',
            timestamp: Date.now(),
          },
        ]);

        showError('❌ Fehler beim Löschen. Wird erneut versucht...');
        throw error;
      }
    },
    [expenses, showSuccess, showError]
  );

  // ============================================
  // BATCH DELETE
  // ============================================
  const deleteMultiple = useCallback(
    async (ids) => {
      previousExpensesRef.current = expenses;

      setExpenses((prev) => prev.filter((exp) => !ids.includes(exp.id)));

      try {
        await Promise.all(
          ids.map((id) => transactionService.deleteTransaction(id))
        );
        showSuccess(`✅ ${ids.length} Ausgaben gelöscht`);
      } catch (error) {
        setExpenses(previousExpensesRef.current);
        showError('❌ Fehler beim Löschen. Bitte versuche es erneut.');
        throw error;
      }
    },
    [expenses, showSuccess, showError]
  );

  // ============================================
  // SYNC QUEUE - Retry offline changes
  // ============================================
  const syncOfflineChanges = useCallback(async () => {
    if (syncQueue.length === 0) return;

    showWarning(`⏳ Synchronisiere ${syncQueue.length} ausstehende Änderung(en)...`);

    const results = [];
    for (const item of syncQueue) {
      try {
        if (item.type === 'CREATE') {
          await transactionService.createTransaction(item.data);
        } else if (item.type === 'UPDATE') {
          await transactionService.updateTransaction(item.id, item.data);
        } else if (item.type === 'DELETE') {
          await transactionService.deleteTransaction(item.id);
        }
        results.push({ ...item, success: true });
      } catch (error) {
        results.push({ ...item, success: false, error });
      }
    }

    setSyncQueue((prev) =>
      prev.filter((item) => !results.find((r) => r.id === item.id && r.success))
    );

    const successCount = results.filter((r) => r.success).length;
    if (successCount > 0) {
      showSuccess(`✅ ${successCount} Änderung(en) synchronisiert`);
      await fetchExpenses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncQueue, showWarning, showSuccess, showError, fetchExpenses]);

  // ============================================
  // FILTERS
  // ============================================
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  return {
    expenses: filteredExpenses,
    statistics,
    filters,
    loading,
    syncQueue,
    addExpense,
    deleteExpense,
    deleteMultiple,
    updateExpense,
    updateFilters,
    refetch: fetchExpenses,
    syncOfflineChanges,
  };
}
