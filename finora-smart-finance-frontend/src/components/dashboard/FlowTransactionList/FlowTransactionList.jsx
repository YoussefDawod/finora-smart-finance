/**
 * @fileoverview FlowTransactionList Component
 * @description Transaktionsliste mit Stagger-Animation, Glass-Hover
 * und Timeline-Datum-Gruppen (Heute, Gestern, Diese Woche, Früher).
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTransactions } from '@/hooks/useTransactions';
import { useMotion } from '@/hooks/useMotion';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { CategoryIcon, STATE_ICONS } from '@/utils/categoryIcons';
import { translateCategory } from '@/utils/categoryTranslations';
import { SkeletonTableRow } from '@/components/common/Skeleton';
import GlassPanel from '../GlassPanel/GlassPanel';
import styles from './FlowTransactionList.module.scss';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

/**
 * Gruppiert Transaktionen nach Datum-Kategorie
 * @returns {Array<{ label: string, transactions: Array }>}
 */
function groupByDate(transactions, t) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));

  const groups = new Map();
  const order = ['today', 'yesterday', 'thisWeek', 'earlier'];
  const labels = {
    today: t('dashboard.timeline.today', 'Heute'),
    yesterday: t('dashboard.timeline.yesterday', 'Gestern'),
    thisWeek: t('dashboard.timeline.thisWeek', 'Diese Woche'),
    earlier: t('dashboard.timeline.earlier', 'Früher'),
  };

  for (const tx of transactions) {
    const d = new Date(tx.date);
    const txDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    let key;
    if (txDate.getTime() === today.getTime()) key = 'today';
    else if (txDate.getTime() === yesterday.getTime()) key = 'yesterday';
    else if (txDate >= weekStart && txDate < today) key = 'thisWeek';
    else key = 'earlier';

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(tx);
  }

  return order
    .filter(key => groups.has(key))
    .map(key => ({ key, label: labels[key], transactions: groups.get(key) }));
}

function FlowTransactionList() {
  const { t } = useTranslation();
  const { dashboardData, dashboardLoading } = useTransactions();
  const { shouldAnimate } = useMotion();

  const recentTransactions = useMemo(
    () =>
      Array.isArray(dashboardData?.recentTransactions) ? dashboardData.recentTransactions : [],
    [dashboardData]
  );

  const timelineGroups = useMemo(() => groupByDate(recentTransactions, t), [recentTransactions, t]);

  if (dashboardLoading && !dashboardData) {
    return (
      <GlassPanel variant="standard">
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

  if (recentTransactions.length === 0) {
    return (
      <GlassPanel variant="standard">
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
            <STATE_ICONS.chart />
            <p className={styles.emptyText}>{t('dashboard.noTransactions')}</p>
            <p className={styles.emptySubtext}>{t('dashboard.noTransactionsSub')}</p>
          </div>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel variant="standard" elevated>
      <div className={styles.container}>
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

        <motion.div
          className={styles.list}
          variants={staggerContainer}
          initial={shouldAnimate ? 'hidden' : false}
          animate={shouldAnimate ? 'visible' : false}
        >
          {timelineGroups.map(group => (
            <div key={group.key} className={styles.timelineGroup}>
              <div className={styles.timelineLabel}>{group.label}</div>
              {group.transactions.map((transaction, index) => {
                if (!transaction) return null;
                return (
                  <motion.div
                    key={transaction.id || index}
                    className={`${styles.item} ${styles[transaction.type]}`}
                    variants={rowVariants}
                  >
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

                    <div className={styles.details}>
                      <span className={styles.amount}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>
                      <span className={styles.date}>{formatDate(transaction.date, 'short')}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </motion.div>
      </div>
    </GlassPanel>
  );
}

export default memo(FlowTransactionList);
