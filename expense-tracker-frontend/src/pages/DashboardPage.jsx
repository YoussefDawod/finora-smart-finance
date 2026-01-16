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
import { SummaryCard, RecentTransactions } from '@/components/dashboard';
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
    const calculateTrend = (current, previous) => {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }
      return ((current - previous) / previous) * 100;
    };

    const incomeTrend = calculateTrend(currentIncome, lastMonthIncome);
    const expenseTrend = calculateTrend(currentExpense, lastMonthExpense);
    const balanceTrend = calculateTrend(currentBalance, lastMonthBalance);

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

    const formatTrend = (value) => {
      const rounded = Math.round(value);
      const sign = rounded > 0 ? '+' : '';
      return `${sign}${rounded}%`;
    };

    return {
      income: {
        value: formatCurrency(currentIncome),
        amount: currentIncome,
        trend: formatTrend(incomeTrend),
        trendPercent: Math.round(incomeTrend),
      },
      expense: {
        value: formatCurrency(currentExpense),
        amount: currentExpense,
        trend: formatTrend(expenseTrend),
        trendPercent: Math.round(expenseTrend),
      },
      balance: {
        value: formatCurrency(currentBalance),
        amount: currentBalance,
        trend: formatTrend(balanceTrend),
        trendPercent: Math.round(balanceTrend),
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
          <h1>Willkommen zurück, {user?.name?.split(' ')[0]}! 👋</h1>
          <p>Hier ist eine Übersicht Ihrer finanziellen Aktivitäten diesen Monat</p>
        </div>
        <Button
          variant="primary"
          size="medium"
          icon={<FiPlus />}
          onClick={() => navigate('/transactions')}
        >
          Transaktion hinzufügen
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
            color="balance"
            size="medium"
          />
        </motion.div>
      </motion.section>

      {/* Charts Section */}
      <motion.section className={styles.chartsSection} variants={itemVariants}>
        <div className={styles.comingSoon}>
          <h2>📊 Charts & Visualisierungen</h2>
          <p>Income/Expense Chart, Trend Chart und Category Breakdown werden hier angezeigt...</p>
        </div>
      </motion.section>

      {/* Recent Transactions Section */}
      <motion.section className={styles.transactionsSection} variants={itemVariants}>
        <RecentTransactions limit={5} />
      </motion.section>
    </motion.div>
  );
}
