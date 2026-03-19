/**
 * @fileoverview GlassCategoryList Component
 * @description Kategorie-Breakdown in einem GlassPanel mit horizontalen Gradient-Bars.
 * Übernimmt Tab-Switch (Expense/Income) vom alten DashboardCharts.
 */

import { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useMotion } from '@/hooks/useMotion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useTransactions } from '@/hooks/useTransactions';
import { useDashboardChartData } from '@/hooks/useDashboardChartData';
import { formatCurrency } from '@/utils/formatters';
import { CategoryIcon, STATE_ICONS } from '@/utils/categoryIcons';
import { translateCategory } from '@/utils/categoryTranslations';
import { SkeletonChart } from '@/components/common/Skeleton';
import GlassPanel from '../GlassPanel/GlassPanel';
import styles from './GlassCategoryList.module.scss';

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
  exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 28 },
  },
  exit: {
    opacity: 0,
    x: 16,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

const barFillVariants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.5, ease: [0.65, 0, 0.35, 1], delay: 0.1 } },
};

const COLLAPSED_COUNT = 5;

/**
 * Gruppiert Transaktionen nach Datum-Kategorie und aggregiert pro Kategorie.
 */
function groupCategoriesByDate(transactions, type, t) {
  const filtered = transactions.filter(tx => tx.type === type);
  if (filtered.length === 0) return [];

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

  for (const tx of filtered) {
    const d = new Date(tx.date);
    const txDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    let key;
    if (txDate.getTime() === today.getTime()) key = 'today';
    else if (txDate.getTime() === yesterday.getTime()) key = 'yesterday';
    else if (txDate >= weekStart && txDate < today) key = 'thisWeek';
    else key = 'earlier';

    if (!groups.has(key)) groups.set(key, new Map());
    const catMap = groups.get(key);
    if (!catMap.has(tx.category)) {
      catMap.set(tx.category, { category: tx.category, amount: 0, count: 0 });
    }
    const cat = catMap.get(tx.category);
    cat.amount += tx.amount;
    cat.count += 1;
  }

  return order
    .filter(key => groups.has(key))
    .map(key => ({
      key,
      label: labels[key],
      categories: Array.from(groups.get(key).values()).sort((a, b) => b.amount - a.amount),
    }));
}

function GlassCategoryList() {
  const { t } = useTranslation();
  const { shouldAnimate } = useMotion();
  const isMobileOrTablet = useMediaQuery(`(max-width: ${1023}px)`);
  const [categoryType, setCategoryType] = useState('expense');
  const [expanded, setExpanded] = useState(false);
  const { categoryExpenseData, categoryIncomeData, expenseTotal, incomeTotal, loading } =
    useDashboardChartData();

  const data = categoryType === 'expense' ? categoryExpenseData : categoryIncomeData;
  const total = categoryType === 'expense' ? expenseTotal : incomeTotal;
  const seriesColor = categoryType === 'expense' ? 'var(--error)' : 'var(--success)';

  // Timeline-Gruppierung aus Einzel-Transaktionen
  const { dashboardData } = useTransactions();
  const recentTransactions = useMemo(
    () =>
      Array.isArray(dashboardData?.recentTransactions) ? dashboardData.recentTransactions : [],
    [dashboardData]
  );

  const timelineGroups = useMemo(
    () => groupCategoriesByDate(recentTransactions, categoryType, t),
    [recentTransactions, categoryType, t]
  );

  // Fallback: wenn keine Timeline-Daten, zeige aggregierte Daten
  const effectiveGroups = useMemo(() => {
    if (timelineGroups.length > 0) return timelineGroups;
    if (data.length > 0) return [{ key: 'all', label: '', categories: data }];
    return [];
  }, [timelineGroups, data]);

  const allItems = useMemo(() => effectiveGroups.flatMap(g => g.categories), [effectiveGroups]);

  const isCollapsible = isMobileOrTablet && allItems.length > COLLAPSED_COUNT;

  const visibleGroups = useMemo(() => {
    if (!isCollapsible || expanded) return effectiveGroups;
    let count = 0;
    const result = [];
    for (const group of effectiveGroups) {
      if (count >= COLLAPSED_COUNT) break;
      const remaining = COLLAPSED_COUNT - count;
      const visibleCats = group.categories.slice(0, remaining);
      result.push({ ...group, categories: visibleCats });
      count += visibleCats.length;
    }
    return result;
  }, [effectiveGroups, isCollapsible, expanded]);

  if (loading) {
    return (
      <GlassPanel variant="standard">
        <SkeletonChart variant="bar" hasTitle hasLegend height={280} />
      </GlassPanel>
    );
  }

  return (
    <GlassPanel variant="standard" elevated>
      <div className={styles.container} style={{ '--series': seriesColor }}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <h3 className={styles.title}>{t('dashboard.categoriesTitle')}</h3>
            <div
              className={styles.segmentControl}
              role="tablist"
              aria-label={t('dashboard.categoriesTypeLabel')}
            >
              <button
                type="button"
                className={`${styles.segmentButton} ${categoryType === 'expense' ? styles.active : ''}`}
                role="tab"
                aria-selected={categoryType === 'expense'}
                onClick={() => setCategoryType('expense')}
              >
                {t('dashboard.expenses')}
              </button>
              <button
                type="button"
                className={`${styles.segmentButton} ${categoryType === 'income' ? styles.active : ''}`}
                role="tab"
                aria-selected={categoryType === 'income'}
                onClick={() => setCategoryType('income')}
              >
                {t('dashboard.income')}
              </button>
            </div>
          </div>
          <div className={styles.headerBottom}>
            <p className={styles.subtitle}>{t('dashboard.categoriesSubtitle')}</p>
            <span className={styles.headerCount}>{allItems.length}</span>
          </div>
        </div>

        {/* Category rows — animated on switch */}
        <div className={styles.listWrapper}>
          <AnimatePresence mode="wait">
            {data.length === 0 ? (
              <motion.div
                key="empty"
                className={styles.emptyState}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <STATE_ICONS.chart />
                <p>{t('dashboard.noCategoryData')}</p>
              </motion.div>
            ) : (
              <motion.ul
                key={`list-${categoryType}`}
                className={styles.categoryList}
                role="list"
                variants={staggerContainer}
                initial={shouldAnimate ? 'hidden' : false}
                animate="visible"
                exit="exit"
              >
                {visibleGroups.map(group => (
                  <li key={group.key} className={styles.timelineGroup}>
                    {group.label && <div className={styles.timelineLabel}>{group.label}</div>}
                    {group.categories.map(item => {
                      const percent = total > 0 ? (item.amount / total) * 100 : 0;
                      const width = `${Math.max(0, Math.min(100, percent))}%`;

                      return (
                        <motion.div
                          key={`${group.key}-${item.category}`}
                          className={styles.categoryRow}
                          variants={rowVariants}
                        >
                          <div className={styles.categoryLeft}>
                            <span className={styles.categoryIconWrap} aria-hidden="true">
                              <CategoryIcon category={item.category} />
                            </span>
                            <div className={styles.categoryLabel}>
                              <span className={styles.categoryName}>
                                {translateCategory(item.category, t)}
                              </span>
                              <span className={styles.categoryCount}>{item.count}</span>
                            </div>
                          </div>

                          <div className={styles.categoryRight}>
                            <div className={styles.categoryAmount}>
                              {formatCurrency(item.amount)}
                            </div>
                            <div className={styles.categoryBar} aria-hidden="true">
                              <motion.div
                                className={styles.categoryBarFill}
                                style={{ width, transformOrigin: 'left' }}
                                variants={barFillVariants}
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
          {isCollapsible && (
            <button
              type="button"
              className={styles.showMoreBtn}
              onClick={() => setExpanded(prev => !prev)}
            >
              {expanded ? t('dashboard.showLess') : t('dashboard.showMore')}
              <span className={styles.showMoreCount}>
                {expanded ? '' : `+${allItems.length - COLLAPSED_COUNT}`}
              </span>
            </button>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}

export default memo(GlassCategoryList);
