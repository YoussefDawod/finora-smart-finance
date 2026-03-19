/**
 * @fileoverview AdminTransactionUserList — Zeigt User mit Transaktions-Stats
 * @description Gruppierte Ansicht: Erst User mit Infos, dann Drill-Down zu Transaktionen.
 *
 * @module components/admin/AdminTransactionUserList
 */

import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import SensitiveData from '@/components/ui/SensitiveData/SensitiveData';
import {
  FiUser,
  FiMail,
  FiCreditCard,
  FiCalendar,
  FiChevronRight,
  FiChevronLeft,
  FiArrowUpCircle,
  FiArrowDownCircle,
} from 'react-icons/fi';
import { SkeletonTableRow } from '@/components/common/Skeleton';
import { generatePageNumbers, formatAdminCurrency } from '@/utils/adminTableHelpers';
import styles from './AdminTransactionUserList.module.scss';

const DEFAULT_SKELETON_ROWS = 6;

function formatDate(dateStr, locale = 'de') {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * AdminTransactionUserList
 *
 * @param {Object} props
 * @param {Array} props.users - User-Liste mit transactionCount, totalIncome, totalExpense
 * @param {Object} props.pagination
 * @param {boolean} props.loading
 * @param {Function} props.onSelectUser - Callback bei Klick auf User
 * @param {Function} props.onPageChange
 */
function AdminTransactionUserList({
  users = [],
  pagination = {},
  loading = false,
  onSelectUser,
  onPageChange,
}) {
  const { t, i18n } = useTranslation();
  const { isViewer } = useAuth();

  const handleUserClick = useCallback(
    user => {
      onSelectUser?.(user);
    },
    [onSelectUser]
  );

  // ── Loading ─────────────────────────────────────
  if (loading && users.length === 0) {
    return (
      <div className={styles.container}>
        <SkeletonTableRow columns={5} hasIcon count={DEFAULT_SKELETON_ROWS} density="normal" />
      </div>
    );
  }

  // ── Empty State ─────────────────────────────────
  if (!loading && users.length === 0) {
    return (
      <div className={styles.emptyState}>
        <FiUser size={40} />
        <p>{t('admin.transactions.noUsers')}</p>
      </div>
    );
  }

  const { page = 1, pages = 1, total = 0 } = pagination;

  return (
    <div className={styles.container}>
      {/* User Cards Grid */}
      <div className={styles.userGrid}>
        {users.map(user => {
          const userId = user._id || user.id;
          const netBalance = (user.totalIncome || 0) - (user.totalExpense || 0);
          return (
            <button
              key={userId}
              className={styles.userCard}
              onClick={() => handleUserClick(user)}
              type="button"
              aria-label={`${user.name} — ${t('admin.transactions.viewUserTransactions')}`}
            >
              {/* Card Header */}
              <div className={styles.cardHeader}>
                <div className={styles.userAvatar}>
                  {user.name
                    ?.split(' ')
                    .map(p => p[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || 'U'}
                </div>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>
                    <SensitiveData active={isViewer}>{user.name}</SensitiveData>
                  </span>
                  {user.email && (
                    <span className={styles.userEmail}>
                      <FiMail size={12} />
                      <SensitiveData active={isViewer}>{user.email}</SensitiveData>
                    </span>
                  )}
                </div>
                <FiChevronRight size={20} className={styles.chevron} />
              </div>

              {/* Stats Row */}
              <div className={styles.statsRow}>
                <div className={styles.stat}>
                  <FiCreditCard size={14} />
                  <span className={styles.statValue}>{user.transactionCount || 0}</span>
                  <span className={styles.statLabel}>{t('admin.transactions.txCount')}</span>
                </div>
                <div className={`${styles.stat} ${styles.income}`}>
                  <FiArrowUpCircle size={14} />
                  <span className={styles.statValue}>
                    {formatAdminCurrency(user.totalIncome, i18n.language)}
                  </span>
                </div>
                <div className={`${styles.stat} ${styles.expense}`}>
                  <FiArrowDownCircle size={14} />
                  <span className={styles.statValue}>
                    {formatAdminCurrency(user.totalExpense, i18n.language)}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className={styles.cardFooter}>
                {user.lastTransactionDate && (
                  <span className={styles.lastTx}>
                    <FiCalendar size={12} />
                    {t('admin.transactions.lastTransaction')}:{' '}
                    {formatDate(user.lastTransactionDate, i18n.language)}
                  </span>
                )}
                <span
                  className={`${styles.balance} ${netBalance >= 0 ? styles.positive : styles.negative}`}
                >
                  {netBalance >= 0 ? '+' : ''}
                  {formatAdminCurrency(netBalance, i18n.language)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div
          className={styles.pagination}
          role="navigation"
          aria-label={t('admin.transactions.pagination')}
        >
          <span className={styles.paginationInfo}>
            {t('admin.transactions.showing', {
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
              aria-label={t('admin.transactions.prevPage')}
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
              aria-label={t('admin.transactions.nextPage')}
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(AdminTransactionUserList);
