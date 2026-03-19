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
import { SkeletonTableRow } from '@/components/common/Skeleton';
import { useTranslation } from 'react-i18next';
import { useMotion } from '@/hooks/useMotion';
import GlassPanel from '../GlassPanel/GlassPanel';
import styles from './RecentTransactions.module.scss';

// ──────────────────────────────────────────────────────────────────────
// ANIMATION VARIANTS (module-level constants — stable references)
// ──────────────────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

// ============================================================================
// KOMPONENTE
// ============================================================================
export const RecentTransactions = () => {
  const { dashboardData, dashboardLoading } = useTransactions();
  const { t } = useTranslation();
  const { shouldAnimate } = useMotion();

  // ──────────────────────────────────────────────────────────────────────
  // GET RECENT TRANSACTIONS FROM SERVER DATA
  // ──────────────────────────────────────────────────────────────────────
  const recentTransactions = Array.isArray(dashboardData?.recentTransactions)
    ? dashboardData.recentTransactions
    : [];

  // ──────────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ──────────────────────────────────────────────────────────────────────
  if (dashboardLoading && !dashboardData) {
    return (
      <GlassPanel variant="standard" elevated>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.headerTop}>
              <h3 className={styles.title}>{t('dashboard.recentTransactions')}</h3>
            </div>
            <div className={styles.headerBottom}>
              <p className={styles.subtitle}>{t('dashboard.currentMonth')}</p>
            </div>
          </div>
          <SkeletonTableRow columns={3} hasIcon count={5} density="compact" />
        </div>
      </GlassPanel>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // EMPTY STATE
  // ──────────────────────────────────────────────────────────────────────
  if (recentTransactions.length === 0) {
    return (
      <GlassPanel variant="standard" elevated>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.headerTop}>
              <h3 className={styles.title}>{t('dashboard.recentTransactions')}</h3>
            </div>
            <div className={styles.headerBottom}>
              <p className={styles.subtitle}>{t('dashboard.currentMonth')}</p>
              <span className={styles.headerCount}>0</span>
            </div>
          </div>
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <STATE_ICONS.chart />
            </div>
            <p className={styles.emptyText}>{t('dashboard.noTransactions')}</p>
            <p className={styles.emptyText}>{t('dashboard.noTransactionsSub')}</p>
          </div>
        </div>
      </GlassPanel>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────
  return (
    <GlassPanel variant="standard" elevated>
      <motion.div
        className={styles.container}
        variants={containerVariants}
        initial={shouldAnimate ? 'hidden' : false}
        animate={shouldAnimate ? 'visible' : false}
      >
        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <h3 className={styles.title}>{t('dashboard.recentTransactions')}</h3>
            <Link to="/transactions" className={styles.viewAllLink}>
              {t('common.seeAll')} →
            </Link>
          </div>
          <div className={styles.headerBottom}>
            <p className={styles.subtitle}>{t('dashboard.currentMonth')}</p>
            <span className={styles.headerCount}>{recentTransactions.length}</span>
          </div>
        </div>

        {/* TRANSACTION LIST */}
        <div className={styles.list}>
          {recentTransactions.slice(0, 5).map((transaction, index) => {
            if (!transaction) return null;
            return (
              <motion.div
                key={transaction.id || index}
                className={styles.item}
                data-type={transaction.type}
                variants={itemVariants}
                whileHover={{ x: 4 }}
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
                  <span className={styles.date}>{formatDate(transaction.date, 'short')}</span>
                  <span className={styles.amount}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </GlassPanel>
  );
};

export default RecentTransactions;
