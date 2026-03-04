/**
 * @fileoverview AdminTransactionTable – Transaktions-Tabelle für Admin-Panel
 * @description Sortierbare Tabelle mit Pagination, Typ-/Kategorie-Badges,
 *              Betragsformatierung und View-Button.
 *
 * @module components/admin/AdminTransactionTable
 */

import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiArrowUp,
  FiArrowDown,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
} from 'react-icons/fi';
import { SkeletonTableRow } from '@/components/common/Skeleton';
import { translateCategory } from '@/utils/categoryTranslations';
import { getSortDirection, generatePageNumbers, formatAdminCurrency } from '@/utils/adminTableHelpers';
import styles from './AdminTransactionTable.module.scss';

// ── Sortierbare Spalten ───────────────────────────
const SORT_FIELDS = {
  date: 'date',
  amount: 'amount',
  category: 'category',
  type: 'type',
};

const DEFAULT_SKELETON_ROWS = 6;

/**
 * AdminTransactionTable Component
 *
 * @param {Object} props
 * @param {Array} props.transactions - Array von Transaction-Objekten
 * @param {Object} props.pagination - { total, page, pages, limit }
 * @param {boolean} props.loading
 * @param {string} props.sort - Aktuelles Sort-Feld (z.B. '-date')
 * @param {Function} props.onSortChange
 * @param {Function} props.onPageChange
 * @param {Function} props.onViewTransaction
 * @param {string|null} props.actionLoading
 */
function AdminTransactionTable({
  transactions = [],
  pagination = {},
  loading = false,
  sort = '-date',
  onSortChange,
  onPageChange,
  onViewTransaction,
  actionLoading = null,
}) {
  const { t, i18n } = useTranslation();

  // ── Sort Handler ────────────────────────────────
  const handleSort = useCallback(
    (field) => {
      if (!SORT_FIELDS[field]) return;
      const currentField = sort.replace(/^-/, '');
      const isDesc = sort.startsWith('-');

      if (currentField === field) {
        onSortChange?.(isDesc ? field : `-${field}`);
      } else {
        onSortChange?.(`-${field}`);
      }
    },
    [sort, onSortChange],
  );

  const getSortIcon = useCallback(
    (field) => {
      const currentField = sort.replace(/^-/, '');
      if (currentField !== field) return null;
      return sort.startsWith('-') ? (
        <FiArrowDown size={12} className={styles.sortIcon} />
      ) : (
        <FiArrowUp size={12} className={styles.sortIcon} />
      );
    },
    [sort],
  );

  // ── Formatierungen ──────────────────────────────
  const formatDate = useCallback((dateStr) => {
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
  }, [i18n.language]);

  const formatAmount = useCallback((amount, type) => {
    if (amount == null) return '—';
    const value = formatAdminCurrency(Math.abs(amount), i18n.language);
    return type === 'income' ? `+${value}` : `-${value}`;
  }, [i18n.language]);

  // ── Loading ─────────────────────────────────────
  if (loading && transactions.length === 0) {
    return (
      <div className={styles.tableWrapper}>
        <SkeletonTableRow columns={7} hasIcon count={DEFAULT_SKELETON_ROWS} density="normal" />
      </div>
    );
  }

  // ── Empty State ─────────────────────────────────
  if (!loading && transactions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <FiDollarSign size={40} />
        <p>{t('admin.transactions.noResults')}</p>
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
                onClick={() => handleSort('date')}
                aria-sort={getSortDirection('date', sort)}
              >
                {t('admin.transactions.date')} {getSortIcon('date')}
              </th>
              <th>{t('admin.transactions.description')}</th>
              <th
                className={styles.sortable}
                onClick={() => handleSort('category')}
                aria-sort={getSortDirection('category', sort)}
              >
                {t('admin.transactions.category')} {getSortIcon('category')}
              </th>
              <th
                className={styles.sortable}
                onClick={() => handleSort('type')}
                aria-sort={getSortDirection('type', sort)}
              >
                {t('admin.transactions.type')} {getSortIcon('type')}
              </th>
              <th
                className={styles.sortable}
                onClick={() => handleSort('amount')}
                aria-sort={getSortDirection('amount', sort)}
              >
                {t('admin.transactions.amount')} {getSortIcon('amount')}
              </th>
              <th>{t('admin.transactions.user')}</th>
              <th>{t('admin.transactions.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => {
              const txId = tx._id || tx.id;
              return (
                <tr key={txId}>
                  {/* Date */}
                  <td className={styles.dateCell} data-label={t('admin.transactions.date')}>
                    {formatDate(tx.date)}
                  </td>

                  {/* Description */}
                  <td className={styles.descCell} data-label={t('admin.transactions.description')}>{tx.description || '—'}</td>

                  {/* Category */}
                  <td data-label={t('admin.transactions.category')}>
                    <span className={styles.categoryBadge}>
                      {translateCategory(tx.category, t)}
                    </span>
                  </td>

                  {/* Type */}
                  <td data-label={t('admin.transactions.type')}>
                    <span className={`${styles.typeBadge} ${styles[tx.type]}`}>
                      {tx.type === 'income' ? (
                        <><FiTrendingUp size={12} /> {t('admin.transactions.income')}</>
                      ) : (
                        <><FiTrendingDown size={12} /> {t('admin.transactions.expense')}</>
                      )}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className={`${styles.amountCell} ${styles[tx.type]}`} data-label={t('admin.transactions.amount')}>
                    {formatAmount(tx.amount, tx.type)}
                  </td>

                  {/* User */}
                  <td className={styles.userCell} data-label={t('admin.transactions.user')}>
                    {tx.userId?.name || tx.userId?.email || '—'}
                  </td>

                  {/* Actions */}
                  <td className={styles.actionsCell} data-label={t('admin.transactions.actions')}>
                    <button
                      className={styles.viewButton}
                      onClick={() => onViewTransaction?.(tx)}
                      disabled={actionLoading === txId}
                      title={t('admin.transactions.viewDetails')}
                      type="button"
                      aria-label={`${t('admin.transactions.viewDetails')} ${tx.description || ''}`}
                    >
                      <FiEye size={16} />
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
        <div className={styles.pagination} role="navigation" aria-label={t('admin.transactions.pagination')}>
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
                <span key={`dots-${idx}`} className={styles.dots}>…</span>
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
              ),
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

export default memo(AdminTransactionTable);
