/**
 * @fileoverview DashboardCharts Component
 * @description Visualisierungen für das Dashboard
 * Nutzt aggregierte Daten vom Server (monthlyTrend, categoryBreakdown)
 */

import { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  Label,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useIsMobile, useCssVariables } from '@/hooks';
import { useDashboardChartData, formatMonthLabel } from '@/hooks/useDashboardChartData';
import { formatCurrency } from '@/utils/formatters';
import { CategoryIcon, STATE_ICONS } from '@/utils/categoryIcons';
import { translateCategory } from '@/utils/categoryTranslations';
import { useTranslation } from 'react-i18next';
import { ChartTooltip, ChartLegend } from './ChartComponents';
import styles from './DashboardCharts.module.scss';

export default function DashboardCharts() {
  const isMobile = useIsMobile();
  const [categoryType, setCategoryType] = useState('expense');
  const { t } = useTranslation();
  
  // Aufgelöste CSS-Variablen für Recharts (SVG benötigt echte Farbwerte)
  const cssColors = useCssVariables();

  // ──────────────────────────────────────────────────────────────────────
  // CHART DATA FROM HOOK
  // ──────────────────────────────────────────────────────────────────────
  const {
    incomeExpenseData,
    trendData,
    categoryExpenseData,
    categoryIncomeData,
    expenseTotal,
    incomeTotal,
    savingsRate,
    hasAnyData,
  } = useDashboardChartData();

  const lastTrendPoint = trendData.length > 0 ? trendData[trendData.length - 1] : null;

  if (!hasAnyData) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <STATE_ICONS.chart />
        </div>
        <h3 className={styles.emptyTitle}>{t('dashboard.noDataTitle')}</h3>
        <p className={styles.emptyText}>
          {t('dashboard.noDataSubtitle')}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.chartsGrid}>
      {/* Pie Chart - Einnahmen vs Ausgaben (Smart Budget Ring) */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div>
            <h3 className={styles.chartTitle}>{t('dashboard.incomeVsExpense')}</h3>
            <p className={styles.chartSubtitle}>{t('dashboard.currentMonth')}</p>
          </div>
          <span className={styles.chartMeta}>{formatMonthLabel(new Date())}</span>
        </div>
        
        <div className={styles.chartBody}>
          <ResponsiveContainer width="100%" height={isMobile ? 260 : 240}>
            <PieChart>
              <Pie
                data={incomeExpenseData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="45%"
                innerRadius={isMobile ? 55 : 65} // Dünnerer Ring
                outerRadius={isMobile ? 70 : 85}
                paddingAngle={4}
                cornerRadius={6} // Abgerundete Enden für modernen Look
                stroke="none"
              >
                <Cell fill={cssColors.success} name={t('dashboard.income')} />
                <Cell fill={cssColors.error} name={t('dashboard.expenses')} />
                <Label
                  position="center"
                  content={(props) => {
                    const cx = props?.viewBox?.cx;
                    const cy = props?.viewBox?.cy;
                    if (typeof cx !== 'number' || typeof cy !== 'number') return null;

                    const isPositive = savingsRate >= 0;
                    const rateLabel = isPositive ? t('dashboard.savingsRate') : t('dashboard.deficit');
                    const isNonLatin = /[^\u0024F\u1E00-\u1EFF\s\d%]/.test(rateLabel);
                    const labelLength = rateLabel.length;
                    const labelFontSize = labelLength > 14 ? 10 : 12;
                    const labelTextLength = labelLength > 14 ? (isMobile ? 78 : 96) : undefined;
                    const rateValue = `${Math.abs(savingsRate).toFixed(1)}%`;
                    const rateColor = isPositive ? 'var(--success)' : 'var(--error)';

                    return (
                      <g>
                        <text
                          x={cx}
                          y={cy - 10}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="var(--tx-muted)"
                          fontSize={labelFontSize}
                          fontWeight={600}
                          textLength={labelTextLength}
                          lengthAdjust={labelTextLength ? 'spacingAndGlyphs' : undefined}
                          style={{ letterSpacing: isNonLatin ? '0.01em' : '0.05em', textTransform: isNonLatin ? 'none' : 'uppercase' }}
                        >
                          {rateLabel}
                        </text>
                        <text
                          x={cx}
                          y={cy + 14}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill={rateColor}
                          fontSize={20}
                          fontWeight={800}
                        >
                          {rateValue}
                        </text>
                      </g>
                    );
                  }}
                />
              </Pie>
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                content={<ChartTooltip variant="pie" />}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                iconSize={10}
                content={<ChartLegend />}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Composed Chart - Monatlicher Trend (Bar + Lines) */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div>
            <h3 className={styles.chartTitle}>{t('dashboard.monthlyTrend')}</h3>
            <p className={styles.chartSubtitle}>
              {trendData.length > 0
                ? t('dashboard.lastMonths', { count: trendData.length })
                : t('dashboard.noDataShort')}
            </p>
          </div>
          {lastTrendPoint ? (
            <span className={styles.chartMeta}>{lastTrendPoint.month}</span>
          ) : null}
        </div>
        
        <div className={styles.chartBody}>
          <ResponsiveContainer width="100%" height={isMobile ? 260 : 240}>
            <ComposedChart data={trendData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={cssColors.border} opacity={0.4} vertical={false} />
              <XAxis 
                dataKey="month" 
                tick={{ fill: cssColors.txMuted, fontSize: 11 }}
                axisLine={{ stroke: cssColors.border, strokeOpacity: 0.5 }}
                tickLine={false}
                dy={10}
              />
              <YAxis 
                tick={{ fill: cssColors.txMuted, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={45}
                tickFormatter={(value) => value === 0 ? '0' : value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                content={<ChartTooltip />}
                cursor={{ fill: 'var(--surface-2)', opacity: 0.4 }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                iconSize={10}
                content={<ChartLegend />}
              />

              {/* Netto-Saldo als Balken */}
              <Bar dataKey="balance" name={t('dashboard.netBalance')} barSize={isMobile ? 12 : 18} radius={[4, 4, 0, 0]}>
                {trendData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.balance >= 0 ? cssColors.success : cssColors.error} 
                    fillOpacity={0.7}
                  />
                ))}
              </Bar>

              <Line 
                type="monotone" 
                dataKey="income" 
                name={t('dashboard.income')}
                stroke={cssColors.success} 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                strokeOpacity={0.8}
              />
              <Line 
                type="monotone" 
                dataKey="expense" 
                name={t('dashboard.expenses')}
                stroke={cssColors.error} 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                strokeOpacity={0.8}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Kategorien Analyse (vollständig, ohne Top-Limit) */}
      <div
        className={`${styles.chartCard} ${styles.fullWidth}`}
        style={{
          '--series': categoryType === 'expense' ? 'var(--error)' : 'var(--success)',
          '--series-rgb': categoryType === 'expense' ? 'var(--error-rgb)' : 'var(--success-rgb)',
        }}
      >
        <div className={styles.chartHeader}>
          <div>
            <h3 className={styles.chartTitle}>{t('dashboard.categoriesTitle')}</h3>
            <p className={styles.chartSubtitle}>{t('dashboard.categoriesSubtitle')}</p>
          </div>
          <div className={styles.segmentControl} role="tablist" aria-label={t('dashboard.categoriesTypeLabel')}>
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

        <div className={styles.categoryMetaRow}>
          <div className={styles.categoryMetaItem}>
            <span className={styles.categoryMetaLabel}>{t('dashboard.totalLabel')}</span>
            <span className={styles.categoryMetaValue}>
              {formatCurrency(categoryType === 'expense' ? expenseTotal : incomeTotal)}
            </span>
          </div>
          <div className={styles.categoryMetaItem}>
            <span className={styles.categoryMetaLabel}>{t('dashboard.categoriesLabel')}</span>
            <span className={styles.categoryMetaValue}>
              {(categoryType === 'expense' ? categoryExpenseData : categoryIncomeData).length}
            </span>
          </div>
        </div>

        <div className={styles.categoryBody}>
          {((categoryType === 'expense' ? categoryExpenseData : categoryIncomeData).length === 0) ? (
            <div className={styles.categoryEmpty}>
              <div className={styles.categoryEmptyIcon}>
                <STATE_ICONS.chart />
              </div>
              <div className={styles.categoryEmptyText}>
                {t('dashboard.noCategoryData')}
              </div>
            </div>
          ) : (
            <ul className={styles.categoryList} role="list">
              {(categoryType === 'expense' ? categoryExpenseData : categoryIncomeData).map((item) => {
                const total = categoryType === 'expense' ? expenseTotal : incomeTotal;
                const percent = total > 0 ? (item.amount / total) * 100 : 0;
                const width = `${Math.max(0, Math.min(100, percent))}%`;

                return (
                  <li key={item.category} className={styles.categoryRow}>
                    <div className={styles.categoryLeft}>
                      <span className={styles.categoryIconWrap} aria-hidden="true">
                        <CategoryIcon category={item.category} />
                      </span>
                      <div className={styles.categoryText}>
                        <div className={styles.categoryName}>
                          {translateCategory(item.category, t)}
                        </div>
                        <div className={styles.categorySub}>
                          {t('dashboard.transactionCount', { count: item.count })}
                        </div>
                      </div>
                    </div>

                    <div className={styles.categoryRight}>
                      <div className={styles.categoryAmount}>{formatCurrency(item.amount)}</div>
                      <div className={styles.categoryBar} aria-hidden="true">
                        <div className={styles.categoryBarFill} style={{ width }} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}