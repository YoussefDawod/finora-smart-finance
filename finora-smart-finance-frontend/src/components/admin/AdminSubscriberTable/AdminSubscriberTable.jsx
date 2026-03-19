/**
 * @fileoverview AdminSubscriberTable – Subscriber-Tabelle für Admin-Panel
 * @description Sortierbare Tabelle mit Pagination, Status-Badge, Sprach-Badge
 *              und Lösch-Button mit Bestätigungs-Dialog.
 *
 * @module components/admin/AdminSubscriberTable
 */

import { memo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiArrowUp,
  FiArrowDown,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiMail,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiUser,
  FiUserX,
  FiEye,
} from 'react-icons/fi';
import { SkeletonTableRow } from '@/components/common/Skeleton';
import SensitiveData from '@/components/ui/SensitiveData/SensitiveData';
import { useAuth } from '@/hooks/useAuth';
import { useViewerGuard } from '@/hooks/useViewerGuard';
import { getSortDirection, generatePageNumbers } from '@/utils/adminTableHelpers';
import { LANGUAGE_LABELS } from '@/constants';
import styles from './AdminSubscriberTable.module.scss';

// ── Sortierbare Spalten ───────────────────────────
const SORT_FIELDS = {
  email: 'email',
  createdAt: 'createdAt',
  subscribedAt: 'subscribedAt',
  language: 'language',
};

const DEFAULT_SKELETON_ROWS = 6;

/**
 * AdminSubscriberTable Component
 *
 * @param {Object} props
 * @param {Array} props.subscribers - Array von Subscriber-Objekten
 * @param {Object} props.pagination - { total, page, pages, limit }
 * @param {boolean} props.loading
 * @param {string} props.sort
 * @param {Function} props.onSortChange
 * @param {Function} props.onPageChange
 * @param {Function} props.onDelete - deleteSubscriber(id) Callback
 * @param {Function} props.onViewSubscriber - Subscriber Detail öffnen
 * @param {string|null} props.actionLoading
 */
function AdminSubscriberTable({
  subscribers = [],
  pagination = {},
  loading = false,
  sort = '-createdAt',
  onSortChange,
  onPageChange,
  onDelete,
  onViewSubscriber,
  actionLoading = null,
}) {
  const { t, i18n } = useTranslation();
  const { isViewer } = useAuth();
  const { guard } = useViewerGuard();
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ── Sort Handler ────────────────────────────────
  const handleSort = useCallback(
    field => {
      if (!SORT_FIELDS[field]) return;
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

  // ── Delete with confirmation ────────────────────
  const handleDeleteClick = useCallback(sub => {
    setDeleteConfirm(sub);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm) return;
    const id = deleteConfirm._id || deleteConfirm.id;
    await onDelete?.(id);
    setDeleteConfirm(null);
  }, [deleteConfirm, onDelete]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirm(null);
  }, []);

  // ── Formatierungen ──────────────────────────────
  const formatDate = useCallback(
    dateStr => {
      if (!dateStr) return '—';
      try {
        return new Intl.DateTimeFormat(i18n.language, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(new Date(dateStr));
      } catch {
        return '—';
      }
    },
    [i18n.language]
  );

  // ── Loading ─────────────────────────────────────
  if (loading && subscribers.length === 0) {
    return (
      <div className={styles.tableWrapper}>
        <SkeletonTableRow columns={5} hasIcon count={DEFAULT_SKELETON_ROWS} density="normal" />
      </div>
    );
  }

  // ── Empty State ─────────────────────────────────
  if (!loading && subscribers.length === 0) {
    return (
      <div className={styles.emptyState}>
        <FiMail size={40} />
        <p>{t('admin.subscribers.noResults')}</p>
      </div>
    );
  }

  const { page = 1, pages = 1, total = 0 } = pagination;
  const deleteConfirmId = deleteConfirm?._id || deleteConfirm?.id;

  return (
    <div className={styles.tableContainer}>
      {/* Delete Confirmation Banner */}
      {deleteConfirm && (
        <div className={styles.deleteConfirm} role="alert">
          <span>{t('admin.subscribers.confirmDeleteText', { email: deleteConfirm.email })}</span>
          <div className={styles.confirmButtons}>
            <button
              className={styles.cancelButton}
              onClick={handleDeleteCancel}
              disabled={actionLoading === deleteConfirmId}
              type="button"
            >
              {t('common.cancel')}
            </button>
            <button
              className={styles.dangerButton}
              onClick={handleDeleteConfirm}
              disabled={actionLoading === deleteConfirmId}
              type="button"
            >
              {actionLoading === deleteConfirmId ? (
                <FiRefreshCw size={14} className={styles.spinning} />
              ) : (
                <FiTrash2 size={14} />
              )}
              {t('admin.subscribers.delete')}
            </button>
          </div>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table} role="table">
          <thead>
            <tr>
              <th
                className={styles.sortable}
                onClick={() => handleSort('email')}
                aria-sort={getSortDirection('email', sort)}
              >
                {t('admin.subscribers.email')} {getSortIcon('email')}
              </th>
              <th>{t('admin.subscribers.status')}</th>
              <th>{t('admin.subscribers.type')}</th>
              <th
                className={styles.sortable}
                onClick={() => handleSort('language')}
                aria-sort={getSortDirection('language', sort)}
              >
                {t('admin.subscribers.language')} {getSortIcon('language')}
              </th>
              <th
                className={styles.sortable}
                onClick={() => handleSort('createdAt')}
                aria-sort={getSortDirection('createdAt', sort)}
              >
                {t('admin.subscribers.subscribedAt')} {getSortIcon('createdAt')}
              </th>
              <th>{t('admin.subscribers.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map(sub => {
              const subId = sub._id || sub.id;
              return (
                <tr key={subId} className={styles.row}>
                  {/* Email */}
                  <td className={styles.emailCell} data-label={t('admin.subscribers.email')}>
                    <SensitiveData active={isViewer}>{sub.email}</SensitiveData>
                  </td>

                  {/* Status */}
                  <td data-label={t('admin.subscribers.status')}>
                    {sub.isConfirmed ? (
                      <span className={`${styles.statusBadge} ${styles.confirmed}`}>
                        <FiCheckCircle size={12} />
                        {t('admin.subscribers.confirmed')}
                      </span>
                    ) : (
                      <span className={`${styles.statusBadge} ${styles.pending}`}>
                        <FiClock size={12} />
                        {t('admin.subscribers.pending')}
                      </span>
                    )}
                  </td>

                  {/* Registered / Guest */}
                  <td data-label={t('admin.subscribers.type')}>
                    {sub.userId ? (
                      <span className={`${styles.typeBadge} ${styles.registered}`}>
                        <FiUser size={12} />
                        {t('admin.subscribers.registered')}
                      </span>
                    ) : (
                      <span className={`${styles.typeBadge} ${styles.guest}`}>
                        <FiUserX size={12} />
                        {t('admin.subscribers.guest')}
                      </span>
                    )}
                  </td>

                  {/* Language */}
                  <td data-label={t('admin.subscribers.language')}>
                    <span className={styles.langBadge}>
                      {LANGUAGE_LABELS[sub.language] || sub.language || '—'}
                    </span>
                  </td>

                  {/* Date */}
                  <td className={styles.dateCell} data-label={t('admin.subscribers.subscribedAt')}>
                    {formatDate(sub.subscribedAt || sub.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className={styles.actionsCell} data-label={t('admin.subscribers.actions')}>
                    <button
                      className={styles.viewButton}
                      onClick={() => onViewSubscriber?.(sub)}
                      title={t('admin.subscribers.detail.view')}
                      type="button"
                      aria-label={`${t('admin.subscribers.detail.view')} ${sub.email}`}
                    >
                      <FiEye size={16} />
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => guard(() => handleDeleteClick(sub))}
                      disabled={actionLoading === subId}
                      title={t('admin.subscribers.delete')}
                      type="button"
                      aria-label={`${t('admin.subscribers.delete')} ${sub.email}`}
                    >
                      <FiTrash2 size={16} />
                    </button>
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
          aria-label={t('admin.subscribers.pagination')}
        >
          <span className={styles.paginationInfo}>
            {t('admin.subscribers.showing', {
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
              aria-label={t('admin.subscribers.prevPage')}
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
              aria-label={t('admin.subscribers.nextPage')}
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(AdminSubscriberTable);
