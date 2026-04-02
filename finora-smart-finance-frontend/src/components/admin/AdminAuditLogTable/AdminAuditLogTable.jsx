/**
 * @fileoverview AdminAuditLogTable – Audit-Log-Tabelle für Admin-Panel
 * @description Sortierbare Tabelle mit Pagination, Selektion und
 *              farbcodierten Action-Badges.
 *
 * @module components/admin/AdminAuditLogTable
 */

import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiArrowUp,
  FiArrowDown,
  FiChevronLeft,
  FiChevronRight,
  FiFileText,
  FiUser,
  FiUserPlus,
  FiUserMinus,
  FiUserX,
  FiUserCheck,
  FiShield,
  FiKey,
  FiTrash2,
  FiLogIn,
  FiSettings,
  FiEdit,
  FiDollarSign,
  FiMail,
  FiDownload,
  FiAlertCircle,
  FiClock,
  FiAlertTriangle,
  FiArchive,
  FiRefreshCw,
  FiPlay,
  FiCalendar,
  FiLock,
  FiUnlock,
} from 'react-icons/fi';
import { SkeletonTableRow } from '@/components/common/Skeleton';
import SensitiveData from '@/components/ui/SensitiveData/SensitiveData';
import { useAuth } from '@/hooks/useAuth';
import { getSortDirection, generatePageNumbers } from '@/utils/adminTableHelpers';
import styles from './AdminAuditLogTable.module.scss';

// ── Action → Icon + Color mapping ─────────────────
const ACTION_CONFIG = {
  USER_CREATED: { icon: FiUserPlus, color: 'success' },
  USER_UPDATED: { icon: FiEdit, color: 'info' },
  USER_DELETED: { icon: FiUserMinus, color: 'danger' },
  USER_BANNED: { icon: FiUserX, color: 'danger' },
  USER_UNBANNED: { icon: FiUserCheck, color: 'success' },
  USER_ROLE_CHANGED: { icon: FiShield, color: 'warning' },
  USER_PASSWORD_RESET: { icon: FiKey, color: 'info' },
  ALL_USERS_DELETED: { icon: FiTrash2, color: 'danger' },
  ADMIN_LOGIN: { icon: FiLogIn, color: 'neutral' },
  SETTINGS_CHANGED: { icon: FiSettings, color: 'warning' },
  TRANSACTION_DELETED: { icon: FiDollarSign, color: 'danger' },
  SUBSCRIBER_DELETED: { icon: FiMail, color: 'danger' },
  DATA_EXPORT: { icon: FiDownload, color: 'info' },
  TRANSACTION_QUOTA_REACHED: { icon: FiAlertCircle, color: 'warning' },
  RETENTION_REMINDER_SENT: { icon: FiClock, color: 'warning' },
  RETENTION_FINAL_WARNING_SENT: { icon: FiAlertTriangle, color: 'danger' },
  TRANSACTIONS_AUTO_DELETED: { icon: FiArchive, color: 'danger' },
  USER_EXPORT_CONFIRMED: { icon: FiDownload, color: 'success' },
  RETENTION_RESET_BY_ADMIN: { icon: FiRefreshCw, color: 'info' },
  RETENTION_MANUAL_TRIGGER: { icon: FiPlay, color: 'warning' },
  RETENTION_SCHEDULED_RUN: { icon: FiCalendar, color: 'neutral' },
  USER_LOGIN: { icon: FiLogIn, color: 'neutral' },
  USER_LOGIN_FAILED: { icon: FiLock, color: 'danger' },
  USER_REGISTERED: { icon: FiUserPlus, color: 'success' },
  USER_ACCOUNT_LOCKED: { icon: FiLock, color: 'danger' },
  PASSWORD_CHANGED: { icon: FiKey, color: 'info' },
  PASSWORD_RESET_REQUESTED: { icon: FiUnlock, color: 'warning' },
  PASSWORD_RESET_COMPLETED: { icon: FiKey, color: 'success' },
  EMAIL_CHANGED: { icon: FiMail, color: 'info' },
  AUDIT_LOG_CLEARED: { icon: FiTrash2, color: 'danger' },
  AUDIT_LOG_ENTRIES_DELETED: { icon: FiTrash2, color: 'warning' },
};

const DEFAULT_SKELETON_ROWS = 8;

/**
 * AdminAuditLogTable Component
 *
 * @param {Object} props
 * @param {Array} props.logs - Array von AuditLog-Objekten
 * @param {Object} props.pagination - { total, page, pages, limit }
 * @param {boolean} props.loading
 * @param {string} props.sort
 * @param {Function} props.onSortChange
 * @param {Function} props.onPageChange
 * @param {Set} [props.selectedIds] - Set selektierter Log-IDs
 * @param {Function} [props.onSelectId] - Toggle einer einzelnen ID
 * @param {Function} [props.onSelectAll] - Alle auf Seite an/abwählen
 */
function AdminAuditLogTable({
  logs = [],
  pagination = {},
  loading = false,
  sort = '-createdAt',
  onSortChange,
  onPageChange,
  selectedIds,
  onSelectId,
  onSelectAll,
}) {
  const { t, i18n } = useTranslation();
  const { isViewer } = useAuth();

  // ── Sort Handler ────────────────────────────────
  const handleSort = useCallback(
    field => {
      const currentField = sort.replace(/^-/, '');
      const isDesc = sort.startsWith('-');

      if (currentField === field) {
        onSortChange?.(isDesc ? field : `-${field}`);
      } else {
        onSortChange?.(`-${field}`);
      }
    },
    [sort, onSortChange]
  );

  const getSortIcon = useCallback(
    field => {
      const currentField = sort.replace(/^-/, '');
      if (currentField !== field) return null;
      return sort.startsWith('-') ? (
        <FiArrowDown size={12} className={styles.sortIcon} />
      ) : (
        <FiArrowUp size={12} className={styles.sortIcon} />
      );
    },
    [sort]
  );

  // ── Formatierungen ──────────────────────────────
  const formatDateTime = useCallback(
    dateStr => {
      if (!dateStr) return '—';
      try {
        return new Intl.DateTimeFormat(i18n.language, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(dateStr));
      } catch {
        return '—';
      }
    },
    [i18n.language]
  );

  const translateRole = useCallback(role => t(`admin.auditLog.roles.${role}`, role), [t]);

  const formatDetails = useCallback(
    details => {
      if (!details || (typeof details === 'object' && Object.keys(details).length === 0)) {
        return '—';
      }
      if (typeof details === 'string') {
        return details.length > 80 ? `${details.slice(0, 80)}…` : details;
      }

      const parts = [];

      // newRole  →  "Neue Rolle: Admin"
      if (details.newRole) {
        parts.push(
          t('admin.auditLog.details_format.newRole', { role: translateRole(details.newRole) })
        );
      }

      // deletedTransactions  →  "3 Transaktionen gelöscht"
      if (details.deletedTransactions != null) {
        parts.push(
          t('admin.auditLog.details_format.deletedTransactions', {
            count: details.deletedTransactions,
          })
        );
      }

      // role (on user creation)  →  "Rolle: Admin"
      if (details.role && !details.newRole) {
        parts.push(t('admin.auditLog.details_format.role', { role: translateRole(details.role) }));
      }

      // email  →  "E-Mail: user@example.com"
      if (details.email) {
        parts.push(t('admin.auditLog.details_format.email', { email: details.email }));
      }

      // reason (bans etc.)  →  "Grund: ..."
      if (details.reason) {
        parts.push(t('admin.auditLog.details_format.reason', { reason: details.reason }));
      }

      if (parts.length > 0) {
        const result = parts.join(', ');
        return result.length > 100 ? `${result.slice(0, 100)}…` : result;
      }

      // Fallback for unknown keys
      try {
        const str = JSON.stringify(details);
        return str.length > 80 ? `${str.slice(0, 80)}…` : str;
      } catch {
        return '—';
      }
    },
    [t, translateRole]
  );

  // ── Loading ─────────────────────────────────────
  const selectable = !!selectedIds;
  const allPageIds = logs.map(l => l._id || l.id);
  const allSelected =
    selectable && allPageIds.length > 0 && allPageIds.every(id => selectedIds.has(id));

  if (loading && logs.length === 0) {
    return (
      <div className={styles.tableWrapper}>
        <SkeletonTableRow columns={9} hasIcon count={DEFAULT_SKELETON_ROWS} density="normal" />
      </div>
    );
  }

  // ── Empty State ─────────────────────────────────
  if (!loading && logs.length === 0) {
    return (
      <div className={styles.emptyState}>
        <FiFileText size={40} />
        <p>{t('admin.auditLog.noResults')}</p>
      </div>
    );
  }

  const { page = 1, pages = 1, total = 0 } = pagination;

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableWrapper}>
        <table className={styles.table} role="table">
          <thead>
            <tr>
              {selectable && (
                <th className={styles.checkboxCell}>
                  <input
                    id="select-all-audit-logs"
                    name="select-all-audit-logs"
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => onSelectAll?.()}
                    aria-label={t('admin.auditLog.selectAll')}
                  />
                </th>
              )}
              <th
                className={styles.sortable}
                onClick={() => handleSort('createdAt')}
                aria-sort={getSortDirection('createdAt', sort)}
              >
                {t('admin.auditLog.date')} {getSortIcon('createdAt')}
              </th>
              <th>{t('admin.auditLog.admin')}</th>
              <th
                className={styles.sortable}
                onClick={() => handleSort('action')}
                aria-sort={getSortDirection('action', sort)}
              >
                {t('admin.auditLog.action')} {getSortIcon('action')}
              </th>
              <th>{t('admin.auditLog.target')}</th>
              <th>{t('admin.auditLog.details')}</th>
              <th
                className={styles.sortable}
                onClick={() => handleSort('country')}
                aria-sort={getSortDirection('country', sort)}
              >
                {t('admin.auditLog.country')} {getSortIcon('country')}
              </th>
              <th>{t('admin.auditLog.ipAddress')}</th>
              <th>{t('admin.auditLog.requestId')}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => {
              const logId = log._id || log.id;
              const actionCfg = ACTION_CONFIG[log.action] || {
                icon: FiFileText,
                color: 'neutral',
              };
              const ActionIcon = actionCfg.icon;

              return (
                <tr
                  key={logId}
                  className={`${styles.row} ${selectable && selectedIds.has(logId) ? styles.selectedRow : ''}`}
                >
                  {/* Checkbox */}
                  {selectable && (
                    <td className={styles.checkboxCell}>
                      <input
                        name="select-audit-log"
                        type="checkbox"
                        checked={selectedIds.has(logId)}
                        onChange={() => onSelectId?.(logId)}
                        aria-label={t('admin.auditLog.selectEntry')}
                      />
                    </td>
                  )}

                  {/* Date/Time */}
                  <td className={styles.dateCell} data-label={t('admin.auditLog.date')}>
                    {formatDateTime(log.createdAt)}
                  </td>

                  {/* Admin */}
                  <td className={styles.adminCell} data-label={t('admin.auditLog.admin')}>
                    <FiUser size={12} className={styles.adminIcon} />
                    <SensitiveData active={isViewer}>{log.adminName || '—'}</SensitiveData>
                  </td>

                  {/* Action Badge */}
                  <td data-label={t('admin.auditLog.action')}>
                    <span className={`${styles.actionBadge} ${styles[actionCfg.color]}`}>
                      <ActionIcon size={12} />
                      {t(`admin.auditLog.actions_enum.${log.action}`, log.action)}
                    </span>
                  </td>

                  {/* Target */}
                  <td className={styles.targetCell} data-label={t('admin.auditLog.target')}>
                    <SensitiveData active={isViewer}>{log.targetUserName || '—'}</SensitiveData>
                  </td>

                  {/* Details */}
                  <td
                    className={styles.detailsCell}
                    data-label={t('admin.auditLog.details')}
                    title={
                      typeof log.details === 'object' ? JSON.stringify(log.details) : log.details
                    }
                  >
                    {formatDetails(log.details)}
                  </td>

                  {/* Country */}
                  <td className={styles.countryCell} data-label={t('admin.auditLog.country')}>
                    {log.country || '—'}
                  </td>

                  {/* IP */}
                  <td className={styles.ipCell} data-label={t('admin.auditLog.ipAddress')}>
                    <SensitiveData active={isViewer}>{log.ipAddress || '—'}</SensitiveData>
                  </td>

                  {/* Request ID */}
                  <td className={styles.requestIdCell} data-label={t('admin.auditLog.requestId')}>
                    {log.requestId ? (
                      <code className={styles.requestIdCode}>{log.requestId}</code>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div
          className={styles.pagination}
          role="navigation"
          aria-label={t('admin.auditLog.pagination')}
        >
          <span className={styles.paginationInfo}>
            {t('admin.auditLog.showing', {
              from: (page - 1) * (pagination.limit || DEFAULT_SKELETON_ROWS) + 1,
              to: Math.min(page * (pagination.limit || DEFAULT_SKELETON_ROWS), total),
              total,
            })}
          </span>
          <div className={styles.paginationButtons}>
            <button
              className={styles.pageButton}
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1 || loading}
              type="button"
              aria-label={t('admin.auditLog.prevPage')}
            >
              <FiChevronLeft size={16} />
            </button>
            {generatePageNumbers(page, pages).map((p, idx) =>
              p === '...' ? (
                <span key={`dots-${idx}`} className={styles.dots}>
                  …
                </span>
              ) : (
                <button
                  key={p}
                  className={`${styles.pageButton} ${p === page ? styles.activePage : ''}`}
                  onClick={() => onPageChange?.(p)}
                  disabled={loading}
                  type="button"
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              )
            )}
            <button
              className={styles.pageButton}
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= pages || loading}
              type="button"
              aria-label={t('admin.auditLog.nextPage')}
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(AdminAuditLogTable);
