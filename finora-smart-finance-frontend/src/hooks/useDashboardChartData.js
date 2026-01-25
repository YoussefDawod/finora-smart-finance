/**
 * ============================================================================
 * USE DASHBOARD CHART DATA HOOK
 * Extrahierte Daten-Transformationslogik für Dashboard-Charts
 * ============================================================================
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTransactions } from '@/hooks/useTransactions';
import { getLocaleForLanguage, getUserPreferences } from '@/utils/userPreferences';

// ──────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ──────────────────────────────────────────────────────────────────────

/**
 * Holt die aktuelle Locale basierend auf Benutzereinstellungen
 */
const getLocale = () => getLocaleForLanguage(getUserPreferences().language);

/**
 * Formatiert Monat aus Server-Daten (year, month -> "Jan", "Feb" etc.)
 */
const formatMonthFromData = (year, month) => {
  const date = new Date(year, month - 1, 1); // month is 1-based from server
  return new Intl.DateTimeFormat(getLocale(), { month: 'short' }).format(date);
};

/**
 * Formatiert aktuellen Monat (für Pie Chart Header)
 */
export const formatMonthLabel = (date) =>
  new Intl.DateTimeFormat(getLocale(), { month: 'short' }).format(date);

// ──────────────────────────────────────────────────────────────────────
// HOOK DEFINITION
// ──────────────────────────────────────────────────────────────────────

/**
 * Custom Hook für Dashboard-Chart-Daten-Transformation
 * @returns {Object} Transformierte Chart-Daten
 */
export const useDashboardChartData = () => {
  const { dashboardData } = useTransactions();
  const { t } = useTranslation();

  return useMemo(() => {
    // Fallback wenn keine Daten
    if (!dashboardData?.summary) {
      return {
        incomeExpenseData: [],
        trendData: [],
        categoryExpenseData: [],
        categoryIncomeData: [],
        expenseTotal: 0,
        incomeTotal: 0,
        monthIncome: 0,
        monthExpense: 0,
        monthBalance: 0,
        savingsRate: 0,
        hasAnyData: false,
      };
    }

    const { currentMonth } = dashboardData.summary;

    // Pie Chart: Einnahmen vs Ausgaben (aktueller Monat)
    const incomeExpenseData = [
      { name: t('dashboard.income'), value: currentMonth?.income || 0 },
      { name: t('dashboard.expenses'), value: currentMonth?.expense || 0 },
    ];

    const monthIncome = currentMonth?.income || 0;
    const monthExpense = currentMonth?.expense || 0;
    const monthBalance = monthIncome - monthExpense;

    // Sparquote berechnen
    let savingsRate = 0;
    if (monthIncome > 0) {
      savingsRate = (monthBalance / monthIncome) * 100;
    }

    // Line Chart: Monthly Trend (bereits vom Server aggregiert)
    const trendData = (dashboardData.monthlyTrend || []).map((item) => ({
      month: formatMonthFromData(item.year, item.month),
      income: item.income || 0,
      expense: item.expense || 0,
      balance: (item.income || 0) - (item.expense || 0),
    }));

    const breakdown = dashboardData.categoryBreakdown || [];

    const categoryExpenseData = breakdown
      .filter((cat) => cat.type === 'expense')
      .map((cat) => ({
        category: cat.category,
        amount: cat.total || 0,
        count: cat.count || 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const categoryIncomeData = breakdown
      .filter((cat) => cat.type === 'income')
      .map((cat) => ({
        category: cat.category,
        amount: cat.total || 0,
        count: cat.count || 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const expenseTotal = categoryExpenseData.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const incomeTotal = categoryIncomeData.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const hasAnyData = dashboardData.summary.totalTransactions > 0;

    return {
      incomeExpenseData,
      trendData,
      categoryExpenseData,
      categoryIncomeData,
      expenseTotal,
      incomeTotal,
      monthIncome,
      monthExpense,
      monthBalance,
      savingsRate,
      hasAnyData,
    };
  }, [dashboardData, t]);
};

export default useDashboardChartData;
