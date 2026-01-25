import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks';
import { useTransactions } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/useToast';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { CategoryIcon, STATE_ICONS } from '@/utils/categoryIcons';
import { translateCategory } from '@/utils/categoryTranslations';
import Button from '@/components/common/Button/Button';
import { FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import styles from './TransactionList.module.scss';

// ============================================================================
// KOMPONENTE - SERVER-SIDE PAGINATION
// ============================================================================
export const TransactionList = ({ onEdit = null }) => {
  const { 
    transactions, 
    deleteTransaction, 
    loading, 
    error, 
    sortBy, 
    sortOrder, 
    setSort,
    // Server-Side Pagination
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    nextPage,
    prevPage,
  } = useTransactions();
  
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const isMobile = useIsMobile();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  
  // State
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ──────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id) => {
    try {
      await deleteTransaction(id);
      setDeleteConfirm(null);
      showSuccessToast(t('transactions.deleteSuccess'));
    } catch (err) {
      showErrorToast(t('transactions.deleteError'));
    }
  }, [deleteTransaction, showSuccessToast, showErrorToast, t]);

  const handleToggleSort = useCallback((field) => {
    if (sortBy === field) {
      setSort(field, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(field, 'desc');
    }
  }, [sortBy, sortOrder, setSort]);

  // Page-Size-Optionen
  const pageSizeOptions = [10, 20, 50];

  const handlePageSizeChange = useCallback(() => {
    // NOTE: setLimit not available in context, adjust page size via API
  }, []);

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
        <div className={styles.colCategory}>{t('transactions.category')}</div>
        <div className={styles.colDescription}>{t('transactions.description')}</div>
        <div
          className={`${styles.colAmount} ${styles.sortable}`}
          onClick={() => handleToggleSort('amount')}
          role="button"
          tabIndex={0}
        >
          {t('transactions.amount')}
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
          {t('transactions.date')}
          {sortBy === 'date' && (
            <span className={styles.sortIcon}>
              {sortOrder === 'asc' ? ' ↑' : ' ↓'}
            </span>
          )}
        </div>
        <div className={styles.colActions}>{t('transactions.actions')}</div>
      </motion.div>

      <motion.div className={styles.tableBody} variants={itemVariants}>
        <AnimatePresence mode="popLayout">
          {transactions.map((transaction) => (
            <motion.div
              key={transaction.id}
              className={`${styles.tableRow} ${styles[transaction.type]}`}
              variants={itemVariants}
              layout
            >
              {/* CATEGORY */}
              <div className={styles.colCategory}>
                <span className={styles.categoryIcon}>
                  <CategoryIcon category={transaction.category} />
                </span>
                <span className={styles.categoryName}>
                  {translateCategory(transaction.category, t)}
                </span>
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
                      title={t('transactions.editTransaction')}
                    >
                      <FiEdit2 />
                    </motion.button>
                  )}
                  <motion.button
                    className={styles.deleteBtn}
                    onClick={() => setDeleteConfirm(transaction.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title={t('transactions.deleteTransaction')}
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
                    <p>{t('transactions.deleteConfirm')}</p>
                    <div className={styles.confirmButtons}>
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => setDeleteConfirm(null)}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        {t('transactions.deleteTransaction')}
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
        {transactions.map((transaction) => (
          <motion.div
            key={transaction.id}
            className={`${styles.card} ${styles[transaction.type]}`}
            variants={itemVariants}
            layout
          >
            <div className={styles.cardHeader}>
              <div className={styles.categoryBadge}>
                <span className={styles.categoryIcon}>
                  <CategoryIcon category={transaction.category} />
                </span>
                <span className={styles.categoryName}>{translateCategory(transaction.category, t)}</span>
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
                <span className={styles.metaLabel}>{t('transactions.date')}</span>
                <time dateTime={transaction.date} className={styles.metaValue}>
                  {formatDate(transaction.date, 'short')}
                </time>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>{t('transactions.amount')}</span>
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
                  title={t('transactions.editAction')}
                >
                  <FiEdit2 />
                </button>
              )}
              <button
                className={`${styles.deleteBtn} ${styles.cardActionBtn}`}
                onClick={() => setDeleteConfirm(transaction.id)}
                title={t('transactions.deleteAction')}
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
                  <p>{t('transactions.deleteConfirm')}</p>
                  <div className={styles.confirmButtons}>
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => handleDelete(transaction.id)}
                    >
                      {t('transactions.deleteAction')}
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
        <div className={styles.errorIcon}>
          <STATE_ICONS.error />
        </div>
        <h3 className={styles.errorTitle}>{t('transactions.loadErrorTitle')}</h3>
        <p className={styles.errorMessage}>{error}</p>
      </motion.div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // EMPTY STATE
  // ──────────────────────────────────────────────────────────────────────
  if (transactions.length === 0 && !loading) {
    return (
      <motion.div
        className={styles.emptyContainer}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.emptyIcon}>
          <STATE_ICONS.empty />
        </div>
        <h3 className={styles.emptyTitle}>{t('transactions.emptyTitle')}</h3>
        <p className={styles.emptyText}>
          {t('transactions.emptySubtitle')}
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
      {isMobile ? renderCardView() : renderTableView()}

      {/* PAGINATION - SERVER-SIDE */}
      {totalPages > 0 && (
        <motion.div className={styles.pagination} variants={itemVariants}>
          <div className={styles.paginationLeft}>
            <label className={styles.pageSizeLabel}>
              {t('transactions.perPage')}
              <select 
                value={pageSize} 
                onChange={handlePageSizeChange}
                className={styles.pageSizeSelect}
              >
                {pageSizeOptions.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.paginationCenter}>
            <Button
              size="small"
              variant="ghost"
              disabled={currentPage === 1 || loading}
              onClick={prevPage}
              icon={isRtl ? <FiChevronRight /> : <FiChevronLeft />}
              aria-label={t('transactions.prevPage')}
            />
            <span className={styles.pageInfo}>
              {t('transactions.page')} {currentPage} {t('transactions.of')} {totalPages}
            </span>
            <Button
              size="small"
              variant="ghost"
              disabled={currentPage === totalPages || loading}
              onClick={nextPage}
              icon={isRtl ? <FiChevronLeft /> : <FiChevronRight />}
              aria-label={t('transactions.nextPage')}
            />
          </div>

          <div className={styles.paginationRight}>
            <span className={styles.totalInfo}>
              {t('transactions.total', {
                count: totalItems,
                suffix: totalItems !== 1 ? 'en' : '',
              })}
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TransactionList;
