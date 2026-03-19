/**
 * @fileoverview Admin Lifecycle Page
 * @description Lifecycle-Verwaltung: Config-Bar, Phasen-Timeline, Statistik-Cards,
 *              Tabbed User-Listen mit Suche, Trigger-Feedback,
 *              User-Detail-Panel mit Retention-Timestamps, Quota und Reset.
 *
 * Hook: useAdminLifecycle (Stats, Detail, Reset, Trigger, TriggerResult)
 *
 * @module pages/admin/AdminLifecyclePage
 */

import { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiRefreshCw,
  FiClock,
  FiAlertTriangle,
  FiDownload,
  FiTrash2,
  FiDatabase,
  FiTrendingUp,
  FiZap,
  FiPlay,
  FiX,
  FiRotateCcw,
  FiUser,
  FiSearch,
  FiSettings,
  FiArrowRight,
  FiCheckCircle,
  FiInfo,
  FiChevronDown,
} from 'react-icons/fi';
import { useAdminLifecycle } from '@/hooks';
import { AdminStatCard } from '@/components/admin';
import SensitiveData from '@/components/ui/SensitiveData/SensitiveData';
import { useAuth } from '@/hooks/useAuth';
import { useViewerGuard } from '@/hooks/useViewerGuard';
import styles from './AdminLifecyclePage.module.scss';

/** Tab-Konfiguration */
const TABS = ['critical', 'reminding', 'exported', 'quota'];

export default function AdminLifecyclePage() {
  const { t, i18n } = useTranslation();
  const { stats, userDetail, triggerResult, loading, actionLoading, error, actions } =
    useAdminLifecycle();
  const { isViewer } = useAuth();
  const { guard } = useViewerGuard();
  const [confirmAction, setConfirmAction] = useState(null);
  const [activeTab, setActiveTab] = useState('critical');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Tab-Metadaten ───────────────────────────
  const tabConfig = useMemo(
    () => ({
      critical: {
        label: t('lifecycle.admin.tabCritical'),
        icon: FiAlertTriangle,
        users: stats?.usersInFinalWarningPhase || [],
        emptyText: t('lifecycle.admin.noCriticalUsers'),
      },
      reminding: {
        label: t('lifecycle.admin.tabReminding'),
        icon: FiClock,
        users: stats?.usersInRemindingPhase || [],
        emptyText: t('lifecycle.admin.noRemindingUsers'),
      },
      exported: {
        label: t('lifecycle.admin.tabExported'),
        icon: FiDownload,
        users: stats?.usersWithExport || [],
        emptyText: t('lifecycle.admin.noExportedUsers'),
      },
      quota: {
        label: t('lifecycle.admin.tabQuota'),
        icon: FiTrendingUp,
        users: stats?.usersApproachingQuota || [],
        emptyText: t('lifecycle.admin.noQuotaUsers'),
      },
    }),
    [stats, t]
  );

  // ── Gefilterte User ─────────────────────────
  const filteredUsers = useMemo(() => {
    const users = tabConfig[activeTab]?.users || [];
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }, [tabConfig, activeTab, searchQuery]);

  /**
   * Stat-Card Konfiguration — aus Lifecycle-Stats berechnet
   */
  const statCards = useMemo(() => {
    const s = stats || {};

    return [
      {
        label: t('lifecycle.admin.totalOldTransactions'),
        value: (s.usersWithOldTransactions ?? 0).toLocaleString(),
        icon: FiDatabase,
        color: 'info',
      },
      {
        label: t('lifecycle.admin.usersInReminding'),
        value: (s.usersInReminding ?? 0).toLocaleString(),
        icon: FiClock,
        color: 'warning',
      },
      {
        label: t('lifecycle.admin.usersInFinalWarning'),
        value: (s.usersInFinalWarning ?? 0).toLocaleString(),
        icon: FiAlertTriangle,
        color: 'error',
      },
      {
        label: t('lifecycle.admin.usersExported'),
        value: (s.usersExported ?? 0).toLocaleString(),
        icon: FiDownload,
        color: 'success',
      },
      {
        label: t('lifecycle.admin.deletionsThisMonth'),
        value: (s.deletionsThisMonth ?? 0).toLocaleString(),
        icon: FiTrash2,
        color: 'error',
      },
      {
        label: t('lifecycle.admin.usersApproachingLimit'),
        value: (s.usersApproachingLimit ?? 0).toLocaleString(),
        icon: FiTrendingUp,
        color: 'warning',
      },
      {
        label: t('lifecycle.admin.usersAtLimit'),
        value: (s.usersAtLimit ?? 0).toLocaleString(),
        icon: FiZap,
        color: 'error',
      },
    ];
  }, [stats, t]);

  // ── Trigger-Handler ─────────────────────────────
  const handleTrigger = useCallback(async () => {
    if (confirmAction !== 'trigger') {
      setConfirmAction('trigger');
      return;
    }
    try {
      await actions.triggerProcessing();
      setConfirmAction(null);
    } catch {
      setConfirmAction(null);
    }
  }, [confirmAction, actions]);

  // ── Reset-Handler ───────────────────────────────
  const handleReset = useCallback(
    async userId => {
      if (confirmAction !== `reset-${userId}`) {
        setConfirmAction(`reset-${userId}`);
        return;
      }
      try {
        await actions.resetRetention(userId);
        setConfirmAction(null);
      } catch {
        setConfirmAction(null);
      }
    },
    [confirmAction, actions]
  );

  const formatDate = useCallback(
    dateStr => {
      if (!dateStr) return '—';
      return new Date(dateStr).toLocaleDateString(i18n.language, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    },
    [i18n.language]
  );

  /** Rendert die Badge/Info für einen User basierend auf dem aktiven Tab */
  const renderUserBadge = useCallback(
    user => {
      switch (activeTab) {
        case 'critical':
          return (
            <span className={styles.dateBadge}>
              {t('lifecycle.admin.finalWarningSentAt')}: {formatDate(user.finalWarningSentAt)}
            </span>
          );
        case 'reminding':
          return (
            <span className={styles.dateBadge}>
              {t('lifecycle.admin.reminderStartedAt')}: {formatDate(user.reminderStartedAt)}
              {' · '}
              {t('lifecycle.admin.reminderCount', { count: user.reminderCount || 0 })}
            </span>
          );
        case 'exported':
          return (
            <span className={`${styles.dateBadge} ${styles.successBadge}`}>
              {t('lifecycle.admin.exportConfirmedAt')}: {formatDate(user.exportConfirmedAt)}
            </span>
          );
        case 'quota':
          return (
            <span className={styles.quotaBadge}>
              {t('lifecycle.admin.monthlyCount', { count: user.monthlyTransactionCount })}
            </span>
          );
        default:
          return null;
      }
    },
    [activeTab, formatDate, t]
  );

  // ── Error State ─────────────────────────────────
  if (error && !loading) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <p className={styles.errorText}>{error}</p>
          <button className={styles.retryButton} onClick={actions.refresh} type="button">
            <FiRefreshCw size={16} />
            {t('admin.dashboard.retry')}
          </button>
        </div>
      </div>
    );
  }

  const config = stats?.config;

  return (
    <div className={styles.page}>
      {/* ── Header ──────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('lifecycle.admin.title')}</h1>
          <p className={styles.subtitle}>{t('lifecycle.admin.subtitle')}</p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.triggerButton}
            onClick={() => guard(handleTrigger)}
            disabled={!!actionLoading}
            type="button"
          >
            <FiPlay size={14} />
            {confirmAction === 'trigger'
              ? t('lifecycle.admin.triggerConfirm')
              : t('lifecycle.admin.triggerProcessing')}
          </button>
          <button
            className={styles.refreshButton}
            onClick={actions.refresh}
            disabled={loading}
            type="button"
            aria-label={t('lifecycle.admin.refresh')}
          >
            <FiRefreshCw size={16} className={loading ? styles.spinning : ''} />
            {t('lifecycle.admin.refresh')}
          </button>
        </div>
      </div>

      {/* ── Config Bar (collapsible) ──────────── */}
      {config && (
        <details className={styles.configBar} open>
          <summary className={styles.configSummary}>
            <FiSettings size={16} />
            <span className={styles.configTitle}>{t('lifecycle.admin.configTitle')}</span>
            <FiChevronDown size={16} className={styles.chevron} />
          </summary>
          <div className={styles.configGrid}>
            <div className={styles.configItem}>
              <span className={styles.configValue}>{config.retentionMonths}</span>
              <span className={styles.configLabel}>{t('lifecycle.admin.configRetention')}</span>
            </div>
            <div className={styles.configItem}>
              <span className={styles.configValue}>{config.gracePeriodMonths}</span>
              <span className={styles.configLabel}>{t('lifecycle.admin.configGracePeriod')}</span>
            </div>
            <div className={styles.configItem}>
              <span className={styles.configValue}>{config.finalWarningDays}</span>
              <span className={styles.configLabel}>{t('lifecycle.admin.configFinalWarning')}</span>
            </div>
            <div className={styles.configItem}>
              <span className={styles.configValue}>{config.reminderCooldownDays}</span>
              <span className={styles.configLabel}>{t('lifecycle.admin.configCooldown')}</span>
            </div>
            <div className={styles.configItem}>
              <span className={styles.configValue}>{config.quotaLimit}</span>
              <span className={styles.configLabel}>{t('lifecycle.admin.configQuota')}</span>
            </div>
          </div>
        </details>
      )}

      {/* ── Lifecycle Timeline (collapsible) ──── */}
      <details className={styles.timelineWrapper} open>
        <summary className={styles.timelineSummary}>
          <FiArrowRight size={16} />
          <span>{t('lifecycle.admin.timelineTitle')}</span>
          <FiChevronDown size={16} className={styles.chevron} />
        </summary>
        <div className={styles.timeline}>
          <div className={styles.timelinePhase}>
            <span className={`${styles.timelineDot} ${styles.dotActive}`} />
            <span className={styles.timelineLabel}>{t('lifecycle.admin.phaseActive')}</span>
          </div>
          <div className={styles.timelineConnector}>
            <span className={styles.timelineDuration}>
              {config ? `${config.retentionMonths} ${t('lifecycle.admin.months')}` : '—'}
            </span>
            <FiArrowRight size={14} />
          </div>
          <div className={styles.timelinePhase}>
            <span className={`${styles.timelineDot} ${styles.dotReminding}`} />
            <span className={styles.timelineLabel}>{t('lifecycle.admin.phaseReminding')}</span>
          </div>
          <div className={styles.timelineConnector}>
            <span className={styles.timelineDuration}>
              {config ? `${config.gracePeriodMonths} ${t('lifecycle.admin.months')}` : '—'}
            </span>
            <FiArrowRight size={14} />
          </div>
          <div className={styles.timelinePhase}>
            <span className={`${styles.timelineDot} ${styles.dotFinalWarning}`} />
            <span className={styles.timelineLabel}>{t('lifecycle.admin.phaseFinalWarning')}</span>
          </div>
          <div className={styles.timelineConnector}>
            <span className={styles.timelineDuration}>
              {config ? `${config.finalWarningDays} ${t('lifecycle.admin.days')}` : '—'}
            </span>
            <FiArrowRight size={14} />
          </div>
          <div className={styles.timelinePhase}>
            <span className={`${styles.timelineDot} ${styles.dotDeletion}`} />
            <span className={styles.timelineLabel}>{t('lifecycle.admin.phaseDeletion')}</span>
          </div>
        </div>
      </details>

      {/* ── Stats Grid ──────────────────────────── */}
      <section className={styles.statsGrid} aria-label={t('lifecycle.admin.statsLabel')}>
        {statCards.map((card, idx) => (
          <AdminStatCard key={idx} {...card} isLoading={loading} />
        ))}
      </section>

      {/* ── Trigger Result ──────────────────────── */}
      {triggerResult && (
        <section className={styles.triggerResult} aria-label={t('lifecycle.admin.triggerResult')}>
          <div className={styles.triggerResultHeader}>
            <FiCheckCircle size={16} />
            <h3 className={styles.triggerResultTitle}>{t('lifecycle.admin.triggerResult')}</h3>
            <button
              className={styles.dismissButton}
              onClick={actions.dismissTriggerResult}
              type="button"
              aria-label={t('lifecycle.admin.close')}
            >
              <FiX size={14} />
            </button>
          </div>
          <div className={styles.triggerResultGrid}>
            <div className={styles.triggerResultItem}>
              <span className={styles.triggerResultValue}>{triggerResult.processed ?? 0}</span>
              <span className={styles.triggerResultLabel}>
                {t('lifecycle.admin.resultProcessed')}
              </span>
            </div>
            <div className={styles.triggerResultItem}>
              <span className={styles.triggerResultValue}>{triggerResult.reminders ?? 0}</span>
              <span className={styles.triggerResultLabel}>
                {t('lifecycle.admin.resultReminders')}
              </span>
            </div>
            <div className={styles.triggerResultItem}>
              <span className={styles.triggerResultValue}>{triggerResult.finalWarnings ?? 0}</span>
              <span className={styles.triggerResultLabel}>
                {t('lifecycle.admin.resultFinalWarnings')}
              </span>
            </div>
            <div className={styles.triggerResultItem}>
              <span className={styles.triggerResultValue}>{triggerResult.deletions ?? 0}</span>
              <span className={styles.triggerResultLabel}>
                {t('lifecycle.admin.resultDeletions')}
              </span>
            </div>
            <div className={styles.triggerResultItem}>
              <span className={styles.triggerResultValue}>{triggerResult.errors ?? 0}</span>
              <span className={styles.triggerResultLabel}>{t('lifecycle.admin.resultErrors')}</span>
            </div>
            <div className={styles.triggerResultItem}>
              <span className={styles.triggerResultValue}>{triggerResult.skipped ?? 0}</span>
              <span className={styles.triggerResultLabel}>
                {t('lifecycle.admin.resultSkipped')}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ── Tabbed User Lists ───────────────────── */}
      <section className={styles.section} aria-label={t('lifecycle.admin.criticalLabel')}>
        {/* Tabs */}
        <div className={styles.tabs} role="tablist">
          {TABS.map(tab => {
            const TabIcon = tabConfig[tab]?.icon;
            return (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                onClick={() => {
                  setActiveTab(tab);
                  setSearchQuery('');
                }}
                type="button"
              >
                {TabIcon && <TabIcon size={14} />}
                {tabConfig[tab]?.label}
                <span className={styles.tabCount}>{tabConfig[tab]?.users.length ?? 0}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className={styles.searchBar}>
          <FiSearch size={14} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder={t('lifecycle.admin.searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className={styles.clearSearch}
              onClick={() => setSearchQuery('')}
              type="button"
              aria-label={t('lifecycle.admin.close')}
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        {/* User List */}
        <div className={styles.userList} role="tabpanel">
          {!loading && filteredUsers.length > 0 ? (
            filteredUsers.map(user => {
              const TabIcon = tabConfig[activeTab]?.icon;
              return (
                <div key={user._id} className={styles.userCard}>
                  <div className={styles.userInfo}>
                    {TabIcon && (
                      <TabIcon
                        size={16}
                        className={
                          activeTab === 'critical' ? styles.criticalIcon : styles.warningIcon
                        }
                      />
                    )}
                    <div>
                      <span className={styles.userName}>
                        <SensitiveData active={isViewer}>{user.name}</SensitiveData>
                      </span>
                      {user.email && (
                        <span className={styles.userEmail}>
                          <SensitiveData active={isViewer}>{user.email}</SensitiveData>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.userActions}>
                    {renderUserBadge(user)}
                    <button
                      className={styles.detailButton}
                      onClick={() => actions.fetchUserDetail(user._id)}
                      disabled={!!actionLoading}
                      type="button"
                    >
                      <FiUser size={14} />
                      {t('lifecycle.admin.viewDetail')}
                    </button>
                  </div>
                </div>
              );
            })
          ) : !loading ? (
            <p className={styles.emptyText}>
              {searchQuery ? t('lifecycle.admin.noSearchResults') : tabConfig[activeTab]?.emptyText}
            </p>
          ) : (
            <div className={styles.loadingPlaceholder} />
          )}
        </div>
      </section>

      {/* ── User Detail Panel ───────────────────── */}
      {userDetail && (
        <div className={styles.detailOverlay} onClick={actions.closeDetail} role="presentation">
          <div
            className={styles.detailPanel}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-label={t('lifecycle.admin.userDetail')}
          >
            <div className={styles.detailHeader}>
              <h3 className={styles.detailTitle}>{t('lifecycle.admin.userDetail')}</h3>
              <button
                className={styles.closeButton}
                onClick={actions.closeDetail}
                type="button"
                aria-label={t('lifecycle.admin.close')}
              >
                <FiX size={18} />
              </button>
            </div>

            <div className={styles.detailContent}>
              {/* User Info */}
              <div className={styles.detailSection}>
                <h4 className={styles.detailSectionTitle}>
                  <FiUser size={14} />{' '}
                  <SensitiveData active={isViewer}>{userDetail.user?.name}</SensitiveData>
                </h4>
                <p className={styles.detailEmail}>
                  <SensitiveData active={isViewer}>{userDetail.user?.email}</SensitiveData>
                </p>
              </div>

              {/* Retention Phase */}
              <div className={styles.detailSection}>
                <h4 className={styles.detailSectionTitle}>{t('lifecycle.admin.retentionPhase')}</h4>
                <span
                  className={`${styles.phaseBadge} ${styles[`phase-${userDetail.lifecycle?.retention?.phase || 'active'}`]}`}
                >
                  {t(
                    `lifecycle.retention.phase.${userDetail.lifecycle?.retention?.phase || 'active'}`
                  )}
                </span>
              </div>

              {/* Retention Timestamps */}
              <div className={styles.detailSection}>
                <h4 className={styles.detailSectionTitle}>
                  <FiInfo size={14} /> {t('lifecycle.admin.retentionTimestamps')}
                </h4>
                <div className={styles.timestampList}>
                  {userDetail.lifecycle?.retention?.reminderStartedAt && (
                    <div className={styles.timestampItem}>
                      <span className={styles.timestampLabel}>
                        {t('lifecycle.admin.reminderStartedAt')}
                      </span>
                      <span className={styles.timestampValue}>
                        {formatDate(userDetail.lifecycle.retention.reminderStartedAt)}
                      </span>
                    </div>
                  )}
                  {userDetail.lifecycle?.retention?.reminderCount > 0 && (
                    <div className={styles.timestampItem}>
                      <span className={styles.timestampLabel}>
                        {t('lifecycle.admin.remindersLabel')}
                      </span>
                      <span className={styles.timestampValue}>
                        {userDetail.lifecycle.retention.reminderCount}
                      </span>
                    </div>
                  )}
                  {userDetail.lifecycle?.retention?.finalWarningSentAt && (
                    <div className={styles.timestampItem}>
                      <span className={styles.timestampLabel}>
                        {t('lifecycle.admin.finalWarningSentAt')}
                      </span>
                      <span className={styles.timestampValue}>
                        {formatDate(userDetail.lifecycle.retention.finalWarningSentAt)}
                      </span>
                    </div>
                  )}
                  {userDetail.lifecycle?.retention?.exportConfirmedAt && (
                    <div className={styles.timestampItem}>
                      <span className={styles.timestampLabel}>
                        {t('lifecycle.admin.exportConfirmedAt')}
                      </span>
                      <span className={styles.timestampValue}>
                        {formatDate(userDetail.lifecycle.retention.exportConfirmedAt)}
                      </span>
                    </div>
                  )}
                  {userDetail.lifecycle?.retention?.daysUntilDeletion != null && (
                    <div className={styles.timestampItem}>
                      <span className={styles.timestampLabel}>
                        {t('lifecycle.admin.daysUntilDeletion')}
                      </span>
                      <span className={`${styles.timestampValue} ${styles.breakdownDanger}`}>
                        {userDetail.lifecycle.retention.daysUntilDeletion}
                      </span>
                    </div>
                  )}
                  {!userDetail.lifecycle?.retention?.reminderStartedAt &&
                    !userDetail.lifecycle?.retention?.finalWarningSentAt &&
                    !userDetail.lifecycle?.retention?.exportConfirmedAt && (
                      <p className={styles.noTimestamps}>{t('lifecycle.admin.noTimestamps')}</p>
                    )}
                </div>
              </div>

              {/* Transaction Breakdown */}
              <div className={styles.detailSection}>
                <h4 className={styles.detailSectionTitle}>
                  {t('lifecycle.admin.transactionBreakdown')}
                </h4>
                <div className={styles.breakdownGrid}>
                  <div className={styles.breakdownItem}>
                    <span className={styles.breakdownLabel}>
                      {t('lifecycle.admin.totalTransactions')}
                    </span>
                    <span className={styles.breakdownValue}>
                      {userDetail.transactionBreakdown?.total ?? 0}
                    </span>
                  </div>
                  <div className={styles.breakdownItem}>
                    <span className={styles.breakdownLabel}>
                      {t('lifecycle.admin.oldTransactions')}
                    </span>
                    <span className={`${styles.breakdownValue} ${styles.breakdownDanger}`}>
                      {userDetail.transactionBreakdown?.olderThan12Months ?? 0}
                    </span>
                  </div>
                  <div className={styles.breakdownItem}>
                    <span className={styles.breakdownLabel}>
                      {t('lifecycle.admin.recentTransactions')}
                    </span>
                    <span className={styles.breakdownValue}>
                      {userDetail.transactionBreakdown?.within12Months ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quota */}
              <div className={styles.detailSection}>
                <h4 className={styles.detailSectionTitle}>{t('lifecycle.admin.quotaStatus')}</h4>
                <p className={styles.quotaText}>
                  {userDetail.quota?.used ?? 0} / {userDetail.quota?.limit ?? 150}
                </p>
                {userDetail.quota?.resetDate && (
                  <p className={styles.quotaResetDate}>
                    {t('lifecycle.admin.quotaResetDate', {
                      date: formatDate(userDetail.quota.resetDate),
                    })}
                  </p>
                )}
              </div>

              {/* Reset Action */}
              <div className={styles.detailActions}>
                <button
                  className={styles.resetButton}
                  onClick={() => guard(() => handleReset(userDetail.user?._id))}
                  disabled={!!actionLoading}
                  type="button"
                >
                  <FiRotateCcw size={14} />
                  {confirmAction === `reset-${userDetail.user?._id}`
                    ? t('lifecycle.admin.resetConfirm')
                    : t('lifecycle.admin.resetRetention')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
