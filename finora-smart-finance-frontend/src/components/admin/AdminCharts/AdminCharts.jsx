/**
 * @fileoverview AdminCharts – Charts für das Admin-Dashboard
 * @description Visualisiert Transaktions- und User-Statistiken.
 *              - Income/Expense Pie-Chart
 *              - Top-Kategorien Balken-Chart
 *              - User Sprach-Verteilung Pie-Chart
 *
 * Nutzt recharts + useCssVariables für Theme-kompatible Farben.
 *
 * @module components/admin/AdminCharts
 */

import { memo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useCssVariables, useIsMobile } from '@/hooks';
import { SkeletonChart } from '@/components/common/Skeleton';
import { tooltipContentStyle } from '@/components/dashboard/DashboardCharts/chartConstants';
import styles from './AdminCharts.module.scss';

/**
 * Sprache-Label Mapping
 */
const LANG_LABELS = { de: 'Deutsch', en: 'English', ar: 'العربية', ka: 'ქართული' };

/**
 * Wiederverwenbare Tooltip-Komponente für Admin-Charts
 */
function AdminTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0];
  return (
    <div className={styles.tooltip} style={tooltipContentStyle}>
      <span className={styles.tooltipLabel}>{entry.name}</span>
      <span className={styles.tooltipValue}>{entry.value?.toLocaleString()}</span>
    </div>
  );
}

/**
 * AdminCharts Component
 *
 * @param {Object} props
 * @param {Object|null} props.stats - Hauptstatistiken vom Backend (inkl. userLanguageBreakdown)
 * @param {Object|null} props.transactionStats - Transaktions-Statistiken vom Backend
 * @param {boolean} props.loading
 */
function AdminCharts({ stats, transactionStats, loading = false }) {
  const { t } = useTranslation();
  const cssColors = useCssVariables();
  const isMobile = useIsMobile();

  // ── Loading State ──────────────────────────────
  if (loading) {
    return (
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <SkeletonChart variant="pie" hasTitle height={isMobile ? 240 : 260} />
        </div>
        <div className={styles.chartCard}>
          <SkeletonChart variant="bar" hasTitle height={isMobile ? 240 : 260} />
        </div>
        <div className={styles.chartCard}>
          <SkeletonChart variant="pie" hasTitle height={isMobile ? 240 : 260} />
        </div>
      </div>
    );
  }

  // ── Daten vorbereiten ──────────────────────────

  // 1) Income/Expense Pie
  const incomeExpenseData = [];
  if (transactionStats) {
    if (transactionStats.totalIncome > 0) {
      incomeExpenseData.push({
        name: t('admin.dashboard.income'),
        value: transactionStats.totalIncome,
      });
    }
    if (transactionStats.totalExpense > 0) {
      incomeExpenseData.push({
        name: t('admin.dashboard.expenses'),
        value: transactionStats.totalExpense,
      });
    }
  }
  const pieColors = [cssColors.success, cssColors.error];

  // 2) Top-Kategorien Bar
  const categoryData = (transactionStats?.topCategories || [])
    .slice(0, 6)
    .map((cat) => ({
      name: cat._id || 'Other',
      count: cat.count,
      amount: Math.round(cat.totalAmount),
    }));

  // 3) User-Sprachen Pie (basierend auf User.preferences.language)
  const langData = (stats?.userLanguageBreakdown || []).map((item) => ({
    name: LANG_LABELS[item._id] || item._id,
    value: item.count,
  }));
  const langColors = [
    cssColors.primary,
    cssColors.success,
    cssColors.warning,
    cssColors.info,
    cssColors.error,
  ];

  const hasTransactionData = incomeExpenseData.length > 0 || categoryData.length > 0;
  const hasSubscriberData = langData.length > 0;

  if (!hasTransactionData && !hasSubscriberData) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>{t('admin.dashboard.noChartData')}</p>
      </div>
    );
  }

  return (
    <div className={styles.chartsGrid}>
      {/* ── Income/Expense Pie ──────────────────── */}
      {incomeExpenseData.length > 0 && (
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>{t('admin.dashboard.incomeVsExpense')}</h3>
          <ResponsiveContainer width="100%" height={isMobile ? 220 : 250}>
            <PieChart>
              <Pie
                data={incomeExpenseData}
                cx="50%"
                cy="50%"
                innerRadius={isMobile ? 40 : 55}
                outerRadius={isMobile ? 70 : 85}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {incomeExpenseData.map((_, idx) => (
                  <Cell key={`ie-${idx}`} fill={pieColors[idx % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<AdminTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className={styles.legendLabel}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Top Categories Bar ─────────────────── */}
      {categoryData.length > 0 && (
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>{t('admin.dashboard.topCategories')}</h3>
          <ResponsiveContainer width="100%" height={isMobile ? 220 : 250}>
            <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={cssColors.border} />
              <XAxis type="number" tick={{ fontSize: 11, fill: cssColors.txMuted }} />
              <YAxis
                type="category"
                dataKey="name"
                width={isMobile ? 60 : 80}
                tick={{ fontSize: 11, fill: cssColors.txMuted }}
              />
              <Tooltip content={<AdminTooltip />} />
              <Bar
                dataKey="count"
                fill={cssColors.primary}
                radius={[0, 4, 4, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── User Languages Pie ─────────────────── */}
      {hasSubscriberData && (
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>{t('admin.dashboard.userLanguages')}</h3>
          <ResponsiveContainer width="100%" height={isMobile ? 220 : 250}>
            <PieChart>
              <Pie
                data={langData}
                cx="50%"
                cy="50%"
                innerRadius={isMobile ? 40 : 55}
                outerRadius={isMobile ? 70 : 85}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {langData.map((_, idx) => (
                  <Cell key={`lang-${idx}`} fill={langColors[idx % langColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<AdminTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className={styles.legendLabel}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default memo(AdminCharts);
