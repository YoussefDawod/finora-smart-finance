import React, { useMemo, useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { useIsMobile } from '@/hooks';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/utils/formatters';
import { STATE_ICONS } from '@/utils/categoryIcons';
import styles from './DashboardCharts.module.scss';

const MONTHS_BACK = 6;

// Hook to get computed CSS variable colors for Recharts
const useChartColors = () => {
  const [colors, setColors] = useState({
    success: '#10b981',
    error: '#ef4444',
    primary: '#6366f1',
    border: '#e5e7eb',
    textMuted: '#6b7280',
  });

  useEffect(() => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    const getColor = (varName, fallback) => {
      const value = computedStyle.getPropertyValue(varName).trim();
      return value || fallback;
    };

    setColors({
      success: getColor('--success', '#10b981'),
      error: getColor('--error', '#ef4444'),
      primary: getColor('--primary', '#6366f1'),
      border: getColor('--border', '#e5e7eb'),
      textMuted: getColor('--tx-muted', '#6b7280'),
    });
  }, []);

  return colors;
};

const formatMonthLabel = (date) =>
  new Intl.DateTimeFormat('de-DE', { month: 'short' }).format(date);

const getMonthKey = (date) => `${date.getFullYear()}-${date.getMonth()}`;

const normalizeDate = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

export default function DashboardCharts() {
  const { transactions } = useTransactions();
  const isMobile = useIsMobile();
  const chartColors = useChartColors();

  const {
    incomeExpenseData,
    trendData,
    categoryData,
    hasAnyData,
  } = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const currentMonthTx = transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate >= monthStart && txDate <= monthEnd;
    });

    const incomeTotal = currentMonthTx
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const expenseTotal = currentMonthTx
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const incomeExpenseData = [
      { name: 'Einnahmen', value: incomeTotal },
      { name: 'Ausgaben', value: expenseTotal },
    ];

    const trendData = Array.from({ length: MONTHS_BACK }, (_, idx) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (MONTHS_BACK - 1 - idx), 1);
      const key = getMonthKey(date);
      return { key, month: formatMonthLabel(date), income: 0, expense: 0 };
    });

    const trendMap = new Map(trendData.map((item) => [item.key, item]));

    transactions.forEach((tx) => {
      const txDate = normalizeDate(new Date(tx.date));
      const key = getMonthKey(txDate);
      const bucket = trendMap.get(key);
      if (!bucket) return;
      if (tx.type === 'income') bucket.income += tx.amount;
      if (tx.type === 'expense') bucket.expense += tx.amount;
    });

    const categoryTotals = currentMonthTx
      .filter((tx) => tx.type === 'expense')
      .reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
        return acc;
      }, {});

    const categoryData = Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    const hasAnyData = transactions.length > 0;

    return { incomeExpenseData, trendData, categoryData, hasAnyData };
  }, [transactions]);

  if (!hasAnyData) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <STATE_ICONS.chart />
        </div>
        <h3 className={styles.emptyTitle}>Noch keine Daten</h3>
        <p className={styles.emptyText}>
          Sobald Transaktionen vorhanden sind, erscheinen hier Auswertungen und Trends.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.chartsGrid}>
      {/* Pie Chart - Einnahmen vs Ausgaben */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div>
            <h3 className={styles.chartTitle}>Einnahmen vs. Ausgaben</h3>
            <p className={styles.chartSubtitle}>Aktueller Monat</p>
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
                innerRadius={isMobile ? 45 : 55}
                outerRadius={isMobile ? 75 : 90}
                paddingAngle={3}
                strokeWidth={0}
              >
                <Cell fill={chartColors.success} name="Einnahmen" />
                <Cell fill={chartColors.error} name="Ausgaben" />
              </Pie>
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                iconSize={10}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart - Monatlicher Trend */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div>
            <h3 className={styles.chartTitle}>Monatlicher Trend</h3>
            <p className={styles.chartSubtitle}>Letzte {MONTHS_BACK} Monate</p>
          </div>
        </div>
        <div className={styles.chartBody}>
          <ResponsiveContainer width="100%" height={isMobile ? 260 : 240}>
            <LineChart data={trendData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} opacity={0.5} />
              <XAxis 
                dataKey="month" 
                tick={{ fill: chartColors.textMuted, fontSize: 12 }}
                axisLine={{ stroke: chartColors.border }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: chartColors.textMuted, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={50}
                tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="line"
                iconSize={14}
              />
              <Line 
                type="monotone" 
                dataKey="income" 
                name="Einnahmen"
                stroke={chartColors.success} 
                strokeWidth={2.5}
                dot={{ fill: chartColors.success, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
              <Line 
                type="monotone" 
                dataKey="expense" 
                name="Ausgaben"
                stroke={chartColors.error} 
                strokeWidth={2.5}
                dot={{ fill: chartColors.error, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart - Kategorien */}
      <div className={`${styles.chartCard} ${styles.fullWidth}`}>
        <div className={styles.chartHeader}>
          <div>
            <h3 className={styles.chartTitle}>Ausgaben nach Kategorie</h3>
            <p className={styles.chartSubtitle}>Top Kategorien im aktuellen Monat</p>
          </div>
        </div>
        <div className={styles.chartBody}>
          <ResponsiveContainer width="100%" height={isMobile ? 300 : 280}>
            <BarChart data={categoryData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} opacity={0.5} vertical={false} />
              <XAxis 
                dataKey="category" 
                tick={{ fill: chartColors.textMuted, fontSize: 11 }}
                axisLine={{ stroke: chartColors.border }}
                tickLine={false}
                interval={0}
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? 'end' : 'middle'}
                height={isMobile ? 60 : 30}
              />
              <YAxis 
                tick={{ fill: chartColors.textMuted, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={50}
                tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              />
              <Bar 
                dataKey="amount" 
                name="Ausgaben"
                fill={chartColors.primary} 
                radius={[6, 6, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}