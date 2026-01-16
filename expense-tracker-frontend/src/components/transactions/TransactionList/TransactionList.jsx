import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks';
import { useTransactions } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/useToast';
import { formatCurrency, formatDate } from '@/utils/formatters';
import Button from '@/components/common/Button/Button';
import Input from '@/components/common/Input/Input';
import { FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import styles from './TransactionList.module.scss';

// ============================================================================
// CATEGORY ICONS
// ============================================================================
const CATEGORY_ICONS = {
  'Gehalt': '💼',
  'Bonus': '🎁',
  'Geschenk': '🎉',
  'Kapitalerträge': '📈',
  'Lebensmittel': '🛒',
  'Transport': '🚗',
  'Unterhaltung': '🎬',
  'Versicherung': '🛡️',
  'Sonstiges': '📌',
};

// ============================================================================
// KOMPONENTE
// ============================================================================
export const TransactionList = ({
  onEdit = null,
  pageSize = 10,
}) => {
  const { filteredTransactions, deleteTransaction, loading, error, sortBy, sortOrder, setSort } = useTransactions();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const isMobile = useIsMobile();
  
  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ──────────────────────────────────────────────────────────────────────
  // FILTER & SEARCH TRANSACTIONS (aber NICHT sortieren - das macht der Context!)
  // ──────────────────────────────────────────────────────────────────────
  const processedTransactions = useMemo(() => {
    let items = [...filteredTransactions];

    // Search by description or category
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (tx) =>
          tx.description.toLowerCase().includes(query) ||
          tx.category.toLowerCase().includes(query)
      );
    }

    // KEIN sortieren hier - filteredTransactions ist bereits sortiert vom Context!
    return items;
  }, [filteredTransactions, searchQuery]);

  // ──────────────────────────────────────────────────────────────────────
  // PAGINATION
  // ──────────────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(processedTransactions.length / pageSize);
  const paginatedTransactions = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return processedTransactions.slice(startIdx, startIdx + pageSize);
  }, [processedTransactions, currentPage, pageSize]);

  // ──────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id) => {
    try {
      await deleteTransaction(id);
      setDeleteConfirm(null);
      showSuccessToast('Transaktion gelöscht');
    } catch (err) {
      showErrorToast('Fehler beim Löschen');
    }
  }, [deleteTransaction, showSuccessToast, showErrorToast]);

  const handleToggleSort = useCallback((field) => {
    if (sortBy === field) {
      // Toggle zwischen asc und desc
      setSort(field, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Neues Feld, starte mit desc
      setSort(field, 'desc');
    }
  }, [sortBy, sortOrder, setSort]);

  // ──────────────────────────────────────────────────────────────────────
  // ANIMATIONS
  // ──────────────────────────────────────────────────────────────────────
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
  };

  const renderTableView = () => (
    <>
      <motion.div className={styles.tableHeader} variants={itemVariants}>
        <div className={styles.colCategory}>Kategorie</div>
        <div className={styles.colDescription}>Beschreibung</div>
        <div
          className={`${styles.colAmount} ${styles.sortable}`}
          onClick={() => handleToggleSort('amount')}
          role="button"
          tabIndex={0}
        >
          Betrag
          {sortBy === 'amount' && (
            <span className={styles.sortIcon}>
              {sortOrder === 'asc' ? ' ↑' : ' ↓'}
            </span>
          )}
        </div>
        <div
          className={`${styles.colDate} ${styles.sortable}`}
          onClick={() => handleToggleSort('date')}
          role="button"
          tabIndex={0}
        >
          Datum
          {sortBy === 'date' && (
            <span className={styles.sortIcon}>
              {sortOrder === 'asc' ? ' ↑' : ' ↓'}
            </span>
          )}
        </div>
        <div className={styles.colActions}>Aktionen</div>
      </motion.div>

      <motion.div className={styles.tableBody} variants={itemVariants}>
        <AnimatePresence mode="popLayout">
          {paginatedTransactions.map((transaction) => (
            <motion.div
              key={transaction.id}
              className={`${styles.tableRow} ${styles[transaction.type]}`}
              variants={itemVariants}
              layout
              whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.05)' }}
            >
              {/* CATEGORY */}
              <div className={styles.colCategory}>
                <span className={styles.categoryIcon}>
                  {CATEGORY_ICONS[transaction.category] || '📌'}
                </span>
                <span className={styles.categoryName}>{transaction.category}</span>
              </div>

              {/* DESCRIPTION */}
              <div className={styles.colDescription}>
                <p className={styles.description}>{transaction.description}</p>
              </div>

              {/* AMOUNT */}
              <div className={styles.colAmount}>
                <span className={`${styles.amount} ${styles[transaction.type]}`}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </span>
              </div>

              {/* DATE */}
              <div className={styles.colDate}>
                <time dateTime={transaction.date}>
                  {formatDate(transaction.date, 'short')}
                </time>
              </div>

              {/* ACTIONS */}
              <div className={styles.colActions}>
                <motion.div
                  className={styles.actionButtons}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {onEdit && (
                    <motion.button
                      className={styles.editBtn}
                      onClick={() => onEdit(transaction)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Bearbeiten"
                    >
                      <FiEdit2 />
                    </motion.button>
                  )}
                  <motion.button
                    className={styles.deleteBtn}
                    onClick={() => setDeleteConfirm(transaction.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Löschen"
                  >
                    <FiTrash2 />
                  </motion.button>
                </motion.div>
              </div>

              {/* DELETE CONFIRMATION */}
              <AnimatePresence>
                {deleteConfirm === transaction.id && (
                  <motion.div
                    className={styles.deleteConfirmation}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <p>Wirklich löschen?</p>
                    <div className={styles.confirmButtons}>
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => setDeleteConfirm(null)}
                      >
                        Abbrechen
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        Löschen
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </>
  );

  const renderCardView = () => (
    <motion.div className={styles.cardList} variants={itemVariants}>
      <AnimatePresence mode="popLayout">
        {paginatedTransactions.map((transaction) => (
          <motion.div
            key={transaction.id}
            className={`${styles.card} ${styles[transaction.type]}`}
            variants={itemVariants}
            layout
          >
            <div className={styles.cardHeader}>
              <div className={styles.categoryBadge}>
                <span className={styles.categoryIcon}>
                  {CATEGORY_ICONS[transaction.category] || '📌'}
                </span>
                <span className={styles.categoryName}>{transaction.category}</span>
              </div>
              <div className={styles.cardAmount}>
                <span className={`${styles.amount} ${styles[transaction.type]}`}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
            </div>

            <div className={styles.cardBody}>
              <p className={styles.description}>{transaction.description}</p>
            </div>

            <div className={styles.cardMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Datum</span>
                <time dateTime={transaction.date} className={styles.metaValue}>
                  {formatDate(transaction.date, 'short')}
                </time>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Betrag</span>
                <span className={`${styles.metaValue} ${styles[transaction.type]}`}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
            </div>

            <div className={styles.cardActions}>
              {onEdit && (
                <button
                  className={`${styles.editBtn} ${styles.cardActionBtn}`}
                  onClick={() => onEdit(transaction)}
                  title="Bearbeiten"
                >
                  <FiEdit2 />
                </button>
              )}
              <button
                className={`${styles.deleteBtn} ${styles.cardActionBtn}`}
                onClick={() => setDeleteConfirm(transaction.id)}
                title="Löschen"
              >
                <FiTrash2 />
              </button>
            </div>

            <AnimatePresence>
              {deleteConfirm === transaction.id && (
                <motion.div
                  className={styles.cardConfirm}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <p>Wirklich löschen?</p>
                  <div className={styles.confirmButtons}>
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      Abbrechen
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => handleDelete(transaction.id)}
                    >
                      Löschen
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );

  // ──────────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ──────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeletons}>
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              className={styles.skeleton}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // ERROR STATE
  // ──────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <motion.div
        className={styles.errorContainer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className={styles.errorIcon}>⚠️</div>
        <h3 className={styles.errorTitle}>Fehler beim Laden</h3>
        <p className={styles.errorMessage}>{error}</p>
      </motion.div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // EMPTY STATE
  // ──────────────────────────────────────────────────────────────────────
  if (processedTransactions.length === 0) {
    return (
      <motion.div
        className={styles.emptyContainer}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.emptyIcon}>📭</div>
        <h3 className={styles.emptyTitle}>Keine Transaktionen</h3>
        <p className={styles.emptyText}>
          {searchQuery
            ? 'Keine Transaktionen gefunden, die Ihrer Suche entsprechen'
            : 'Es gibt noch keine Transaktionen'}
        </p>
      </motion.div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className={styles.container}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* SEARCH BAR */}
      <motion.div className={styles.searchBar} variants={itemVariants}>
        <Input
          icon={<FiSearch />}
          placeholder="Nach Beschreibung oder Kategorie suchen..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
      </motion.div>
      {isMobile ? renderCardView() : renderTableView()}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <motion.div className={styles.pagination} variants={itemVariants}>
          <Button
            size="small"
            variant="secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            ← Zurück
          </Button>
          <span className={styles.pageInfo}>
            Seite {currentPage} von {totalPages}
          </span>
          <Button
            size="small"
            variant="secondary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Weiter →
          </Button>
        </motion.div>
      )}

      {/* INFO */}
      <motion.p className={styles.info} variants={itemVariants}>
        {processedTransactions.length} Transaktion{processedTransactions.length !== 1 ? 'en' : ''}
      </motion.p>
    </motion.div>
  );
};

export default TransactionList;
