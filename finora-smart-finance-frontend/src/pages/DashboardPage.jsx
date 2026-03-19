/**
 * @fileoverview DashboardPage Component — Aurora Flow
 * @description Haupt-Dashboard mit Glass-Panels, Aurora-Canvas-Hintergrund
 * und animierten Metriken. Nutzt aggregierte Daten vom Server.
 *
 * LAYOUT:
 * - AuroraCanvas (fixed ambient background)
 * - Header mit Begrüßung + Filter
 * - HeroMetricPanel (Balance hero + Income/Expense)
 * - panelRow: OrbitalSavingsRing | FlowAreaChart
 * - panelRow: GlassCategoryList | FlowTransactionList
 * - CompactWidgetRow: Budget | Quota | Retention
 */

import { createElement, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth, useMotion } from '@/hooks';
import { useTransactions } from '@/hooks/useTransactions';
import { useDashboardChartData } from '@/hooks/useDashboardChartData';
import { DashboardFilter } from '@/components/dashboard';
import AuroraCanvas from '@/components/dashboard/AuroraCanvas/AuroraCanvas';
import HeroMetricPanel from '@/components/dashboard/HeroMetricPanel/HeroMetricPanel';
import OrbitalSavingsRing from '@/components/dashboard/OrbitalSavingsRing/OrbitalSavingsRing';
import FlowAreaChart from '@/components/dashboard/FlowAreaChart/FlowAreaChart';
import GlassCategoryList from '@/components/dashboard/GlassCategoryList/GlassCategoryList';
import FlowTransactionList from '@/components/dashboard/FlowTransactionList/FlowTransactionList';
import CompactWidgetRow from '@/components/dashboard/CompactWidgetRow/CompactWidgetRow';
import GlassPanel from '@/components/dashboard/GlassPanel/GlassPanel';
import Button from '@/components/common/Button/Button';
import Skeleton from '@/components/common/Skeleton/Skeleton';
import ErrorBoundary from '@/components/common/ErrorBoundary/ErrorBoundary';
import { formatCurrency } from '@/utils/formatters';
import { getTimeOfDay, getTimeIcon } from '@/utils/getGreeting';
import { FiPlus } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useLifecycle } from '@/hooks/useLifecycle';
import styles from './DashboardPage.module.scss';
import i18n from '@/i18n';

// ──────────────────────────────────────────────────────────────────────
// ANIMATION VARIANTS (module-level constants — stable references)
// ──────────────────────────────────────────────────────────────────────
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}

function DashboardContent() {
  const { user, isAuthenticated } = useAuth();
  const { shouldAnimate } = useMotion();
  const {
    dashboardData,
    dashboardLoading,
    error,
    fetchDashboardData,
    fetchTransactions,
    dashboardMonth,
    dashboardYear,
    setDashboardMonth,
    filter,
  } = useTransactions();
  const { trendData } = useDashboardChartData();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    lifecycleStatus,
    quota,
    isLoading: lifecycleLoading,
    fetchLifecycleStatus,
    fetchQuota,
    confirmExport,
  } = useLifecycle();

  // Lifecycle-Daten und Quota einmalig laden (nur wenn authentifiziert)
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    fetchLifecycleStatus();
    fetchQuota();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Safety-Fallback: Dashboard-Daten laden, falls TransactionContext sie noch nicht hat
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (!dashboardData && !dashboardLoading && !error) {
      fetchDashboardData();
      fetchTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  // ──────────────────────────────────────────────────────────────────────
  // PAGE-LEVEL AURORA GRADIENT BACKGROUND
  // ──────────────────────────────────────────────────────────────────────
  // Setzt .page-dashboard auf <html>, damit der Aurora-Gradient
  // als Page-Background dargestellt wird (Layout-BGs → transparent).
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('page-dashboard');
    return () => root.classList.remove('page-dashboard');
  }, []);

  // Scroll-basierter Gradient-Wave-Effekt für "lebendigen" Premium-Look.
  // Kombiniert Winkel-Rotation + Farbstop-Verschiebung → sichtbare Wellenbewegung.
  useEffect(() => {
    if (!shouldAnimate) return;

    const root = document.documentElement;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? Math.min(scrollY / maxScroll, 1) : 0;

        // Sinuswelle für organische Bewegung (nicht linear)
        // Winkel: 135° → 180° → 135° (Hin-und-Zurück-Welle)
        const angle = 135 + Math.sin(progress * Math.PI) * 45;

        // Farbstop-Positionen verschieben sich gegenläufig → Wellen-Effekt
        // stop2: 35% → 20% → 50% → 20% → 35% (doppelte Frequenz)
        // stop3: 70% → 85% → 55% → 85% → 70% (gegenläufig)
        const waveOffset = Math.sin(progress * Math.PI * 2) * 15;
        const pos2 = 35 + waveOffset;
        const pos3 = 70 - waveOffset;

        root.style.setProperty('--aurora-angle', `${angle.toFixed(1)}deg`);
        root.style.setProperty('--aurora-pos-2', `${pos2.toFixed(1)}%`);
        root.style.setProperty('--aurora-pos-3', `${pos3.toFixed(1)}%`);
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      root.style.removeProperty('--aurora-angle');
      root.style.removeProperty('--aurora-pos-2');
      root.style.removeProperty('--aurora-pos-3');
    };
  }, [shouldAnimate]);

  // ──────────────────────────────────────────────────────────────────────
  // FORMAT SUMMARY DATA FOR HeroMetricPanel
  // ──────────────────────────────────────────────────────────────────────
  const summaryData = useMemo(() => {
    try {
      const buildTrendInfo = (percent, mode = 'standard') => {
        if (percent === null || percent === undefined) {
          return { label: null, variant: 'neutral', showTrend: false };
        }
        if (percent === 0) {
          return { label: t('dashboard.noChange'), variant: 'neutral', showTrend: true };
        }
        let variant = percent > 0 ? 'up' : 'down';
        if (mode === 'expense') {
          variant = percent > 0 ? 'down' : 'up';
        }
        return {
          label: `${percent > 0 ? '+' : ''}${percent}%`,
          variant,
          showTrend: true,
        };
      };

      if (!dashboardData?.summary) {
        return {
          balance: {
            label: t('dashboard.balance'),
            value: formatCurrency(0),
            trendLabel: null,
            trendVariant: 'neutral',
            trend: null,
            trendTooltip: null,
          },
          income: {
            label: t('dashboard.income'),
            value: formatCurrency(0),
            trendLabel: null,
            trendVariant: 'neutral',
            trend: null,
            trendTooltip: null,
          },
          expense: {
            label: t('dashboard.expenses'),
            value: formatCurrency(0),
            trendLabel: null,
            trendVariant: 'neutral',
            trend: null,
            trendTooltip: null,
          },
        };
      }

      const { currentMonth, trends } = dashboardData.summary;

      const incomeTrend = buildTrendInfo(trends?.income, 'standard');
      const expenseTrend = buildTrendInfo(trends?.expense, 'expense');
      const balanceTrend = buildTrendInfo(
        trends?.balance,
        currentMonth?.balance >= 0 ? 'standard' : 'expense'
      );

      const getTrendText = trendInfo =>
        trendInfo.showTrend ? i18n.t('dashboard.vsLastMonth') : null;

      // Actual data direction (not inverted for expenses)
      const getDataTrend = percent => {
        if (percent === null || percent === undefined || percent === 0) return 'neutral';
        return percent > 0 ? 'up' : 'down';
      };

      // Sparkline data from monthly trend (last N months)
      const balanceSparkline = trendData.length >= 2 ? trendData.map(d => d.balance) : null;
      const incomeSparkline = trendData.length >= 2 ? trendData.map(d => d.income) : null;
      const expenseSparkline = trendData.length >= 2 ? trendData.map(d => d.expense) : null;

      return {
        balance: {
          label: t('dashboard.balance'),
          value: formatCurrency(currentMonth?.balance || 0),
          trendLabel: balanceTrend.label,
          trendVariant: balanceTrend.variant,
          trend: getTrendText(balanceTrend),
          trendTooltip: balanceTrend.showTrend ? i18n.t('dashboard.balanceTrendTooltip') : null,
          sparkline: balanceSparkline,
          dataTrend: getDataTrend(trends?.balance),
        },
        income: {
          label: t('dashboard.income'),
          value: formatCurrency(currentMonth?.income || 0),
          trendLabel: incomeTrend.label,
          trendVariant: incomeTrend.variant,
          trend: getTrendText(incomeTrend),
          trendTooltip: incomeTrend.showTrend ? i18n.t('dashboard.incomeTrendTooltip') : null,
          sparkline: incomeSparkline,
          dataTrend: getDataTrend(trends?.income),
        },
        expense: {
          label: t('dashboard.expenses'),
          value: formatCurrency(currentMonth?.expense || 0),
          trendLabel: expenseTrend.label,
          trendVariant: expenseTrend.variant,
          trend: getTrendText(expenseTrend),
          trendTooltip: expenseTrend.showTrend ? i18n.t('dashboard.expenseTrendTooltip') : null,
          sparkline: expenseSparkline,
          dataTrend: getDataTrend(trends?.expense),
        },
      };
    } catch (err) {
      console.error('Error calculating summary data', err);
      return {
        balance: {
          label: t('dashboard.balance'),
          value: formatCurrency(0),
          trendLabel: null,
          trendVariant: 'neutral',
          trend: null,
          trendTooltip: null,
        },
        income: {
          label: t('dashboard.income'),
          value: formatCurrency(0),
          trendLabel: null,
          trendVariant: 'neutral',
          trend: null,
          trendTooltip: null,
        },
        expense: {
          label: t('dashboard.expenses'),
          value: formatCurrency(0),
          trendLabel: null,
          trendVariant: 'neutral',
          trend: null,
          trendTooltip: null,
        },
      };
    }
  }, [dashboardData, t, trendData]);

  // ──────────────────────────────────────────────────────────────────────
  // LOADING STATE — Aurora Skeleton
  // ──────────────────────────────────────────────────────────────────────
  if (dashboardLoading) {
    return (
      <div className={styles.auroraLayout} aria-busy="true" aria-label={t('common.loading')}>
        <AuroraCanvas />

        {/* Header Skeleton */}
        <section className={styles.headerSection}>
          <div className={styles.greeting}>
            <Skeleton width="280px" height="32px" borderRadius="var(--r-md)" />
            <Skeleton width="180px" height="18px" borderRadius="var(--r-sm)" />
          </div>
          <Skeleton width="160px" height="40px" borderRadius="var(--r-lg)" />
        </section>

        {/* Hero Skeleton */}
        <HeroMetricPanel summaryData={summaryData} isLoading />

        {/* Panel Row Skeleton */}
        <div className={styles.skeletonGrid}>
          <GlassPanel variant="standard">
            <Skeleton width="100%" height="200px" borderRadius="var(--r-lg)" />
          </GlassPanel>
          <GlassPanel variant="standard">
            <Skeleton width="100%" height="200px" borderRadius="var(--r-lg)" />
          </GlassPanel>
        </div>

        {/* Second Row Skeleton */}
        <div className={styles.skeletonGrid}>
          <GlassPanel variant="standard">
            <Skeleton width="100%" height="240px" borderRadius="var(--r-lg)" />
          </GlassPanel>
          <GlassPanel variant="standard">
            <Skeleton
              count={4}
              width="100%"
              height="56px"
              gap="var(--space-sm)"
              borderRadius="var(--r-lg)"
            />
          </GlassPanel>
        </div>
      </div>
    );
  }

  if (!dashboardData && error) {
    return (
      <div className={styles.loadingContainer}>
        <p>{t('dashboard.errors.load')}</p>
        <Button
          variant="secondary"
          onClick={() => {
            fetchDashboardData();
            fetchTransactions();
          }}
        >
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // RENDER — Aurora Flow Layout
  // ──────────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className={styles.auroraLayout}
      variants={staggerContainer}
      initial={shouldAnimate ? 'hidden' : false}
      animate={shouldAnimate ? 'visible' : false}
    >
      <AuroraCanvas />

      {/* Header */}
      <motion.section className={styles.headerSection} variants={fadeUp}>
        <div className={styles.greeting}>
          <h1 className={styles.greetingTitle}>
            <span className={styles.greetingIcon} aria-hidden="true">
              {createElement(getTimeIcon(getTimeOfDay()))}
            </span>
            <span className={styles.greetingIntro}>
              {t(`dashboard.greeting.${getTimeOfDay()}`)}
            </span>
            {user?.name && <span className={styles.greetingName}>{user.name.split(' ')[0]}</span>}
          </h1>
          <p>{t('dashboard.overview')}</p>
        </div>

        <div className={styles.headerActions}>
          <DashboardFilter
            selectedMonth={dashboardMonth}
            selectedYear={dashboardYear}
            onMonthChange={setDashboardMonth}
            startDate={filter.startDate}
            endDate={filter.endDate}
            onReset={() => {
              const now = new Date();
              setDashboardMonth(now.getMonth() + 1, now.getFullYear());
            }}
          />
          <Button
            variant="primary"
            size="small"
            icon={<FiPlus />}
            onClick={() => navigate('/transactions')}
          >
            {t('dashboard.newTransaction')}
          </Button>
        </div>
      </motion.section>

      {/* Hero KPIs: Balance | Income | Expense */}
      <motion.div variants={fadeUp}>
        <HeroMetricPanel summaryData={summaryData} isLoading={dashboardLoading} />
      </motion.div>

      {/* Row 1: Savings Ring + Trend Chart */}
      <motion.div className={styles.panelRow} variants={fadeUp}>
        <ErrorBoundary>
          <OrbitalSavingsRing />
        </ErrorBoundary>
        <ErrorBoundary>
          <FlowAreaChart />
        </ErrorBoundary>
      </motion.div>

      {/* Row 2: Category Breakdown + Recent Transactions */}
      <motion.div className={styles.panelRow} variants={fadeUp}>
        <ErrorBoundary>
          <GlassCategoryList />
        </ErrorBoundary>
        <ErrorBoundary>
          <FlowTransactionList />
        </ErrorBoundary>
      </motion.div>

      {/* Row 3: Budget | Quota | Retention (nur authentifiziert) */}
      {isAuthenticated && (
        <motion.div variants={fadeUp}>
          <CompactWidgetRow
            quota={quota}
            lifecycleStatus={lifecycleStatus}
            lifecycleLoading={lifecycleLoading}
            confirmExport={confirmExport}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
