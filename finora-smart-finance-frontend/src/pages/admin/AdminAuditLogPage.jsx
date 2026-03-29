/**
 * @fileoverview Admin Audit Log Page
 * @description Audit-Log-Übersicht mit Monatbasierter Ansicht, erweiterter
 *              Filterung (Aktion, Land), Selektion, Löschen und Export (CSV/PDF).
 *
 * Komponente:  AdminAuditLogTable
 * Hook:        useAdminAuditLog
 *
 * @module pages/admin/AdminAuditLogPage
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiRefreshCw,
  FiFileText,
  FiActivity,
  FiUser,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiTrash2,
} from 'react-icons/fi';
import { useAdminAuditLog } from '@/hooks';
import { useViewerGuard } from '@/hooks/useViewerGuard';
import { AdminAuditLogTable, AdminStatCard } from '@/components/admin';
import FilterDropdown from '@/components/common/FilterDropdown/FilterDropdown';
import Modal from '@/components/common/Modal/Modal';
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
  'AUDIT_LOG_CLEARED',
  'AUDIT_LOG_ENTRIES_DELETED',
];

export default function AdminAuditLogPage() {
  const { t } = useTranslation();
  const { logs, stats, pagination, loading, isDeleting, error, filters, actions, selection } =
    useAdminAuditLog();
  const { guard } = useViewerGuard();

  // Bestätigungs-Modals
  const [showDeleteSelectedModal, setShowDeleteSelectedModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  // ── Delete Handlers ─────────────────────────────
  const handleConfirmDeleteSelected = async () => {
    await actions.deleteSelected();
    setShowDeleteSelectedModal(false);
  };

  const handleConfirmDeleteAll = async () => {
    await actions.deleteAll();
    setShowDeleteAllModal(false);
  };

  // ── Error State ─────────────────────────────────
  if (error && !loading && logs.length === 0) {
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

  return (
    <div className={styles.page}>
      {/* ── Header ──────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin.auditLog.title')}</h1>
          <p className={styles.subtitle}>
            {t('admin.auditLog.subtitle', { count: pagination.total })}
          </p>
          <p className={styles.retentionInfo}>{t('admin.auditLog.retentionInfo')}</p>
        </div>
        <div className={styles.headerActions}>
          {/* Export Buttons */}
          <button
            className={styles.exportButton}
            onClick={() => guard(actions.exportCSV)}
            disabled={loading || logs.length === 0}
            type="button"
            aria-label={t('admin.auditLog.exportCSV')}
          >
            <FiDownload size={14} />
            {t('admin.auditLog.exportCSV')}
          </button>
          <button
            className={styles.exportButton}
            onClick={() => guard(actions.exportPDF)}
            disabled={loading || logs.length === 0}
            type="button"
            aria-label={t('admin.auditLog.exportPDF')}
          >
            <FiFileText size={14} />
            {t('admin.auditLog.exportPDF')}
          </button>
          {/* Refresh */}
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
          value={
            stats?.mostCommonAction
              ? t(`admin.auditLog.actions_enum.${stats.mostCommonAction}`, stats.mostCommonAction)
              : '—'
          }
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

      {/* ── Toolbar ─────────────────────────────── */}
      <div className={styles.toolbar}>
        {/* Suche */}
        <div className={styles.searchWrapper}>
          <FiSearch className={styles.searchIcon} size={16} />
          <input
            id="audit-search"
            name="audit-search"
            className={styles.searchInput}
            type="text"
            placeholder={t('admin.auditLog.searchPlaceholder')}
            value={filters.search}
            onChange={e => filters.setSearch(e.target.value)}
            aria-label={t('admin.auditLog.searchPlaceholder')}
          />
        </div>

        {/* Monatsnavigation */}
        <div className={styles.monthFilter}>
          <button
            className={styles.monthArrow}
            onClick={actions.goToPrevMonth}
            type="button"
            aria-label={t('admin.auditLog.prevMonth')}
          >
            <FiChevronLeft size={16} />
          </button>
          <input
            id="audit-month"
            name="audit-month"
            type="month"
            className={styles.monthInput}
            value={filters.selectedMonth}
            onChange={e => filters.setSelectedMonth(e.target.value)}
            aria-label={t('admin.auditLog.selectMonth')}
          />
          <button
            className={styles.monthArrow}
            onClick={actions.goToNextMonth}
            type="button"
            aria-label={t('admin.auditLog.nextMonth')}
          >
            <FiChevronRight size={16} />
          </button>
        </div>

        {/* Filter-Gruppe */}
        <div className={styles.filterGroup}>
          <FilterDropdown
            value={filters.actionFilter}
            onChange={filters.setActionFilter}
            ariaLabel={t('admin.auditLog.filterAction')}
            placeholder={t('admin.auditLog.allActions')}
            options={[
              { value: '', label: t('admin.auditLog.allActions') },
              ...AUDIT_ACTIONS.map(action => ({
                value: action,
                label: t(`admin.auditLog.actions_enum.${action}`, action),
              })),
            ]}
          />
          <FilterDropdown
            value={filters.countryFilter}
            onChange={filters.setCountryFilter}
            ariaLabel={t('admin.auditLog.filterCountry')}
            placeholder={t('admin.auditLog.allCountries')}
            options={[{ value: '', label: t('admin.auditLog.allCountries') }]}
          />
        </div>
      </div>

      {/* ── Bulk Action Bar ─────────────────────── */}
      {selection.selectedIds.size > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkInfo}>
            {t('admin.auditLog.selectedCount', { count: selection.selectedIds.size })}
          </span>
          <div className={styles.bulkActions}>
            <button
              className={styles.bulkClearButton}
              onClick={selection.handleClearSelection}
              type="button"
            >
              {t('admin.auditLog.deselectAll')}
            </button>
            <button
              className={styles.bulkDeleteButton}
              onClick={() => guard(() => setShowDeleteSelectedModal(true))}
              disabled={isDeleting}
              type="button"
            >
              <FiTrash2 size={14} />
              {t('admin.auditLog.deleteSelected')}
            </button>
          </div>
        </div>
      )}

      {/* ── Delete All Button ───────────────────── */}
      {logs.length > 0 && selection.selectedIds.size === 0 && (
        <div className={styles.deleteAllWrapper}>
          <button
            className={styles.deleteAllButton}
            onClick={() => guard(() => setShowDeleteAllModal(true))}
            disabled={isDeleting}
            type="button"
          >
            <FiTrash2 size={14} />
            {t('admin.auditLog.deleteAll')}
          </button>
        </div>
      )}

      {/* ── Table ───────────────────────────────── */}
      <AdminAuditLogTable
        logs={logs}
        pagination={pagination}
        loading={loading}
        sort={filters.sort}
        onSortChange={filters.setSort}
        onPageChange={filters.setPage}
        selectedIds={selection.selectedIds}
        onSelectId={selection.handleSelectId}
        onSelectAll={selection.handleSelectAll}
      />

      {/* ── Delete Selected Modal ───────────────── */}
      <Modal
        isOpen={showDeleteSelectedModal}
        onClose={() => setShowDeleteSelectedModal(false)}
        title={t('admin.auditLog.deleteConfirmTitle')}
        size="small"
        footer={
          <div className={styles.modalFooter}>
            <button
              className={styles.modalCancelButton}
              onClick={() => setShowDeleteSelectedModal(false)}
              type="button"
            >
              {t('common.cancel')}
            </button>
            <button
              className={styles.modalDeleteButton}
              onClick={handleConfirmDeleteSelected}
              disabled={isDeleting}
              type="button"
            >
              <FiTrash2 size={14} />
              {isDeleting ? t('common.loading') : t('admin.auditLog.deleteSelected')}
            </button>
          </div>
        }
      >
        <p>{t('admin.auditLog.deleteConfirmSelected', { count: selection.selectedIds.size })}</p>
      </Modal>

      {/* ── Delete All Modal ────────────────────── */}
      <Modal
        isOpen={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        title={t('admin.auditLog.deleteConfirmTitle')}
        size="small"
        footer={
          <div className={styles.modalFooter}>
            <button
              className={styles.modalCancelButton}
              onClick={() => setShowDeleteAllModal(false)}
              type="button"
            >
              {t('common.cancel')}
            </button>
            <button
              className={styles.modalDeleteButton}
              onClick={handleConfirmDeleteAll}
              disabled={isDeleting}
              type="button"
            >
              <FiTrash2 size={14} />
              {isDeleting ? t('common.loading') : t('admin.auditLog.deleteAll')}
            </button>
          </div>
        }
      >
        <p>{t('admin.auditLog.deleteConfirmAll')}</p>
      </Modal>
    </div>
  );
}
