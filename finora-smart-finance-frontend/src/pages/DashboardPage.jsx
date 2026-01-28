/**
 * @fileoverview DashboardPage Component
 * @description Haupt-Dashboard mit Summary Cards, Charts und Statistiken
 * Nutzt aggregierte Daten vom Server (keine Client-Side-Berechnung)
 * 
 * LAYOUT:
 * - Header mit Begrüßung
 * - 3 Summary Cards: Einkommen | Ausgaben | Balance
 * - Charts & Breakdowns
 * - Recent Transactions
 */

import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks';
import { useTransactions } from '@/hooks/useTransactions';
import { useNavigate } from 'react-router-dom';
import { SummaryCard, RecentTransactions, DashboardCharts } from '@/components/dashboard';
import Button from '@/components/common/Button/Button';
import Spinner from '@/components/common/Spinner/Spinner';
import ErrorBoundary from '@/components/common/ErrorBoundary/ErrorBoundary';
import { formatCurrency } from '@/utils/formatters';
import { FiDollarSign, FiCreditCard, FiTrendingUp, FiPlus } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import styles from './DashboardPage.module.scss';
import i18n from '@/i18n';

export default function DashboardPage() {
  // Wrap content in ErrorBoundary to prevent white screen
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}

function DashboardContent() {
  const { user, isAuthenticated } = useAuth();
  const { dashboardData, dashboardLoading, error, fetchDashboardData, fetchTransactions } = useTransactions();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Fallback: ensure data is fetched when arriving on dashboard
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    // Safety check: Prevent infinite loop if dashboardData is null but loading is false
    // Only fetch if we really have nothing and no error
    if (!dashboardData && !dashboardLoading && !error) {
      fetchDashboardData();
      fetchTransactions();
    }
  }, [isAuthenticated, user, dashboardData, dashboardLoading, error, fetchDashboardData, fetchTransactions]);

  // ──────────────────────────────────────────────────────────────────────
  // FORMAT SUMMARY DATA FROM SERVER
  // ──────────────────────────────────────────────────────────────────────
  const summaryData = useMemo(() => {
    try {
      const buildTrendInfo = (percent, mode = 'standard') => {
        // Kein Trend-Vergleich möglich (Vormonat hatte keine Daten)
        if (percent === null || percent === undefined) {
          return {
            label: null, // Kein Label anzeigen
            variant: 'neutral',
            showTrend: false,
          };
        }

        // Keine Änderung
        if (percent === 0) {
          return {
            label: t('dashboard.noChange'),
            variant: 'neutral',
            showTrend: true,
          };
        }

        let variant = percent > 0 ? 'up' : 'down';
        // Bei Ausgaben ist "mehr" schlecht (down) und "weniger" gut (up)
        if (mode === 'expense') {
          variant = percent > 0 ? 'down' : 'up';
        }

        return {
          label: `${percent > 0 ? '+' : ''}${percent}%`,
          variant,
          showTrend: true,
        };
      };

      // Fallback wenn keine Daten
      if (!dashboardData?.summary) {
        return {
          income: {
            value: formatCurrency(0),
            amount: 0,
            trend: null,
            trendLabel: null,
            trendVariant: 'neutral',
            trendPercent: null,
          },
          expense: {
            value: formatCurrency(0),
            amount: 0,
            trend: null,
            trendLabel: null,
            trendVariant: 'neutral',
            trendPercent: null,
          },
          balance: {
            value: formatCurrency(0),
            amount: 0,
            trend: null,
            trendLabel: null,
            trendVariant: 'neutral',
            trendPercent: null,
          },
        };
      }

      const { currentMonth, trends } = dashboardData.summary;
      
      const incomeTrend = buildTrendInfo(trends?.income, 'standard');
      const expenseTrend = buildTrendInfo(trends?.expense, 'expense');
      const balanceTrend = buildTrendInfo(trends?.balance, currentMonth?.balance >= 0 ? 'standard' : 'expense');

      // Trend-Text nur anzeigen wenn wirklich ein Vergleich möglich ist
      const getTrendText = (trendInfo) => {
        return trendInfo.showTrend ? i18n.t('dashboard.vsLastMonth') : null;
      };

      return {
        income: {
          value: formatCurrency(currentMonth?.income || 0),
          amount: currentMonth?.income || 0,
          trend: getTrendText(incomeTrend),
          trendLabel: incomeTrend.label,
          trendVariant: incomeTrend.variant,
          trendPercent: trends?.income,
          trendTooltip: incomeTrend.showTrend ? i18n.t('dashboard.incomeTrendTooltip') : null,
        },
        expense: {
          value: formatCurrency(currentMonth?.expense || 0),
          amount: currentMonth?.expense || 0,
          trend: getTrendText(expenseTrend),
          trendLabel: expenseTrend.label,
          trendVariant: expenseTrend.variant,
          trendPercent: trends?.expense,
          trendTooltip: expenseTrend.showTrend ? i18n.t('dashboard.expenseTrendTooltip') : null,
        },
        balance: {
          value: formatCurrency(currentMonth?.balance || 0),
          amount: currentMonth?.balance || 0,
          trend: getTrendText(balanceTrend),
          trendLabel: balanceTrend.label,
          trendVariant: balanceTrend.variant,
          trendPercent: trends?.balance,
          trendTooltip: balanceTrend.showTrend ? i18n.t('dashboard.balanceTrendTooltip') : null,
        },
      };
    } catch (err) {
      console.error("Error calculating summary data", err);
      // Return safe default keys
      return {
        income: { value: "€0,00", amount: 0, trend: null },
        expense: { value: "€0,00", amount: 0, trend: null },
        balance: { value: "€0,00", amount: 0, trend: null }
      };
    }
  }, [dashboardData, t]);

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

  // ──────────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ──────────────────────────────────────────────────────────────────────
  if (dashboardLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="large" />
        <p>{t('dashboard.loading')}</p>
      </div>
    );
  }

  if (!dashboardData && error) {
    return (
      <div className={styles.loadingContainer}>
        <p>{t('dashboard.errors.load')}</p>
        <Button variant="secondary" onClick={() => {
          fetchDashboardData();
          fetchTransactions();
        }}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // RENDER CONTENT
  // ──────────────────────────────────────────────────────────────────────
  return (
    <div className={styles.dashboardPage}>

      {/* Header Section */}
      <motion.section className={styles.headerSection} variants={itemVariants}>
        <div className={styles.greeting}>
          <h1 className={styles.greetingTitle}>
            <span className={styles.greetingIntro}>{t('dashboard.greetingIntro')}</span>{' '}
            {/* SAFE CHECK: Ensure split doesn't crash if name is missing */}
            <span className={styles.greetingName}>{user?.name ? user.name.split(' ')[0] : ''}</span> 👋
          </h1>
          <p>{t('dashboard.overview')}</p>
        </div>
        <Button
          variant="primary"
          size="small"
          icon={<FiPlus />}
          onClick={() => navigate('/transactions')}
        >
          {t('dashboard.newTransaction')}
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
            title={t('dashboard.income')}
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
            title={t('dashboard.expenses')}
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
            title={t('dashboard.balance')}
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
          <h2>{t('dashboard.chartsTitle')}</h2>
        </div>
        <ErrorBoundary>
          <DashboardCharts />
        </ErrorBoundary>
      </motion.section>

      {/* Recent Transactions Section */}
      <motion.section className={styles.transactionsSection} variants={itemVariants}>
        <ErrorBoundary>
          <RecentTransactions limit={5} />
        </ErrorBoundary>
      </motion.section>
    </div>
  );
}
