import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency, formatDate } from '@/utils/formatters';
import styles from './RecentTransactions.module.scss';

// ============================================================================
// ICON MAP FOR CATEGORIES
// ============================================================================
const CATEGORY_ICONS = {
  // Income
  'Gehalt': '💼',
  'Bonus': '🎁',
  'Geschenk': '🎉',
  'Kapitalerträge': '📈',
  
  // Expense
  'Lebensmittel': '🛒',
  'Transport': '🚗',
  'Unterhaltung': '🎬',
  'Versicherung': '🛡️',
  
  // Default
  'Sonstiges': '📌',
};

// ============================================================================
// KOMPONENTE
// ============================================================================
export const RecentTransactions = ({ limit = 5 }) => {
  const { transactions, loading } = useTransactions();

  // ──────────────────────────────────────────────────────────────────────
  // GET RECENT TRANSACTIONS (sorted by date, newest first)
  // ──────────────────────────────────────────────────────────────────────
  const recentTransactions = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    return sorted.slice(0, limit);
  }, [transactions, limit]);

  // ──────────────────────────────────────────────────────────────────────
  // ANIMATIONS
  // ──────────────────────────────────────────────────────────────────────
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
  };

  const skeletonVariants = {
    animate: {
      opacity: [0.7, 1, 0.7],
      transition: { duration: 2, repeat: Infinity },
    },
  };

  // ──────────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ──────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <motion.div
        className={styles.container}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className={styles.header}>
          <h3 className={styles.title}>Letzte Transaktionen</h3>
        </div>
        <div className={styles.skeletons}>
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={i}
              className={styles.skeleton}
              variants={skeletonVariants}
              animate="animate"
            />
          ))}
        </div>
      </motion.div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // EMPTY STATE
  // ──────────────────────────────────────────────────────────────────────
  if (recentTransactions.length === 0) {
    return (
      <motion.div
        className={styles.container}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.header}>
          <h3 className={styles.title}>Letzte Transaktionen</h3>
        </div>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📊</div>
          <p className={styles.emptyText}>
            Noch keine Transaktionen vorhanden
          </p>
          <p className={styles.emptySubtext}>
            Füge deine erste Transaktion hinzu, um sie hier zu sehen
          </p>
        </div>
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
      {/* HEADER */}
      <div className={styles.header}>
        <h3 className={styles.title}>Letzte Transaktionen</h3>
        <Link to="/transactions" className={styles.viewAllLink}>
          Alle anzeigen →
        </Link>
      </div>

      {/* TRANSACTION LIST */}
      <div className={styles.list}>
        {recentTransactions.map((transaction) => (
          <motion.div
            key={transaction.id}
            className={`${styles.item} ${styles[transaction.type]}`}
            variants={itemVariants}
            whileHover={{ x: 8 }}
          >
            {/* ICON & CATEGORY */}
            <div className={styles.category}>
              <span className={styles.categoryIcon}>
                {CATEGORY_ICONS[transaction.category] || '📌'}
              </span>
              <div className={styles.categoryInfo}>
                <p className={styles.categoryName}>{transaction.category}</p>
                <p className={styles.description}>{transaction.description}</p>
              </div>
            </div>

            {/* AMOUNT & DATE */}
            <div className={styles.details}>
              <span className={styles.date}>
                {formatDate(transaction.date, 'short')}
              </span>
              <span className={styles.amount}>
                {transaction.type === 'income' ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default RecentTransactions;
