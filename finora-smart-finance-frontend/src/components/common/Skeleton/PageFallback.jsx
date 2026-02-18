/**
 * @fileoverview PageFallback - Suspense-Fallback für Lazy-Loaded Pages
 * @description Zeigt kontextbasierte Skeleton-Varianten während dem Laden
 *
 * @module components/common/Skeleton/PageFallback
 */

import { memo } from 'react';
import Skeleton from './Skeleton';
import SkeletonCard from './SkeletonCard';
import styles from './PageFallback.module.scss';

/**
 * Generischer Page-Fallback für Lazy-Loaded Content-Pages
 * (Terms, Privacy, Contact, Features, Pricing, About, Blog, Help, FAQ)
 */
const ContentPageFallback = memo(() => (
  <div className={styles.contentPage}>
    {/* Header */}
    <div className={styles.contentHeader}>
      <Skeleton width="260px" height="36px" variant="text" />
      <Skeleton width="400px" height="18px" variant="text" />
    </div>

    {/* Content blocks */}
    <div className={styles.contentBody}>
      <Skeleton count={4} width="100%" height="18px" gap="12px" variant="text" />
      <div className={styles.contentSpacer} />
      <Skeleton count={3} width="100%" height="18px" gap="12px" variant="text" />
      <div className={styles.contentSpacer} />
      <Skeleton width="80%" height="18px" variant="text" />
    </div>
  </div>
));

ContentPageFallback.displayName = 'ContentPageFallback';

/**
 * Dashboard-Fallback mit Summary-Cards und Chart-Platzhaltern
 */
const DashboardFallback = memo(() => (
  <div className={styles.dashboard}>
    {/* Summary Cards */}
    <div className={styles.summaryRow}>
      <SkeletonCard size="medium" />
      <SkeletonCard size="medium" />
      <SkeletonCard size="medium" />
    </div>

    {/* Chart area */}
    <div className={styles.chartArea}>
      <Skeleton width="100%" height="300px" variant="rect" borderRadius="var(--r-lg)" />
    </div>

    {/* Recent transactions */}
    <div className={styles.recentList}>
      <Skeleton width="180px" height="22px" variant="text" />
      <Skeleton count={5} width="100%" height="56px" gap="8px" variant="rect" borderRadius="var(--r-md)" />
    </div>
  </div>
));

DashboardFallback.displayName = 'DashboardFallback';

/**
 * Transactions-Fallback mit Filter-Bar und Tabellen-Rows
 */
const TransactionsFallback = memo(() => (
  <div className={styles.transactions}>
    {/* Filter/Search bar */}
    <div className={styles.filterBar}>
      <Skeleton width="240px" height="40px" variant="rect" borderRadius="var(--r-md)" />
      <Skeleton width="120px" height="40px" variant="rect" borderRadius="var(--r-md)" />
      <Skeleton width="120px" height="40px" variant="rect" borderRadius="var(--r-md)" />
    </div>

    {/* Table rows */}
    <div className={styles.tableRows}>
      <Skeleton count={8} width="100%" height="52px" gap="4px" variant="rect" borderRadius="var(--r-sm)" />
    </div>
  </div>
));

TransactionsFallback.displayName = 'TransactionsFallback';

/**
 * Settings/Profile-Fallback
 */
const SettingsFallback = memo(() => (
  <div className={styles.settings}>
    <Skeleton width="200px" height="28px" variant="text" />
    <div className={styles.settingsSections}>
      {[1, 2, 3].map((i) => (
        <div key={i} className={styles.settingsSection}>
          <Skeleton width="140px" height="20px" variant="text" />
          <Skeleton count={3} width="100%" height="44px" gap="8px" variant="rect" borderRadius="var(--r-md)" />
        </div>
      ))}
    </div>
  </div>
));

SettingsFallback.displayName = 'SettingsFallback';

/**
 * Universeller PageFallback — wählt passende Variante per Prop
 * @param {'content'|'dashboard'|'transactions'|'settings'} [variant='content']
 */
const PageFallback = memo(({ variant = 'content' }) => {
  switch (variant) {
    case 'dashboard':
      return <DashboardFallback />;
    case 'transactions':
      return <TransactionsFallback />;
    case 'settings':
      return <SettingsFallback />;
    default:
      return <ContentPageFallback />;
  }
});

PageFallback.displayName = 'PageFallback';

export default PageFallback;
export { ContentPageFallback, DashboardFallback, TransactionsFallback, SettingsFallback };
