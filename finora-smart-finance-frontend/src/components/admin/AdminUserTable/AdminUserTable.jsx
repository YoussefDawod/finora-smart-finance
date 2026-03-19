/**
 * @fileoverview AdminUserTable – Benutzertabelle für Admin-Panel
 * @description Sortierbare Tabelle mit Pagination, Inline-Statusanzeigen
 *              und Aktions-Buttons pro Zeile.
 *
 * @module components/admin/AdminUserTable
 */

import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiUser,
  FiShield,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiArrowUp,
  FiArrowDown,
} from 'react-icons/fi';
import { SkeletonTableRow } from '@/components/common/Skeleton';
import SensitiveData from '@/components/ui/SensitiveData/SensitiveData';
import { useAuth } from '@/hooks/useAuth';
import { getSortDirection, generatePageNumbers } from '@/utils/adminTableHelpers';
import styles from './AdminUserTable.module.scss';

// ── Sortierbare Spalten ───────────────────────────
const SORT_FIELDS = {
  name: 'name',
  email: 'email',
  createdAt: 'createdAt',
  lastLogin: 'lastLogin',
};

/**
 * AdminUserTable Component
 *
 * @param {Object} props
 * @param {Array} props.users - Array von User-Objekten
 * @param {Object} props.pagination - { total, page, pages, limit }
 * @param {boolean} props.loading
 * @param {string} props.sort - Aktuelles Sort-Feld (z.B. '-createdAt')
 * @param {Function} props.onSortChange - (sortString) => void
 * @param {Function} props.onPageChange - (page) => void
 * @param {Function} props.onViewUser - (user) => void
 * @param {string|null} props.actionLoading - userId der laufenden Aktion
 */
function AdminUserTable({
  users = [],
  pagination = {},
  loading = false,
  sort = '-createdAt',
  onSortChange,
  onPageChange,
  onViewUser,
  actionLoading = null,
}) {
  const { t, i18n } = useTranslation();
  const { isViewer } = useAuth();

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
  if (loading && users.length === 0) {
    return (
      <div className={styles.tableWrapper}>
        <SkeletonTableRow columns={7} hasIcon count={DEFAULT_SKELETON_ROWS} density="normal" />
      </div>
    );
  }

  // ── Empty State ─────────────────────────────────
  if (!loading && users.length === 0) {
    return (
      <div className={styles.emptyState}>
        <FiUser size={40} />
        <p>{t('admin.users.noResults')}</p>
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
              <th
                className={styles.sortable}
                onClick={() => handleSort('name')}
                aria-sort={getSortDirection('name', sort)}
              >
                {t('admin.users.name')} {getSortIcon('name')}
              </th>
              <th
                className={styles.sortable}
                onClick={() => handleSort('email')}
                aria-sort={getSortDirection('email', sort)}
              >
                {t('admin.users.email')} {getSortIcon('email')}
              </th>
              <th>{t('admin.users.role')}</th>
              <th>{t('admin.users.status')}</th>
              <th>{t('admin.users.verified')}</th>
              <th
                className={styles.sortable}
                onClick={() => handleSort('createdAt')}
                aria-sort={getSortDirection('createdAt', sort)}
              >
                {t('admin.users.joined')} {getSortIcon('createdAt')}
              </th>
              <th>{t('admin.users.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr
                key={user._id || user.id}
                className={!user.isActive ? styles.bannedRow : undefined}
              >
                {/* Name + Avatar */}
                <td className={styles.nameCell} data-label={t('admin.users.name')}>
                  <div className={styles.nameWrapper}>
                    <span
                      className={`${styles.avatar} ${user.role === 'admin' ? styles.adminAvatar : ''}`}
                    >
                      {user.role === 'admin' ? <FiShield size={14} /> : <FiUser size={14} />}
                    </span>
                    <span className={styles.nameText}>
                      <SensitiveData active={isViewer}>{user.name}</SensitiveData>
                    </span>
                  </div>
                </td>

                {/* Email */}
                <td className={styles.emailCell} data-label={t('admin.users.email')}>
                  <SensitiveData active={isViewer}>{user.email || '—'}</SensitiveData>
                </td>

                {/* Role Badge */}
                <td data-label={t('admin.users.role')}>
                  <span className={`${styles.badge} ${styles[`role_${user.role}`]}`}>
                    {user.role === 'admin'
                      ? t('admin.users.roleAdmin')
                      : user.role === 'viewer'
                        ? t('admin.users.roleViewer')
                        : t('admin.users.roleUser')}
                  </span>
                </td>

                {/* Status */}
                <td data-label={t('admin.users.status')}>
                  {user.isActive === false ? (
                    <span className={`${styles.badge} ${styles.banned}`}>
                      {t('admin.users.banned')}
                    </span>
                  ) : (
                    <span className={`${styles.badge} ${styles.active}`}>
                      {t('admin.users.active')}
                    </span>
                  )}
                </td>

                {/* Verified */}
                <td className={styles.verifiedCell} data-label={t('admin.users.verified')}>
                  {user.isVerified ? (
                    <FiCheckCircle size={16} className={styles.verifiedIcon} />
                  ) : (
                    <FiXCircle size={16} className={styles.unverifiedIcon} />
                  )}
                </td>

                {/* Joined Date */}
                <td className={styles.dateCell} data-label={t('admin.users.joined')}>
                  {formatDate(user.createdAt)}
                </td>

                {/* Actions */}
                <td className={styles.actionsCell} data-label={t('admin.users.actions')}>
                  <button
                    className={styles.viewButton}
                    onClick={() => onViewUser?.(user)}
                    disabled={actionLoading === (user._id || user.id)}
                    title={t('admin.users.viewDetails')}
                    type="button"
                    aria-label={`${t('admin.users.viewDetails')} ${user.name}`}
                  >
                    <FiEye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div
          className={styles.pagination}
          role="navigation"
          aria-label={t('admin.users.pagination')}
        >
          <span className={styles.paginationInfo}>
            {t('admin.users.showing', {
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
              aria-label={t('admin.users.prevPage')}
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
              aria-label={t('admin.users.nextPage')}
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────

const DEFAULT_SKELETON_ROWS = 5;

export default memo(AdminUserTable);
