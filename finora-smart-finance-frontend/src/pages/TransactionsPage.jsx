/**
 * @fileoverview TransactionsPage Component
 * @description Seite zur Anzeige und Verwaltung von Transaktionen
 * 
 * FEATURES:
 * - Search & Filter Controls (oben)
 * - Transaktionsliste mit Pagination
 * - Add/Edit/Delete Transactions
 * 
 * @module pages/TransactionsPage
 */

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTransactions } from '@/hooks/useTransactions';
import { useDebounce, useIsMobile } from '@/hooks';
import { ALL_CATEGORIES } from '@/config/categoryConstants';
import Button from '@/components/common/Button/Button';
import Search from '@/components/common/Search/Search';
import Filter from '@/components/common/Filter/Filter';
import Modal from '@/components/common/Modal/Modal';
import TransactionList from '@/components/transactions/TransactionList/TransactionList';
import TransactionForm from '@/components/transactions/TransactionForm/TransactionForm';
import { FiPlus } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import styles from './TransactionsPage.module.scss';

const TransactionsPage = () => {
  const { filter, setFilter, clearFilter } = useTransactions();
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  
  // ──────────────────────────────────────────────────────────────────────
  // LOKALER SEARCH STATE mit DEBOUNCE
  // ──────────────────────────────────────────────────────────────────────
  const [localSearchQuery, setLocalSearchQuery] = useState(filter.searchQuery || '');
  const debouncedSearchQuery = useDebounce(localSearchQuery, 300);
  const isInitialMount = useRef(true);

  // Sync debounced value zum Context (löst Backend-Anfrage aus)
  useEffect(() => {
    // Überspringe initiales Mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Nur updaten wenn sich der debounced Wert unterscheidet
    if (debouncedSearchQuery !== filter.searchQuery) {
      setFilter({ searchQuery: debouncedSearchQuery });
    }
  }, [debouncedSearchQuery, filter.searchQuery, setFilter]);

  const categoryOptions = useMemo(() => ALL_CATEGORIES, []);
  
  // Mobile-optimierte pageSize: weniger Items auf kleinen Bildschirmen
  const pageSize = useMemo(() => isMobile ? 8 : 15, [isMobile]);

  const handleSearchChange = useCallback(
    (value) => {
      // Nur lokalen State updaten → sofortiges UI-Feedback
      setLocalSearchQuery(value);
    },
    []
  );

  const handleFilterChange = useCallback(
    (nextFilter) => {
      setFilter(nextFilter);
    },
    [setFilter]
  );

  // ──────────────────────────────────────────────────────────────────────
  // HANDLE EDIT
  // ──────────────────────────────────────────────────────────────────────
  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  // ──────────────────────────────────────────────────────────────────────
  // HANDLE SUCCESS
  // ──────────────────────────────────────────────────────────────────────
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  // ──────────────────────────────────────────────────────────────────────
  // HANDLE MODAL CLOSE
  // ──────────────────────────────────────────────────────────────────────
  const handleModalClose = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  // ──────────────────────────────────────────────────────────────────────
  // ANIMATIONS
  // ──────────────────────────────────────────────────────────────────────
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.div
      className={styles.transactionsPage}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* HEADER */}
      <motion.div className={styles.header} variants={itemVariants}>
        <div>
          <h1>{t('transactions.pageTitle')}</h1>
          <p>{t('transactions.manageSubtitle')}</p>
        </div>
        <Button
          variant="primary"
          size="medium"
          icon={<FiPlus />}
          onClick={() => {
            setEditingTransaction(null);
            setShowForm(!showForm);
          }}
          aria-label={t('transactions.addTransaction')}
        />
      </motion.div>

      {/* TRANSACTION FORM MODAL */}
      <Modal
        isOpen={showForm}
        onClose={handleModalClose}
        title={editingTransaction ? t('transactions.editTransaction') : t('transactions.addTransaction')}
        size="medium"
        closeOnOverlayClick={false}
        closeOnEsc={true}
      >
        <TransactionForm
          initialData={editingTransaction}
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
        />
      </Modal>

      {/* SEARCH & FILTER CONTROLS */}
      <motion.div className={styles.controlsSection} variants={itemVariants}>
        <div className={styles.controlsRow}>
          <Search
            value={localSearchQuery}
            onChange={handleSearchChange}
            onSubmit={handleSearchChange}
            placeholder={t('transactions.searchPlaceholder')}
            ariaLabel={t('transactions.searchAria')}
          />
          <Filter
            value={filter}
            onChange={handleFilterChange}
            onClear={clearFilter}
            categories={categoryOptions}
          />
        </div>
      </motion.div>

      {/* TRANSACTIONS LIST SECTION */}
      <motion.div className={styles.contentSection} variants={itemVariants}>
        <TransactionList onEdit={handleEdit} pageSize={pageSize} />
      </motion.div>
    </motion.div>
  );
};

export default TransactionsPage;
