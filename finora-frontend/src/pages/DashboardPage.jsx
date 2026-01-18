/**
 * @fileoverview DashboardPage Component
 * @description Haupt-Dashboard mit Summary Cards, Charts und Statistiken
 * 
 * LAYOUT:
 * - Header mit Begrüßung
 * - 3 Summary Cards: Einkommen | Ausgaben | Balance (ECHTE DATEN)
 * - Charts & Breakdowns
 * - Recent Transactions
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useNavigate } from 'react-router-dom';
import { SummaryCard, RecentTransactions, DashboardCharts } from '@/components/dashboard';
import Button from '@/components/common/Button/Button';
import { FiDollarSign, FiCreditCard, FiTrendingUp, FiPlus } from 'react-icons/fi';
import styles from './DashboardPage.module.scss';

export default function DashboardPage() {
  const { user } = useAuth();
  const { transactions } = useTransactions();
  const navigate = useNavigate();

  // ──────────────────────────────────────────────────────────────────────
  // BERECHNE ECHTE DATEN AUS TRANSAKTIONEN
  // ──────────────────────────────────────────────────────────────────────
  const summaryData = useMemo(() => {
    // Aktuelle Periode: Dieser Monat
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Vorherige Periode: Letzter Monat
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // ────────────────────────────────────────────────────────────────────
    // FILTER TRANSAKTIONEN NACH MONAT
    // ────────────────────────────────────────────────────────────────────
    const currentMonthTransactions = transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });

    const lastMonthTransactions = transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate.getMonth() === lastMonth && txDate.getFullYear() === lastYear;
    });

    // ────────────────────────────────────────────────────────────────────
    // BERECHNE SUMMEN FÜR AKTUELLEN MONAT
    // ────────────────────────────────────────────────────────────────────
    const currentIncome = currentMonthTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const currentExpense = currentMonthTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const currentBalance = currentIncome - currentExpense;

    // ────────────────────────────────────────────────────────────────────
    // BERECHNE SUMMEN FÜR LETZTEN MONAT (FÜR TRENDS)
    // ────────────────────────────────────────────────────────────────────
    const lastMonthIncome = lastMonthTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const lastMonthExpense = lastMonthTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const lastMonthBalance = lastMonthIncome - lastMonthExpense;

    // ────────────────────────────────────────────────────────────────────
    // BERECHNE TRENDS (% CHANGE)
    // ────────────────────────────────────────────────────────────────────
    const calculatePercent = (current, previous) => {
      if (previous === 0) return null;
      return Math.round(((current - previous) / Math.abs(previous)) * 100);
    };

    const buildTrend = (current, previous, mode = 'standard') => {
      const percent = calculatePercent(current, previous);

      if (percent === null) {
        const hasValue = current !== 0;
        let variant = hasValue ? (current > 0 ? 'up' : 'down') : 'neutral';
        if (mode === 'expense' && current > 0) {
          variant = 'down';
        }
        if (mode === 'balance') {
          variant = current > 0 ? 'up' : current < 0 ? 'down' : 'neutral';
        }
        return {
          percent: null,
          label: hasValue ? 'Neu' : '0%',
          variant,
        };
      }

      let variant = percent > 0 ? 'up' : percent < 0 ? 'down' : 'neutral';
      if (mode === 'expense') {
        variant = percent > 0 ? 'down' : percent < 0 ? 'up' : 'neutral';
      }
      if (mode === 'balance') {
        variant = current > 0 ? 'up' : current < 0 ? 'down' : 'neutral';
      }

      return {
        percent,
        label: `${percent > 0 ? '+' : ''}${percent}%`,
        variant,
      };
    };

    const incomeTrend = buildTrend(currentIncome, lastMonthIncome, 'standard');
    const expenseTrend = buildTrend(currentExpense, lastMonthExpense, 'expense');
    const balanceTrend = buildTrend(currentBalance, lastMonthBalance, 'balance');

    // ────────────────────────────────────────────────────────────────────
    // FORMAT DATEN FÜR DISPLAY
    // ────────────────────────────────────────────────────────────────────
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    return {
      income: {
        value: formatCurrency(currentIncome),
        amount: currentIncome,
        trend: 'im Vergleich zum letzten Monat',
        trendLabel: incomeTrend.label,
        trendVariant: incomeTrend.variant,
        trendPercent: incomeTrend.percent ?? 0,
        trendTooltip: 'Einkommen im Vergleich zum letzten Monat',
      },
      expense: {
        value: formatCurrency(currentExpense),
        amount: currentExpense,
        trend: 'im Vergleich zum letzten Monat',
        trendLabel: expenseTrend.label,
        trendVariant: expenseTrend.variant,
        trendPercent: expenseTrend.percent ?? 0,
        trendTooltip: 'Ausgaben im Vergleich zum letzten Monat',
      },
      balance: {
        value: formatCurrency(currentBalance),
        amount: currentBalance,
        trend: 'im Vergleich zum letzten Monat',
        trendLabel: balanceTrend.label,
        trendVariant: balanceTrend.variant,
        trendPercent: balanceTrend.percent ?? 0,
        trendTooltip: 'Balance im Vergleich zum letzten Monat',
      },
    };
  }, [transactions]);

  // ──────────────────────────────────────────────────────────────────────
  // ANIMATIONS
  // ──────────────────────────────────────────────────────────────────────
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div
      className={styles.dashboardPage}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <motion.section className={styles.headerSection} variants={itemVariants}>
        <div className={styles.greeting}>
          <h1 className={styles.greetingTitle}>
            <span className={styles.greetingIntro}>Willkommen zurück,</span>{' '}
            <span className={styles.greetingName}>{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p>Hier ist eine Übersicht Ihrer finanziellen Aktivitäten diesen Monat</p>
        </div>
        <Button
          variant="primary"
          size="small"
          icon={<FiPlus />}
          onClick={() => navigate('/transactions')}
        >
          Neue Transaktion
        </Button>
      </motion.section>

      {/* Summary Cards Grid */}
      <motion.section
        className={styles.summaryGrid}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Income Card */}
        <motion.div variants={itemVariants} key="income">
          <SummaryCard
            title="Einkommen"
            value={summaryData.income.value}
            icon={FiDollarSign}
            trend={summaryData.income.trend}
            trendPercent={summaryData.income.trendPercent}
            trendLabel={summaryData.income.trendLabel}
            trendVariant={summaryData.income.trendVariant}
            trendTooltip={summaryData.income.trendTooltip}
            color="income"
            size="medium"
          />
        </motion.div>

        {/* Expense Card */}
        <motion.div variants={itemVariants} key="expense">
          <SummaryCard
            title="Ausgaben"
            value={summaryData.expense.value}
            icon={FiCreditCard}
            trend={summaryData.expense.trend}
            trendPercent={summaryData.expense.trendPercent}
            trendLabel={summaryData.expense.trendLabel}
            trendVariant={summaryData.expense.trendVariant}
            trendTooltip={summaryData.expense.trendTooltip}
            color="expense"
            size="medium"
          />
        </motion.div>

        {/* Balance Card */}
        <motion.div variants={itemVariants} key="balance">
          <SummaryCard
            title="Balance"
            value={summaryData.balance.value}
            icon={FiTrendingUp}
            trend={summaryData.balance.trend}
            trendPercent={summaryData.balance.trendPercent}
            trendLabel={summaryData.balance.trendLabel}
            trendVariant={summaryData.balance.trendVariant}
            trendTooltip={summaryData.balance.trendTooltip}
            color="balance"
            size="medium"
          />
        </motion.div>
      </motion.section>

      {/* Charts Section */}
      <motion.section className={styles.section} variants={itemVariants}>
        <div className={styles.sectionHeader}>
          <h2>Charts & Visualisierungen</h2>
        </div>
        <DashboardCharts />
      </motion.section>

      {/* Recent Transactions Section */}
      <motion.section className={styles.transactionsSection} variants={itemVariants}>
        <RecentTransactions limit={3} />
      </motion.section>
    </motion.div>
  );
}
