import React, { useState, useCallback, useMemo } from 'react';
import { useTransactions, useToast } from './hooks';
import useFilteredTransactions from './hooks/useFilteredTransactions';
import TransactionList from './components/Transaction/TransactionList';
import TransactionForm from './components/Transaction/TransactionForm';
import Modal from './components/Modal/Modal';
import FilterBar from './components/Filter/FilterBar';
import ToastContainer from './components/Toast/ToastContainer';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { NetworkStatusBanner } from './components/NetworkStatusBanner/NetworkStatusBanner';
import APIDebugDashboard from './components/APIDebugDashboard';
import ThemeSwitcher from './components/ThemeSwitcher';
import UserMenu from './components/UserMenu';
import './styles/main.scss';
import './styles/layout.scss';
import './styles/auth.scss';

/**
 * App - Hauptkomponente der Expense Tracker Anwendung
 * Wrapped in ErrorBoundary für globale Fehlerbehandlung
 */
function AppContent() {
  // Custom Hook für Transaktionen
  const {
    transactions,
    pagination,
    loading,
    error,
    stats,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    calculateStats,
  } = useTransactions(1, 10);

  // Filter States
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    category: 'all',
    sortBy: 'date-desc',
  });

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Gefilterte Transaktionen
  const { filtered: filteredTransactions } = useFilteredTransactions(transactions, filters);

  // Kategorien extrahieren
  const categories = useMemo(() => {
    const cats = new Set();
    transactions.forEach((t) => cats.add(t.category));
    return Array.from(cats).sort();
  }, [transactions]);

  // Stats für gefilterte Transaktionen
  const filteredStats = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, t) => {
        if (t.type === 'income') {
          acc.income += t.amount;
        } else {
          acc.expense += t.amount;
        }
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [filteredTransactions]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleOpenModal = useCallback(() => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  }, []);

  const handleEdit = useCallback((id) => {
    const transaction = transactions.find((t) => t.id === id);
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  }, [transactions]);

  const { success, error: errorToast } = useToast();

  const handleDelete = useCallback(
    async (id) => {
      if (!confirm('Transaktion wirklich löschen?')) return;

      try {
        setFormLoading(true);
        await deleteTransaction(id);
        success('✓ Transaktion gelöscht!');
      } catch (err) {
        errorToast('❌ Fehler beim Löschen: ' + err.message, { duration: 5000 });
      } finally {
        setFormLoading(false);
      }
    },
    [deleteTransaction, success, errorToast]
  );

  const handleSubmit = useCallback(
    async (data) => {
      try {
        setFormLoading(true);

        if (editingTransaction) {
          await updateTransaction(editingTransaction.id, data);
          success('✓ Transaktion aktualisiert!');
        } else {
          await createTransaction(data);
          success('✓ Transaktion erstellt!');
        }

        setFormLoading(false);
        handleCloseModal();
      } catch (err) {
        errorToast(
          '❌ Fehler: ' + (err.response?.data?.message || err.message),
          { duration: 5000 }
        );
        setFormLoading(false);
      }
    },
    [editingTransaction, createTransaction, updateTransaction, handleCloseModal, success, errorToast]
  );

  const formatAmount = (val) => Number(val ?? 0).toFixed(2);

  return (
    <div className="app">
      <NetworkStatusBanner />
      {/* Skip to Content Link (A11y) */}
      <a href="#main-content" className="skip-to-content">
        Zum Hauptinhalt springen
      </a>

      {/* Toast Container */}
      <ToastContainer />

      <header className="app__header" role="banner">
        <div className="container app__header-grid">
          <div className="app__branding">
            <h1>Expense Tracker</h1>
            <p className="text-muted">Verwalte deine Ausgaben einfach und übersichtlich</p>
          </div>
          <div className="app__header-actions">
            <ThemeSwitcher compact />
            <UserMenu />
          </div>
        </div>
      </header>

      <main id="main-content" className="app__main" role="main">
        <div className="container">
          {/* Alle Statistiken (nicht gefiltert) */}
          <section className="app__stats" aria-label="Finanzübersicht">
            <div className="stat-card">
              <p className="stat-card__label">Einnahmen gesamt</p>
              <p className="stat-card__value">
                €{formatAmount(stats.totalIncome)}
              </p>
            </div>
            <div className="stat-card">
              <p className="stat-card__label">Ausgaben gesamt</p>
              <p className="stat-card__value">
                €{formatAmount(stats.totalExpense)}
              </p>
            </div>
            <div className="stat-card">
              <p className="stat-card__label">Balance</p>
              <p
                className={`stat-card__value ${
                  stats.balance >= 0 ? 'stat-card__value--positive' : 'stat-card__value--negative'
                }`}
              >
                €{formatAmount(stats.balance)}
              </p>
            </div>
          </section>

          {/* Transaktionen */}
          <section className="app__transactions" aria-labelledby="transactions-heading">
            <div className="app__transactions-header">
              <div>
                <h2 id="transactions-heading">Transaktionen</h2>
                <p className="text-small text-muted" aria-live="polite" aria-atomic="true">
                  {filteredTransactions.length} von {transactions.length} Einträgen
                </p>
              </div>
              <button 
                className="btn btn--primary btn--sm" 
                onClick={handleOpenModal}
                aria-label="Neue Transaktion erstellen"
              >
                + Neu
              </button>
            </div>

            {/* Filter Bar */}
            <FilterBar
              onFilterChange={handleFilterChange}
              categories={categories}
              showAdvanced={true}
            />

            {/* Gefilterte Transaktionen */}
            <div className="app__transactions-content">
              {filteredTransactions.length > 0 && (
                <div className="app__stats-filtered mb-lg">
                  <div className="stat-card stat-card--small">
                    <p className="stat-card__label">Einnahmen (gefiltert)</p>
                    <p className="stat-card__value">
                      €{formatAmount(filteredStats.income)}
                    </p>
                  </div>
                  <div className="stat-card stat-card--small">
                    <p className="stat-card__label">Ausgaben (gefiltert)</p>
                    <p className="stat-card__value">
                      €{formatAmount(filteredStats.expense)}
                    </p>
                  </div>
                </div>
              )}

              <TransactionList
                transactions={filteredTransactions}
                loading={loading}
                error={error?.message}
                onEdit={handleEdit}
                onDelete={handleDelete}
                pagination={pagination}
              />
            </div>
          </section>
        </div>
      </main>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTransaction ? '✏️ Transaktion bearbeiten' : '➕ Neue Transaktion'}
        size="md"
      >
        <TransactionForm
          initialData={editingTransaction}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          loading={formLoading}
        />
      </Modal>
      
      <APIDebugDashboard />
    </div>
  );
}

// Wrapped mit ErrorBoundary
function AppContentWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default AppContentWithErrorBoundary;

