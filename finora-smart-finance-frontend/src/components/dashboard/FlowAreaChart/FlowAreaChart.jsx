/**
 * @fileoverview FlowAreaChart Component
 * @description Recharts AreaChart mit Aurora-Gradient-Fills und Custom Glass-Tooltip.
 * Zeigt monatlichen Trend (Income/Expense/Balance).
 */

import { memo, useCallback } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useIsMobile, useCssVariables } from '@/hooks';
import { useDashboardChartData } from '@/hooks/useDashboardChartData';
import { formatCurrency } from '@/utils/formatters';
import { SkeletonChart } from '@/components/common/Skeleton';
import { STATE_ICONS } from '@/utils/categoryIcons';
import GlassPanel from '../GlassPanel/GlassPanel';
import styles from './FlowAreaChart.module.scss';

/* ---------- Glass Tooltip ---------- */
function GlassTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map(entry => (
        <div key={entry.dataKey} className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ background: entry.color }} />
          <span className={styles.tooltipName}>{entry.name}</span>
          <span className={styles.tooltipValue}>{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Main Component ---------- */
function FlowAreaChart() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const cssColors = useCssVariables();
  const { trendData, hasAnyData, loading } = useDashboardChartData();

  const formatYAxis = useCallback(
    value => (value === 0 ? '0' : value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)),
    []
  );

  const lastPoint = trendData.length > 0 ? trendData[trendData.length - 1] : null;
  const totalIncome = trendData.reduce((sum, m) => sum + m.income, 0);
  const totalExpenses = trendData.reduce((sum, m) => sum + m.expense, 0);

  if (loading) {
    return (
      <GlassPanel variant="standard">
        <SkeletonChart variant="bar" hasTitle hasLegend height={isMobile ? 220 : 240} />
      </GlassPanel>
    );
  }

  if (!hasAnyData || trendData.length === 0) {
    return (
      <GlassPanel variant="standard">
        <div className={styles.emptyState}>
          <STATE_ICONS.chart />
          <p>{t('dashboard.noDataTitle')}</p>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel variant="standard" elevated>
      <div className={styles.chartContainer}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>{t('dashboard.monthlyTrend')}</h3>
            <p className={styles.subtitle}>
              {t('dashboard.lastMonths', { count: trendData.length })}
            </p>
          </div>
          {lastPoint && <span className={styles.meta}>{lastPoint.month}</span>}
        </div>

        <div className={styles.chartBody}>
          <ResponsiveContainer width="100%" height={isMobile ? 220 : 240}>
            <AreaChart data={trendData} margin={{ top: 10, right: 16, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="auroraIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cssColors.success} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={cssColors.success} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="auroraExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cssColors.error} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={cssColors.error} stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke={cssColors.border}
                opacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: cssColors.txMuted, fontSize: 11 }}
                axisLine={{ stroke: cssColors.border, strokeOpacity: 0.4 }}
                tickLine={false}
                dy={8}
              />
              <YAxis
                tick={{ fill: cssColors.txMuted, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={42}
                tickFormatter={formatYAxis}
              />
              <Tooltip
                content={<GlassTooltip />}
                cursor={{ stroke: cssColors.border, strokeDasharray: '4 4' }}
              />

              <Area
                type="monotone"
                dataKey="income"
                name={t('dashboard.income')}
                stroke={cssColors.success}
                strokeWidth={2}
                fill="url(#auroraIncome)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="expense"
                name={t('dashboard.expenses')}
                stroke={cssColors.error}
                strokeWidth={2}
                fill="url(#auroraExpense)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Footer — Gesamteinnahmen / Gesamtausgaben im Trendzeitraum */}
        <div className={styles.footer}>
          <div className={styles.footerStat}>
            <div className={styles.footerText}>
              <span className={styles.footerLabel}>{t('dashboard.totalIncome')}</span>
              <span className={styles.footerValue} data-variant="income">
                {formatCurrency(totalIncome)}
              </span>
            </div>
          </div>
          <div className={styles.footerStat}>
            <div className={styles.footerText}>
              <span className={styles.footerLabel}>{t('dashboard.totalExpenses')}</span>
              <span className={styles.footerValue} data-variant="expense">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}

export default memo(FlowAreaChart);
