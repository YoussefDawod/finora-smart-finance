/**
 * @fileoverview RecentTransactions Component
 * @description Zeigt die letzten Transaktionen auf dem Dashboard
 * Nutzt aggregierte Daten vom Server (recentTransactions)
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { CategoryIcon, STATE_ICONS } from '@/utils/categoryIcons';
import { translateCategory } from '@/utils/categoryTranslations';
import { useTranslation } from 'react-i18next';
import styles from './RecentTransactions.module.scss';

// ============================================================================
// KOMPONENTE
// ============================================================================
export const RecentTransactions = () => {
  const { dashboardData, dashboardLoading } = useTransactions();
  const { t } = useTranslation();

  // ──────────────────────────────────────────────────────────────────────
  // GET RECENT TRANSACTIONS FROM SERVER DATA
  // ──────────────────────────────────────────────────────────────────────
  const recentTransactions = dashboardData?.recentTransactions || [];

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
  if (dashboardLoading && !dashboardData) {
    return (
      <motion.div
        className={styles.container}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className={styles.header}>
          <h3 className={styles.title}>{t('dashboard.recentTransactions')}</h3>
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
          <h3 className={styles.title}>{t('dashboard.recentTransactions')}</h3>
        </div>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}><STATE_ICONS.chart /></div>
          <p className={styles.emptyText}>
            {t('dashboard.noTransactions')}
          </p>
          <p className={styles.emptySubtext}>
            {t('dashboard.noTransactionsSub')}
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
        <h3 className={styles.title}>{t('dashboard.recentTransactions')}</h3>
        <Link to="/transactions" className={styles.viewAllLink}>
          {t('common.seeAll')} →
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
                <CategoryIcon category={transaction.category} />
              </span>
              <div className={styles.categoryInfo}>
                <p className={styles.categoryName}>
                  {translateCategory(transaction.category, t)}
                </p>
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
