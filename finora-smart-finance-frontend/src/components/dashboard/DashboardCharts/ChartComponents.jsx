/* eslint-disable react-refresh/only-export-components */
/**
 * ============================================================================
 * DASHBOARD CHART COMPONENTS
 * Wiederverwendbare Chart-Hilfskomponenten
 * ============================================================================
 */
import { useTranslation } from 'react-i18next';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { formatCurrency } from '@/utils/formatters';
import { useCssVariables } from '@/hooks';
import { tooltipContentStyle } from './chartConstants';
import styles from './DashboardCharts.module.scss';

// ──────────────────────────────────────────────────────────────────────
// Re-export für externe Komponenten
// ──────────────────────────────────────────────────────────────────────
export { tooltipContentStyle } from './chartConstants';

// ──────────────────────────────────────────────────────────────────────
// SERIES ICON
// ──────────────────────────────────────────────────────────────────────
export const SeriesIcon = ({ series }) => {
  if (series === 'income') return <FiTrendingUp />;
  if (series === 'expense') return <FiTrendingDown />;
  if (series === 'balance') {
    return <span style={{ fontSize: '1.2em', fontWeight: 'bold' }}>=</span>;
  }
  return null;
};

// ──────────────────────────────────────────────────────────────────────
// CHART TOOLTIP
// ──────────────────────────────────────────────────────────────────────
export const ChartTooltip = ({ active, payload, label, variant }) => {
  const { t } = useTranslation();
  const cssColors = useCssVariables();
  
  if (!active || !payload || payload.length === 0) return null;

  const sortedPayload = [...payload].sort((a, b) => {
    const order = { income: 1, expense: 2, balance: 3 };
    return (order[a.name] || 99) - (order[b.name] || 99);
  });

  return (
    <div className={styles.tooltip} style={tooltipContentStyle}>
      {label ? <div className={styles.tooltipTitle}>{label}</div> : null}

      <div className={styles.tooltipRows}>
        {sortedPayload.map((p, idx) => {
          const value = typeof p.value === 'number' ? p.value : 0;
          const name = p.name;

          let displayName = name;
          let dotColor = p.color;

          if (p.dataKey === 'income') {
            displayName = t('dashboard.income');
            dotColor = cssColors.success;
          } else if (p.dataKey === 'expense') {
            displayName = t('dashboard.expenses');
            dotColor = cssColors.error;
          } else if (p.dataKey === 'balance') {
            displayName = t('dashboard.netBalance');
            dotColor = value >= 0 ? cssColors.success : cssColors.error;
          }

          if (!dotColor && p.payload && (p.payload.fill || p.payload.stroke)) {
            dotColor = p.payload.fill || p.payload.stroke;
          }

          return (
            <div key={`${name}-${idx}`} className={styles.tooltipRow}>
              <span className={styles.tooltipLeft}>
                <span
                  className={styles.tooltipDot}
                  style={{ background: dotColor }}
                  aria-hidden="true"
                />
                <span className={styles.tooltipName}>{displayName}</span>
              </span>
              <span className={styles.tooltipValue}>{formatCurrency(value)}</span>
            </div>
          );
        })}
      </div>

      {variant === 'pie' ? (
        <div className={styles.tooltipFooter}>{t('dashboard.chartRatioNote')}</div>
      ) : null}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────
// CHART LEGEND
// ──────────────────────────────────────────────────────────────────────
export const ChartLegend = ({ payload }) => {
  const { t } = useTranslation();
  const cssColors = useCssVariables();
  
  if (!payload || payload.length === 0) return null;

  // Schutz gegen doppelte Legend-Einträge
  const uniquePayload = (() => {
    const byValue = new Map();
    for (const item of payload) {
      const value = item?.value;
      if (!value) continue;

      const prev = byValue.get(value);
      const isLineLike = Boolean(
        item?.payload?.stroke || (item?.color && item?.type === 'line')
      );
      const prevIsLineLike = Boolean(
        prev?.payload?.stroke || (prev?.color && prev?.type === 'line')
      );

      if (!prev || (isLineLike && !prevIsLineLike)) {
        byValue.set(value, item);
      }
    }
    return Array.from(byValue.values());
  })();

  return (
    <div className={styles.legend} role="list">
      {uniquePayload.map((entry, idx) => {
        const name = entry.value;
        const series =
          name === t('dashboard.income')
            ? 'income'
            : name === t('dashboard.expenses')
              ? 'expense'
              : null;
        const color =
          entry.color ||
          entry?.payload?.stroke ||
          entry?.payload?.fill ||
          cssColors.border;

        return (
          <div
            key={`${name}-${entry.dataKey || entry?.payload?.dataKey || ''}-${idx}`}
            className={styles.legendItem}
            role="listitem"
          >
            <span
              className={styles.legendDot}
              style={{ background: color }}
              aria-hidden="true"
            />
            <span className={styles.legendLabel}>
              <span className={styles.legendIcon} aria-hidden="true">
                <SeriesIcon series={series} />
              </span>
              {name}
            </span>
          </div>
        );
      })}
    </div>
  );
};
