/**
 * @fileoverview Local Transaction Storage Tests
 * @description Tests für sessionStorage-basierte Transaktionsverwaltung (Guest Mode)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getLocalTransactions,
  createLocalTransaction,
  updateLocalTransaction,
  deleteLocalTransaction,
  getFilteredLocalTransactions,
  computeLocalDashboardData,
  clearGuestTransactions,
  initLocalSession,
} from '@/utils/localTransactionStorage';

// ============================================================================
// MOCK i18n
// ============================================================================
vi.mock('@/i18n', () => ({
  default: { t: key => key },
}));

// ============================================================================
// HELPERS
// ============================================================================
const STORAGE_KEY = 'finora_local_transactions';

function seedStorage(transactions) {
  window.sessionStorage.getItem.mockReturnValue(JSON.stringify(transactions));
}

function getWrittenData() {
  const call = window.sessionStorage.setItem.mock.calls.find(c => c[0] === STORAGE_KEY);
  return call ? JSON.parse(call[1]) : null;
}

// ============================================================================
// TESTS
// ============================================================================
describe('localTransactionStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.getItem.mockReturnValue(null);
  });

  // ──────────────────────────────────────────────────────────
  // initLocalSession
  // ──────────────────────────────────────────────────────────
  describe('initLocalSession', () => {
    it('should not throw', () => {
      expect(() => initLocalSession()).not.toThrow();
    });
  });

  // ──────────────────────────────────────────────────────────
  // getLocalTransactions
  // ──────────────────────────────────────────────────────────
  describe('getLocalTransactions', () => {
    it('returns empty array when storage is empty', () => {
      expect(getLocalTransactions()).toEqual([]);
    });

    it('returns parsed transactions from storage', () => {
      const txs = [{ id: '1', amount: 100 }];
      seedStorage(txs);
      expect(getLocalTransactions()).toEqual(txs);
    });

    it('returns empty array on malformed JSON', () => {
      window.sessionStorage.getItem.mockReturnValue('NOT_JSON');
      expect(getLocalTransactions()).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────────────────
  // createLocalTransaction
  // ──────────────────────────────────────────────────────────
  describe('createLocalTransaction', () => {
    it('creates a transaction with generated id and timestamps', () => {
      const result = createLocalTransaction({
        type: 'income',
        amount: 500,
        category: 'Gehalt',
        description: 'Monatsgehalt',
      });

      expect(result.id).toMatch(/^local_/);
      expect(result.type).toBe('income');
      expect(result.amount).toBe(500);
      expect(result.category).toBe('Gehalt');
      expect(result.description).toBe('Monatsgehalt');
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('prepends transaction to storage (newest first)', () => {
      const existing = [{ id: 'old', amount: 10 }];
      seedStorage(existing);

      createLocalTransaction({ amount: 200 });
      const written = getWrittenData();
      expect(written.length).toBe(2);
      expect(written[0].amount).toBe(200);
      expect(written[1].id).toBe('old');
    });

    it('uses defaults for missing fields', () => {
      const result = createLocalTransaction({});
      expect(result.type).toBe('expense');
      expect(result.amount).toBe(0);
      expect(result.category).toBe('');
      expect(result.description).toBe('');
      expect(result.tags).toEqual([]);
      expect(result.notes).toBe('');
    });

    it('dispatches info toast on first transaction', () => {
      vi.useFakeTimers();
      const dispatchSpy = vi.fn();
      window.dispatchEvent = dispatchSpy;

      createLocalTransaction({ amount: 100 });

      // Toast is delayed by 2 seconds
      vi.advanceTimersByTime(2500);
      expect(dispatchSpy).toHaveBeenCalled();
      const event = dispatchSpy.mock.calls.find(
        c => c[0] instanceof CustomEvent && c[0].type === 'toast:add'
      );
      expect(event).toBeDefined();

      vi.useRealTimers();
    });

    it('does NOT dispatch toast when storage already has transactions', () => {
      vi.useFakeTimers();
      const dispatchSpy = vi.fn();
      window.dispatchEvent = dispatchSpy;

      seedStorage([{ id: 'existing', amount: 10 }]);
      createLocalTransaction({ amount: 200 });

      vi.advanceTimersByTime(3000);
      const toastEvents = dispatchSpy.mock.calls.filter(
        c => c[0] instanceof CustomEvent && c[0].type === 'toast:add'
      );
      expect(toastEvents.length).toBe(0);

      vi.useRealTimers();
    });

    it('generates unique IDs for rapid calls', () => {
      const ids = new Set();
      for (let i = 0; i < 10; i++) {
        const tx = createLocalTransaction({ amount: i });
        ids.add(tx.id);
      }
      expect(ids.size).toBe(10);
    });
  });

  // ──────────────────────────────────────────────────────────
  // updateLocalTransaction
  // ──────────────────────────────────────────────────────────
  describe('updateLocalTransaction', () => {
    it('updates an existing transaction', () => {
      seedStorage([{ id: 'tx-1', amount: 100, category: 'Food' }]);

      const result = updateLocalTransaction('tx-1', { amount: 200 });
      expect(result.amount).toBe(200);
      expect(result.id).toBe('tx-1'); // ID preserved
      expect(result.updatedAt).toBeDefined();
    });

    it('preserves unmodified fields', () => {
      seedStorage([{ id: 'tx-1', amount: 100, category: 'Food', description: 'Lunch' }]);

      const result = updateLocalTransaction('tx-1', { amount: 200 });
      expect(result.category).toBe('Food');
      expect(result.description).toBe('Lunch');
    });

    it('throws for non-existent transaction', () => {
      seedStorage([{ id: 'tx-1', amount: 100 }]);
      expect(() => updateLocalTransaction('nonexistent', { amount: 200 })).toThrow(
        'Transaction not found'
      );
    });

    it('writes updated data to storage', () => {
      seedStorage([{ id: 'tx-1', amount: 100 }]);
      updateLocalTransaction('tx-1', { amount: 999 });
      const written = getWrittenData();
      expect(written[0].amount).toBe(999);
    });
  });

  // ──────────────────────────────────────────────────────────
  // deleteLocalTransaction
  // ──────────────────────────────────────────────────────────
  describe('deleteLocalTransaction', () => {
    it('removes transaction by id', () => {
      seedStorage([
        { id: 'tx-1', amount: 100 },
        { id: 'tx-2', amount: 200 },
      ]);
      deleteLocalTransaction('tx-1');
      const written = getWrittenData();
      expect(written.length).toBe(1);
      expect(written[0].id).toBe('tx-2');
    });

    it('does nothing for non-existent id', () => {
      seedStorage([{ id: 'tx-1', amount: 100 }]);
      deleteLocalTransaction('nonexistent');
      const written = getWrittenData();
      expect(written.length).toBe(1);
    });
  });

  // ──────────────────────────────────────────────────────────
  // getFilteredLocalTransactions
  // ──────────────────────────────────────────────────────────
  describe('getFilteredLocalTransactions', () => {
    const txs = [
      {
        id: '1',
        type: 'income',
        amount: 500,
        category: 'Gehalt',
        description: 'Salary',
        date: '2025-06-15T00:00:00Z',
        notes: '',
      },
      {
        id: '2',
        type: 'expense',
        amount: 50,
        category: 'Food',
        description: 'Lunch',
        date: '2025-06-10T00:00:00Z',
        notes: 'work',
      },
      {
        id: '3',
        type: 'expense',
        amount: 200,
        category: 'Rent',
        description: 'Miete',
        date: '2025-05-01T00:00:00Z',
        notes: '',
      },
      {
        id: '4',
        type: 'income',
        amount: 100,
        category: 'Freelance',
        description: 'Project',
        date: '2025-06-20T00:00:00Z',
        notes: '',
      },
    ];

    beforeEach(() => seedStorage(txs));

    it('returns all transactions without filters', () => {
      const result = getFilteredLocalTransactions({
        filter: {},
        sortBy: 'date',
        sortOrder: 'desc',
        page: 1,
        limit: 20,
      });
      expect(result.data.length).toBe(4);
      expect(result.pagination.total).toBe(4);
    });

    it('filters by type', () => {
      const result = getFilteredLocalTransactions({
        filter: { type: 'income' },
        sortBy: 'date',
        sortOrder: 'desc',
        page: 1,
        limit: 20,
      });
      expect(result.data.length).toBe(2);
      expect(result.data.every(t => t.type === 'income')).toBe(true);
    });

    it('filters by category', () => {
      const result = getFilteredLocalTransactions({
        filter: { category: 'Food' },
        sortBy: 'date',
        sortOrder: 'desc',
        page: 1,
        limit: 20,
      });
      expect(result.data.length).toBe(1);
      expect(result.data[0].category).toBe('Food');
    });

    it('filters by date range', () => {
      const result = getFilteredLocalTransactions({
        filter: { startDate: '2025-06-01', endDate: '2025-06-30' },
        sortBy: 'date',
        sortOrder: 'desc',
        page: 1,
        limit: 20,
      });
      expect(result.data.length).toBe(3); // June transactions only
    });

    it('filters by search query (description, category, notes)', () => {
      const result = getFilteredLocalTransactions({
        filter: { searchQuery: 'lunch' },
        sortBy: 'date',
        sortOrder: 'desc',
        page: 1,
        limit: 20,
      });
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe('2');
    });

    it('search query matches notes', () => {
      const result = getFilteredLocalTransactions({
        filter: { searchQuery: 'work' },
        sortBy: 'date',
        sortOrder: 'desc',
        page: 1,
        limit: 20,
      });
      expect(result.data.length).toBe(1);
    });

    it('sorts by date ascending', () => {
      const result = getFilteredLocalTransactions({
        filter: {},
        sortBy: 'date',
        sortOrder: 'asc',
        page: 1,
        limit: 20,
      });
      const dates = result.data.map(t => new Date(t.date).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i - 1]);
      }
    });

    it('sorts by amount descending', () => {
      const result = getFilteredLocalTransactions({
        filter: {},
        sortBy: 'amount',
        sortOrder: 'desc',
        page: 1,
        limit: 20,
      });
      expect(result.data[0].amount).toBe(500);
      expect(result.data[result.data.length - 1].amount).toBe(50);
    });

    it('paginates correctly', () => {
      const result = getFilteredLocalTransactions({
        filter: {},
        sortBy: 'date',
        sortOrder: 'desc',
        page: 1,
        limit: 2,
      });
      expect(result.data.length).toBe(2);
      expect(result.pagination).toEqual({ page: 1, limit: 2, total: 4, pages: 2 });
    });

    it('returns correct second page', () => {
      const result = getFilteredLocalTransactions({
        filter: {},
        sortBy: 'date',
        sortOrder: 'desc',
        page: 2,
        limit: 2,
      });
      expect(result.data.length).toBe(2);
      expect(result.pagination.page).toBe(2);
    });

    it('pages defaults to 1 when no data', () => {
      window.sessionStorage.getItem.mockReturnValue(JSON.stringify([]));
      const result = getFilteredLocalTransactions({
        filter: {},
        sortBy: 'date',
        sortOrder: 'desc',
        page: 1,
        limit: 20,
      });
      expect(result.pagination.pages).toBe(1);
    });
  });

  // ──────────────────────────────────────────────────────────
  // computeLocalDashboardData
  // ──────────────────────────────────────────────────────────
  describe('computeLocalDashboardData', () => {
    const txs = [
      // June 2025
      { id: '1', type: 'income', amount: 3000, category: 'Gehalt', date: '2025-06-15T00:00:00Z' },
      { id: '2', type: 'expense', amount: 800, category: 'Miete', date: '2025-06-01T00:00:00Z' },
      { id: '3', type: 'expense', amount: 200, category: 'Food', date: '2025-06-10T00:00:00Z' },
      // May 2025 (previous month)
      { id: '4', type: 'income', amount: 2500, category: 'Gehalt', date: '2025-05-15T00:00:00Z' },
      { id: '5', type: 'expense', amount: 800, category: 'Miete', date: '2025-05-01T00:00:00Z' },
    ];

    beforeEach(() => seedStorage(txs));

    it('computes summary for current month', () => {
      const data = computeLocalDashboardData(6, 2025);
      expect(data.summary.currentMonth.income).toBe(3000);
      expect(data.summary.currentMonth.expense).toBe(1000);
      expect(data.summary.currentMonth.balance).toBe(2000);
      expect(data.summary.currentMonth.transactionCount).toBe(3);
    });

    it('computes trends vs previous month', () => {
      const data = computeLocalDashboardData(6, 2025);
      // Income: (3000 - 2500) / 2500 = 20%
      expect(data.summary.trends.income).toBe(20);
      // Expense: (1000 - 800) / 800 = 25%
      expect(data.summary.trends.expense).toBe(25);
    });

    it('handles trend when previous month is 0', () => {
      seedStorage([{ id: '1', type: 'income', amount: 100, date: '2025-03-15T00:00:00Z' }]);
      const data = computeLocalDashboardData(3, 2025);
      expect(data.summary.trends.income).toBe(100);
    });

    it('handles trend when both months are 0', () => {
      seedStorage([]);
      const data = computeLocalDashboardData(6, 2025);
      expect(data.summary.trends.income).toBe(0);
      expect(data.summary.trends.expense).toBe(0);
    });

    it('computes categoryBreakdown sorted by total descending', () => {
      const data = computeLocalDashboardData(6, 2025);
      expect(data.categoryBreakdown.length).toBeGreaterThan(0);
      expect(data.categoryBreakdown[0].total).toBeGreaterThanOrEqual(
        data.categoryBreakdown[data.categoryBreakdown.length - 1].total
      );
    });

    it('categoryBreakdown groups by type:category', () => {
      const data = computeLocalDashboardData(6, 2025);
      const gehalt = data.categoryBreakdown.find(
        c => c.category === 'Gehalt' && c.type === 'income'
      );
      expect(gehalt).toBeDefined();
      expect(gehalt.total).toBe(3000);
      expect(gehalt.count).toBe(1);
    });

    it('returns monthly trend for last 6 months', () => {
      const data = computeLocalDashboardData(6, 2025);
      expect(data.monthlyTrend.length).toBe(6);
      // Last entry should be current month
      expect(data.monthlyTrend[5].month).toBe(6);
      expect(data.monthlyTrend[5].year).toBe(2025);
    });

    it('handles year boundary in monthly trend (January)', () => {
      const data = computeLocalDashboardData(1, 2025);
      expect(data.monthlyTrend[0].month).toBe(8);
      expect(data.monthlyTrend[0].year).toBe(2024);
      expect(data.monthlyTrend[5].month).toBe(1);
      expect(data.monthlyTrend[5].year).toBe(2025);
    });

    it('returns recent transactions (max 5, sorted newest first)', () => {
      const data = computeLocalDashboardData(6, 2025);
      expect(data.recentTransactions.length).toBeLessThanOrEqual(5);
      if (data.recentTransactions.length > 1) {
        const dates = data.recentTransactions.map(t => new Date(t.date).getTime());
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
        }
      }
    });

    it('returns empty data for month with no transactions', () => {
      const data = computeLocalDashboardData(12, 2030);
      expect(data.summary.currentMonth.income).toBe(0);
      expect(data.summary.currentMonth.expense).toBe(0);
      expect(data.recentTransactions.length).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────
  // clearGuestTransactions
  // ──────────────────────────────────────────────────────────
  describe('clearGuestTransactions', () => {
    it('removes the storage key', () => {
      clearGuestTransactions();
      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    });

    it('does not throw when sessionStorage fails', () => {
      window.sessionStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => clearGuestTransactions()).not.toThrow();
    });
  });
});
