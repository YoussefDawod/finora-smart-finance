/**
 * @fileoverview Admin Dashboard Page
 * @description Übersichtsseite des Admin-Bereichs mit Statistik-Cards,
 *              Charts und Recent-Users-Widget.
 *
 * Datenabruf: useAdminDashboard (3 parallele API-Calls)
 * Visualisierung: AdminStatCard · AdminCharts · AdminRecentUsers
 *
 * @module pages/admin/AdminDashboardPage
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiUsers,
  FiCheckCircle,
  FiSlash,
  FiShield,
  FiCreditCard,
  FiTrendingUp,
  FiTrendingDown,
  FiMail,
  FiRefreshCw,
} from 'react-icons/fi';
import { useAdminDashboard } from '@/hooks';
import { AdminStatCard, AdminCharts, AdminRecentUsers } from '@/components/admin';
import { formatAdminCurrency } from '@/utils/adminTableHelpers';
import styles from './AdminDashboardPage.module.scss';

export default function AdminDashboardPage() {
  const { t, i18n } = useTranslation();
  const { stats, transactionStats, subscriberStats, loading, error, refresh } =
    useAdminDashboard();

  /**
   * Stat-Card Konfigurationen — aus API-Daten berechnet
   */
  const statCards = useMemo(() => {
    const o = stats?.overview || {};
    const tx = transactionStats || {};
    const sub = subscriberStats || {};

    return [
      {
        label: t('admin.dashboard.totalUsers'),
        value: o.totalUsers?.toLocaleString() ?? '—',
        icon: FiUsers,
        color: 'primary',
        trendLabel: o.usersLast7Days ? `+${o.usersLast7Days} ${t('admin.dashboard.thisWeek')}` : null,
        trendValue: o.usersLast7Days ?? null,
      },
      {
        label: t('admin.dashboard.verifiedUsers'),
        value: o.verifiedUsers?.toLocaleString() ?? '—',
        icon: FiCheckCircle,
        color: 'success',
        trendLabel: o.totalUsers
          ? `${Math.round(((o.verifiedUsers || 0) / o.totalUsers) * 100)}%`
          : null,
        trendValue: o.verifiedUsers > 0 ? 1 : 0,
      },
      {
        label: t('admin.dashboard.bannedUsers'),
        value: o.bannedUsers?.toLocaleString() ?? '0',
        icon: FiSlash,
        color: 'error',
        trendLabel: null,
        trendValue: null,
      },
      {
        label: t('admin.dashboard.adminUsers'),
        value: o.adminUsers?.toLocaleString() ?? '—',
        icon: FiShield,
        color: 'warning',
        trendLabel: null,
        trendValue: null,
      },
      {
        label: t('admin.dashboard.totalTransactions'),
        value: tx.totalCount?.toLocaleString() ?? o.totalTransactions?.toLocaleString() ?? '—',
        icon: FiCreditCard,
        color: 'info',
        trendLabel: tx.last7DaysCount ? `+${tx.last7DaysCount} ${t('admin.dashboard.thisWeek')}` : null,
        trendValue: tx.last7DaysCount ?? null,
      },
      {
        label: t('admin.dashboard.totalIncome'),
        value: tx.totalIncome != null ? formatAdminCurrency(tx.totalIncome, i18n.language) : '—',
        icon: FiTrendingUp,
        color: 'success',
        trendLabel: null,
        trendValue: null,
      },
      {
        label: t('admin.dashboard.totalExpenses'),
        value: tx.totalExpense != null ? formatAdminCurrency(tx.totalExpense, i18n.language) : '—',
        icon: FiTrendingDown,
        color: 'error',
        trendLabel: null,
        trendValue: null,
      },
      {
        label: t('admin.dashboard.subscribers'),
        value: sub.totalCount?.toLocaleString() ?? '—',
        icon: FiMail,
        color: 'primary',
        trendLabel: sub.confirmedCount != null
          ? `${sub.confirmedCount} ${t('admin.dashboard.confirmed')}`
          : null,
        trendValue: sub.confirmedCount > 0 ? 1 : 0,
      },
    ];
  }, [stats, transactionStats, subscriberStats, t, i18n.language]);

  // ── Error State ────────────────────────────────
  if (error && !loading) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <p className={styles.errorText}>{error}</p>
          <button className={styles.retryButton} onClick={refresh} type="button">
            <FiRefreshCw size={16} />
            {t('admin.dashboard.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ── Header ──────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin.dashboard.title')}</h1>
          <p className={styles.subtitle}>{t('admin.dashboard.subtitle')}</p>
        </div>
        <button
          className={styles.refreshButton}
          onClick={refresh}
          disabled={loading}
          type="button"
          aria-label={t('admin.dashboard.refresh')}
        >
          <FiRefreshCw size={16} className={loading ? styles.spinning : ''} />
          {t('admin.dashboard.refresh')}
        </button>
      </div>

      {/* ── Stats Grid ──────────────────────────── */}
      <section className={styles.statsGrid} aria-label={t('admin.dashboard.statsLabel')}>
        {statCards.map((card, idx) => (
          <AdminStatCard key={idx} {...card} isLoading={loading} />
        ))}
      </section>

      {/* ── Charts ──────────────────────────────── */}
      <section className={styles.section} aria-label={t('admin.dashboard.chartsLabel')}>
        <AdminCharts
          stats={stats}
          transactionStats={transactionStats}
          subscriberStats={subscriberStats}
          loading={loading}
        />
      </section>

      {/* ── Recent Users ────────────────────────── */}
      <section className={styles.section} aria-label={t('admin.dashboard.recentUsers')}>
        <AdminRecentUsers users={stats?.recentUsers} loading={loading} />
      </section>
    </div>
  );
}
