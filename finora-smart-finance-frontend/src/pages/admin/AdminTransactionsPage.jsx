/**
 * @fileoverview Admin Transactions Page
 * @description Zwei-Ebenen-Ansicht: Erst User-Liste mit Transaktions-Statistiken,
 *              dann Drill-Down zu den Transaktionen eines bestimmten Users.
 *
 * Komponenten: AdminTransactionUserList · AdminTransactionTable · AdminTransactionDetail
 * Hooks:       useAdminTransactions · useAdminTransactionUsers
 *
 * @module pages/admin/AdminTransactionsPage
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiSearch,
  FiRefreshCw,
  FiDollarSign,
  FiArrowLeft,
  FiDownload,
  FiChevronDown,
} from 'react-icons/fi';
import { useAdminTransactions, useAdminTransactionUsers, useToast, useAuth } from '@/hooks';
import { useViewerGuard } from '@/hooks/useViewerGuard';
import {
  AdminTransactionTable,
  AdminTransactionDetail,
  AdminTransactionUserList,
} from '@/components/admin';
import { adminService } from '@/api/adminService';
import { triggerBlobDownload, generatePDF } from '@/utils/exportHelpers';
import FilterDropdown from '@/components/common/FilterDropdown/FilterDropdown';
import DateInput from '@/components/common/DateInput/DateInput';
import { ALL_CATEGORIES } from '@/config/categoryConstants';
import { translateCategory } from '@/utils/categoryTranslations';
import styles from './AdminTransactionsPage.module.scss';

export default function AdminTransactionsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { user: authUser } = useAuth();
  const { guard } = useViewerGuard();

  // ── View State (users | transactions) ───────────
  const [view, setView] = useState('users');
  const [selectedUser, setSelectedUser] = useState(null);

  // ── Hooks ───────────────────────────────────────
  const userList = useAdminTransactionUsers();
  const txHook = useAdminTransactions({
    userId: selectedUser?._id || selectedUser?.id || '',
  });

  const { transactions, pagination, loading, error, actionLoading, filters, actions } = txHook;

  // ── Detail Modal State ──────────────────────────
  const [selectedTx, setSelectedTx] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // ── Export Dropdown ─────────────────────────────
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = e => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Handlers ────────────────────────────────────
  const handleSelectUser = useCallback(user => {
    setSelectedUser(user);
    setView('transactions');
  }, []);

  const handleBackToUsers = useCallback(() => {
    setView('users');
    setSelectedUser(null);
  }, []);

  const handleViewTransaction = useCallback(tx => {
    setSelectedTx(tx);
    setDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
    setSelectedTx(null);
  }, []);

  const handleActionSuccess = useCallback(
    message => {
      toast.success(message);
    },
    [toast]
  );

  const handleActionError = useCallback(
    message => {
      toast.error(message);
    },
    [toast]
  );

  const handleExportCSV = useCallback(async () => {
    setExporting(true);
    setExportMenuOpen(false);
    try {
      const res = await adminService.exportTransactionsCSV();
      const blob =
        res.data instanceof Blob
          ? res.data
          : new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      triggerBlobDownload(blob, 'transactions-export.csv');
      toast.success(t('admin.transactions.export.success'));
    } catch {
      toast.error(t('admin.transactions.export.error'));
    } finally {
      setExporting(false);
    }
  }, [toast, t]);

  const handleExportPDF = useCallback(async () => {
    setExporting(true);
    setExportMenuOpen(false);
    try {
      const res = await adminService.getTransactionUsers({ limit: 1000 });
      const users = res.data?.users || res.data || [];
      const allTx = [];
      for (const u of users) {
        try {
          const txRes = await adminService.getUserTransactions(u._id || u.id, { limit: 5000 });
          const txList = txRes.data?.transactions || txRes.data || [];
          txList.forEach(tx => allTx.push({ ...tx, _userName: u.name || u.email }));
        } catch {
          /* skip user on error */
        }
      }

      const headers = [
        t('admin.transactions.table.user'),
        t('admin.transactions.table.type'),
        t('admin.transactions.table.category'),
        t('admin.transactions.table.amount'),
        t('admin.transactions.table.date'),
        t('admin.transactions.table.description'),
      ];
      const rows = allTx.map(tx => [
        tx._userName,
        tx.type,
        translateCategory(tx.category, t) || tx.category,
        `${Number(tx.amount || 0).toFixed(2)} €`,
        tx.date ? new Date(tx.date).toLocaleDateString() : '',
        tx.description || '',
      ]);

      await generatePDF({
        title: t('admin.transactions.title'),
        headers,
        rows,
        filename: 'transactions-export.pdf',
        userInfo: { name: authUser?.name, email: authUser?.email },
      });
      toast.success(t('admin.transactions.export.success'));
    } catch {
      toast.error(t('admin.transactions.export.error'));
    } finally {
      setExporting(false);
    }
  }, [toast, t, authUser]);

  // ═══════════════════════════════════════════════
  //  USER LIST VIEW
  // ═══════════════════════════════════════════════
  if (view === 'users') {
    return (
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{t('admin.transactions.title')}</h1>
            <p className={styles.subtitle}>
              {t('admin.transactions.usersSubtitle', { count: userList.pagination.total })}
            </p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.exportDropdown} ref={exportRef}>
              <button
                className={styles.exportButton}
                onClick={() => guard(() => setExportMenuOpen(p => !p))}
                disabled={exporting || userList.loading}
                type="button"
              >
                <FiDownload size={16} />
                {t('admin.transactions.export.button')}
                <FiChevronDown size={14} />
              </button>
              {exportMenuOpen && (
                <div className={styles.exportMenu}>
                  <button
                    className={styles.exportMenuItem}
                    onClick={() => guard(handleExportCSV)}
                    type="button"
                  >
                    CSV
                  </button>
                  <button
                    className={styles.exportMenuItem}
                    onClick={() => guard(handleExportPDF)}
                    type="button"
                  >
                    PDF
                  </button>
                </div>
              )}
            </div>
            <button
              className={styles.refreshButton}
              onClick={userList.refresh}
              disabled={userList.loading}
              type="button"
              aria-label={t('admin.transactions.refresh')}
            >
              <FiRefreshCw size={16} className={userList.loading ? styles.spinning : ''} />
              {t('admin.transactions.refresh')}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrapper}>
            <FiSearch size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              value={userList.filters.search}
              onChange={e => userList.filters.setSearch(e.target.value)}
              placeholder={t('admin.transactions.searchUserPlaceholder')}
              aria-label={t('admin.transactions.searchUserPlaceholder')}
            />
          </div>
        </div>

        {/* User List */}
        <AdminTransactionUserList
          users={userList.users}
          pagination={userList.pagination}
          loading={userList.loading}
          onSelectUser={handleSelectUser}
          onPageChange={userList.filters.setPage}
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  //  TRANSACTIONS VIEW (for a selected user)
  // ═══════════════════════════════════════════════

  // Error State
  if (error && !loading && transactions.length === 0) {
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
        <div className={styles.headerLeft}>
          <button
            className={styles.backButton}
            onClick={handleBackToUsers}
            type="button"
            aria-label={t('admin.transactions.backToUsers')}
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h1 className={styles.title}>{selectedUser?.name || t('admin.transactions.title')}</h1>
            <p className={styles.subtitle}>
              {t('admin.transactions.subtitle', { count: pagination.total })}
            </p>
          </div>
        </div>
        <button
          className={styles.refreshButton}
          onClick={actions.refresh}
          disabled={loading}
          type="button"
          aria-label={t('admin.transactions.refresh')}
        >
          <FiRefreshCw size={16} className={loading ? styles.spinning : ''} />
          {t('admin.transactions.refresh')}
        </button>
      </div>

      {/* ── Filters / Search Bar ────────────────── */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <FiSearch size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            value={filters.search}
            onChange={e => filters.setSearch(e.target.value)}
            placeholder={t('admin.transactions.searchPlaceholder')}
            aria-label={t('admin.transactions.searchPlaceholder')}
          />
        </div>

        <div className={styles.filterGroup}>
          <FilterDropdown
            value={filters.typeFilter}
            onChange={filters.setTypeFilter}
            ariaLabel={t('admin.transactions.filterType')}
            placeholder={t('admin.transactions.allTypes')}
            options={[
              { value: '', label: t('admin.transactions.allTypes') },
              { value: 'income', label: t('admin.transactions.income') },
              { value: 'expense', label: t('admin.transactions.expense') },
            ]}
          />

          <FilterDropdown
            value={filters.categoryFilter}
            onChange={filters.setCategoryFilter}
            ariaLabel={t('admin.transactions.filterCategory')}
            placeholder={t('admin.transactions.allCategories')}
            options={[
              { value: '', label: t('admin.transactions.allCategories') },
              ...ALL_CATEGORIES.map(cat => ({
                value: cat,
                label: translateCategory(cat, t),
              })),
            ]}
          />
        </div>
      </div>

      {/* ── Date Range ──────────────────────────── */}
      <div className={styles.dateRange}>
        <DateInput
          label={t('admin.transactions.startDate')}
          value={filters.startDate}
          onChange={filters.setStartDate}
          ariaLabel={t('admin.transactions.startDate')}
        />
        <DateInput
          label={t('admin.transactions.endDate')}
          value={filters.endDate}
          onChange={filters.setEndDate}
          ariaLabel={t('admin.transactions.endDate')}
        />
      </div>

      {/* ── Total Count Badge ───────────────────── */}
      <div className={styles.countBadge}>
        <FiDollarSign size={14} />
        <span>{t('admin.transactions.totalTransactions', { count: pagination.total })}</span>
      </div>

      {/* ── Table ───────────────────────────────── */}
      <AdminTransactionTable
        transactions={transactions}
        pagination={pagination}
        loading={loading}
        sort={filters.sort}
        onSortChange={filters.setSort}
        onPageChange={filters.setPage}
        onViewTransaction={handleViewTransaction}
        actionLoading={actionLoading}
      />

      {/* ── Detail Modal ────────────────────────── */}
      <AdminTransactionDetail
        transaction={selectedTx}
        isOpen={detailOpen}
        onClose={handleCloseDetail}
        onDelete={actions.deleteTransaction}
        actionLoading={actionLoading}
        onSuccess={handleActionSuccess}
        onError={handleActionError}
      />
    </div>
  );
}
