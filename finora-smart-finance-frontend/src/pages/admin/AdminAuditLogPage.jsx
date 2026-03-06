/**
 * @fileoverview Admin Audit Log Page
 * @description Audit-Log-Übersicht mit Filterfunktion (Aktion, Zeitraum),
 *              sortierbarer Tabelle und Pagination – ausschließlich read-only.
 *
 * Komponente:  AdminAuditLogTable
 * Hook:        useAdminAuditLog (Laden, Filter, Sortierung)
 *
 * @module pages/admin/AdminAuditLogPage
 */

import { useTranslation } from 'react-i18next';
import {
  FiRefreshCw,
  FiFileText,
  FiActivity,
  FiUser,
  FiSearch,
} from 'react-icons/fi';
import { useAdminAuditLog } from '@/hooks';
import { AdminAuditLogTable, AdminStatCard } from '@/components/admin';
import FilterDropdown from '@/components/common/FilterDropdown/FilterDropdown';
import DateInput from '@/components/common/DateInput/DateInput';
import styles from './AdminAuditLogPage.module.scss';

const AUDIT_ACTIONS = [
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DELETED',
  'USER_BANNED',
  'USER_UNBANNED',
  'USER_ROLE_CHANGED',
  'USER_PASSWORD_RESET',
  'ALL_USERS_DELETED',
  'TRANSACTION_DELETED',
  'SUBSCRIBER_DELETED',
  'ADMIN_LOGIN',
  'SETTINGS_CHANGED',
  'DATA_EXPORT',
  'TRANSACTION_QUOTA_REACHED',
  'RETENTION_REMINDER_SENT',
  'RETENTION_FINAL_WARNING_SENT',
  'TRANSACTIONS_AUTO_DELETED',
  'USER_EXPORT_CONFIRMED',
  'RETENTION_RESET_BY_ADMIN',
  'RETENTION_MANUAL_TRIGGER',
  'RETENTION_SCHEDULED_RUN',
  'USER_LOGIN',
  'USER_LOGIN_FAILED',
  'USER_REGISTERED',
  'USER_ACCOUNT_LOCKED',
  'PASSWORD_CHANGED',
  'PASSWORD_RESET_REQUESTED',
  'PASSWORD_RESET_COMPLETED',
  'EMAIL_CHANGED',
];

export default function AdminAuditLogPage() {
  const { t } = useTranslation();
  const { logs, stats, pagination, loading, error, filters, actions } = useAdminAuditLog();

  // ── Error State ─────────────────────────────────
  if (error && !loading && logs.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <p className={styles.errorText}>{error}</p>
          <button
            className={styles.retryButton}
            onClick={actions.refresh}
            type="button"
          >
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
          <h1 className={styles.title}>{t('admin.auditLog.title')}</h1>
          <p className={styles.subtitle}>
            {t('admin.auditLog.subtitle', { count: pagination.total })}
          </p>
        </div>
        <button
          className={styles.refreshButton}
          onClick={actions.refresh}
          disabled={loading}
          type="button"
          aria-label={t('admin.auditLog.refresh')}
        >
          <FiRefreshCw size={16} className={loading ? styles.spinning : ''} />
          {t('admin.auditLog.refresh')}
        </button>
      </div>

      {/* ── Stats Grid ──────────────────────────── */}
      <section className={styles.statsGrid} aria-label={t('admin.auditLog.statsLabel')}>
        <AdminStatCard
          label={t('admin.auditLog.statTotal')}
          value={stats?.totalEntries?.toLocaleString() ?? '—'}
          icon={FiFileText}
          color="primary"
          isLoading={loading && !stats}
        />
        <AdminStatCard
          label={t('admin.auditLog.statMostCommon')}
          value={stats?.mostCommonAction
            ? t(`admin.auditLog.actions_enum.${stats.mostCommonAction}`, stats.mostCommonAction)
            : '—'}
          icon={FiActivity}
          color="info"
          isLoading={loading && !stats}
        />
        <AdminStatCard
          label={t('admin.auditLog.statActiveAdmins')}
          value={stats?.activeAdmins?.toLocaleString() ?? '—'}
          icon={FiUser}
          color="warning"
          isLoading={loading && !stats}
        />
      </section>

      {/* ── Filters ─────────────────────────────── */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <FiSearch className={styles.searchIcon} size={16} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder={t('admin.auditLog.searchPlaceholder')}
            value={filters.search}
            onChange={(e) => filters.setSearch(e.target.value)}
            aria-label={t('admin.auditLog.searchPlaceholder')}
          />
        </div>

        <div className={styles.filterGroup}>
          <FilterDropdown
            value={filters.actionFilter}
            onChange={filters.setActionFilter}
            ariaLabel={t('admin.auditLog.filterAction')}
            placeholder={t('admin.auditLog.allActions')}
            options={[
              { value: '', label: t('admin.auditLog.allActions') },
              ...AUDIT_ACTIONS.map((action) => ({
                value: action,
                label: t(`admin.auditLog.actions_enum.${action}`, action),
              })),
            ]}
          />
        </div>

        <div className={styles.dateRange}>
          <DateInput
            label={t('admin.auditLog.startDate')}
            value={filters.startDate}
            onChange={filters.setStartDate}
            ariaLabel={t('admin.auditLog.startDate')}
          />
          <DateInput
            label={t('admin.auditLog.endDate')}
            value={filters.endDate}
            onChange={filters.setEndDate}
            ariaLabel={t('admin.auditLog.endDate')}
          />
        </div>
      </div>

      {/* ── Table ───────────────────────────────── */}
      <AdminAuditLogTable
        logs={logs}
        pagination={pagination}
        loading={loading}
        sort={filters.sort}
        onSortChange={filters.setSort}
        onPageChange={filters.setPage}
      />
    </div>
  );
}
