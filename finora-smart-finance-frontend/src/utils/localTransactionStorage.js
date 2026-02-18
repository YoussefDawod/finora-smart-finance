/**
 * @fileoverview Local Transaction Storage
 * @description sessionStorage-basierte Transaktionsverwaltung für nicht-angemeldete Nutzer.
 * Daten überleben normales Reload (F5) im selben Tab, werden aber beim Schließen
 * des Tabs automatisch gelöscht (sessionStorage-Verhalten).
 */

import i18n from '@/i18n';

const STORAGE_KEY = 'finora_local_transactions';

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Initialisiert die Session.
 * sessionStorage wird automatisch beim Tab-Close gelöscht, keine manuelle Prüfung nötig.
 */
export function initLocalSession() {
  // sessionStorage is automatically cleared when tab closes
  // No manual session tracking needed
}

// ============================================================================
// HELPERS
// ============================================================================

// Counter für ID-Uniqueness innerhalb derselben Millisekunde
let idCounter = 0;
let lastIdTimestamp = 0;

function generateId() {
  const now = Date.now();
  
  // Wenn innerhalb derselben Millisekunde, erhöhe Counter
  if (now === lastIdTimestamp) {
    idCounter++;
  } else {
    idCounter = 0;
    lastIdTimestamp = now;
  }
  
  return `local_${now}_${idCounter}_${Math.random().toString(36).slice(2, 9)}`;
}

function readStorage() {
  try {
    const data = globalThis.sessionStorage?.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function writeStorage(transactions) {
  try {
    globalThis.sessionStorage?.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (e) {
    globalThis.console?.error('Failed to save transactions to sessionStorage:', e);
    
    // QuotaExceededError - Speicher ist voll!
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      globalThis.window?.dispatchEvent(
        // eslint-disable-next-line no-undef
        new CustomEvent('toast:add', {
          detail: {
            type: 'error',
            message: i18n.t('guest.storageFull'),
            duration: 10000,
          },
        })
      );
    }
    
    // Re-throw für weitere Error-Behandlung
    throw e;
  }
}

// ============================================================================
// CRUD
// ============================================================================

export function getLocalTransactions() {
  return readStorage();
}

export function createLocalTransaction(data) {
  const transactions = readStorage();
  const isFirstTransaction = transactions.length === 0;
  
  const newTx = {
    id: generateId(),
    type: data.type || 'expense',
    amount: Number(data.amount) || 0,
    category: data.category || '',
    description: data.description || '',
    date: data.date || new Date().toISOString(),
    tags: data.tags || [],
    notes: data.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  transactions.unshift(newTx);
  writeStorage(transactions);
  
  // Toast bei ERSTER Transaction für unauthentifizierte User
  if (isFirstTransaction) {
    // Delay von 2 Sekunden damit User die Transaction erst sieht
    setTimeout(() => {
      globalThis.window?.dispatchEvent(
        // eslint-disable-next-line no-undef
        new CustomEvent('toast:add', {
          detail: {
            type: 'info',
            message: i18n.t('guest.localStorageWarning'),
            duration: 8000,
          },
        })
      );
    }, 2000);
  }
  
  return newTx;
}

export function updateLocalTransaction(id, data) {
  const transactions = readStorage();
  const index = transactions.findIndex((tx) => tx.id === id);
  if (index === -1) throw new Error('Transaction not found');
  transactions[index] = {
    ...transactions[index],
    ...data,
    id: id, // preserve ID
    updatedAt: new Date().toISOString(),
  };
  writeStorage(transactions);
  return transactions[index];
}

export function deleteLocalTransaction(id) {
  const transactions = readStorage();
  writeStorage(transactions.filter((tx) => tx.id !== id));
}

// ============================================================================
// FILTERED + PAGINATED LIST
// ============================================================================

export function getFilteredLocalTransactions({ filter, sortBy, sortOrder, page, limit }) {
  let transactions = readStorage();

  // Filter
  if (filter?.type) {
    transactions = transactions.filter((tx) => tx.type === filter.type);
  }
  if (filter?.category) {
    transactions = transactions.filter((tx) => tx.category === filter.category);
  }
  if (filter?.startDate) {
    const start = new Date(filter.startDate);
    transactions = transactions.filter((tx) => new Date(tx.date) >= start);
  }
  if (filter?.endDate) {
    const end = new Date(filter.endDate);
    transactions = transactions.filter((tx) => new Date(tx.date) <= end);
  }
  if (filter?.searchQuery) {
    const q = filter.searchQuery.toLowerCase();
    transactions = transactions.filter(
      (tx) =>
        tx.description?.toLowerCase().includes(q) ||
        tx.category?.toLowerCase().includes(q) ||
        tx.notes?.toLowerCase().includes(q)
    );
  }

  // Sort
  transactions.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'date') cmp = new Date(a.date) - new Date(b.date);
    else if (sortBy === 'amount') cmp = a.amount - b.amount;
    return sortOrder === 'desc' ? -cmp : cmp;
  });

  // Paginate
  const total = transactions.length;
  const pages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;
  const data = transactions.slice(start, start + limit);

  return { data, pagination: { page, limit, total, pages } };
}

// ============================================================================
// DASHBOARD DATA (berechnet aus lokalen Transaktionen)
// ============================================================================

function sumByType(txs, type) {
  return txs.filter((tx) => tx.type === type).reduce((sum, tx) => sum + tx.amount, 0);
}

function filterByMonth(transactions, month, year) {
  return transactions.filter((tx) => {
    // Verwende UTC-Methoden für konsistente Ergebnisse unabhängig von Zeitzone
    const d = new Date(tx.date);
    return d.getUTCMonth() + 1 === month && d.getUTCFullYear() === year;
  });
}

function calcTrend(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function computeLocalDashboardData(month, year) {
  const allTransactions = readStorage();

  // Current month
  const currentMonthTx = filterByMonth(allTransactions, month, year);
  const currentIncome = sumByType(currentMonthTx, 'income');
  const currentExpense = sumByType(currentMonthTx, 'expense');

  // Previous month (for trends)
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonthTx = filterByMonth(allTransactions, prevMonth, prevYear);
  const prevIncome = sumByType(prevMonthTx, 'income');
  const prevExpense = sumByType(prevMonthTx, 'expense');

  // Summary (format matching API response)
  const summary = {
    currentMonth: {
      income: currentIncome,
      expense: currentExpense,
      balance: currentIncome - currentExpense,
      transactionCount: currentMonthTx.length,
    },
    totalTransactions: currentMonthTx.length,
    trends: {
      income: calcTrend(currentIncome, prevIncome),
      expense: calcTrend(currentExpense, prevExpense),
      balance: calcTrend(
        currentIncome - currentExpense,
        prevIncome - prevExpense
      ),
    },
  };

  // Category Breakdown (format matching API: type, category, total, count)
  const categoryMap = {};
  currentMonthTx.forEach((tx) => {
    const key = `${tx.type}:${tx.category}`;
    if (!categoryMap[key]) {
      categoryMap[key] = { type: tx.type, category: tx.category, total: 0, count: 0 };
    }
    categoryMap[key].total += tx.amount;
    categoryMap[key].count += 1;
  });

  const categoryBreakdown = Object.values(categoryMap)
    .map((item) => ({
      ...item,
      total: Math.round(item.total * 100) / 100,
    }))
    .sort((a, b) => b.total - a.total);

  // Monthly Trend (last 6 months, key matches API: monthlyTrend)
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    let m = month - i;
    let y = year;
    while (m <= 0) {
      m += 12;
      y--;
    }
    const monthTx = filterByMonth(allTransactions, m, y);
    monthlyTrend.push({
      month: m,
      year: y,
      income: sumByType(monthTx, 'income'),
      expense: sumByType(monthTx, 'expense'),
    });
  }

  // Recent Transactions (latest 5)
  const recentTransactions = [...currentMonthTx]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return { summary, categoryBreakdown, monthlyTrend, recentTransactions };
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Löscht alle gespeicherten Guest-Transaktionen.
 * Wird beim Logout aufgerufen um sicherzustellen, dass keine stale Daten bleiben.
 */
export function clearGuestTransactions() {
  try {
    globalThis.sessionStorage?.removeItem(STORAGE_KEY);
  } catch (e) {
    globalThis.console?.warn('Failed to clear guest transactions:', e);
  }
}
