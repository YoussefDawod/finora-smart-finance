/**
 * @fileoverview Admin Users Page
 * @description Benutzer-Verwaltung mit Such-/Filterfunktion, sortierbarer Tabelle,
 *              Pagination und Detail-Modal (Ban / Unban / Rolle / Passwort / Löschen).
 *
 * Komponenten: AdminUserTable · AdminUserDetail
 * Hook:        useAdminUsers (Laden, Filter, Sortierung, Aktionen)
 *
 * @module pages/admin/AdminUsersPage
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiSearch,
  FiRefreshCw,
  FiUsers,
  FiUserPlus,
  FiDownload,
  FiChevronDown,
} from 'react-icons/fi';
import { useAdminUsers, useToast, useAuth } from '@/hooks';
import { useViewerGuard } from '@/hooks/useViewerGuard';
import { AdminUserTable, AdminUserDetail, AdminCreateUser } from '@/components/admin';
import { adminService } from '@/api/adminService';
import { triggerBlobDownload, generatePDF } from '@/utils/exportHelpers';
import FilterDropdown from '@/components/common/FilterDropdown/FilterDropdown';
import styles from './AdminUsersPage.module.scss';

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { user: authUser } = useAuth();
  const { guard } = useViewerGuard();
  const { users, pagination, loading, error, actionLoading, filters, actions } = useAdminUsers();

  // ── Detail Modal State ──────────────────────────
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportRef = useRef(null);

  // Schließe Export-Dropdown bei Click außerhalb
  useEffect(() => {
    const handleClickOutside = e => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportMenuOpen(false);
      }
    };
    if (exportMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [exportMenuOpen]);

  const handleViewUser = useCallback(user => {
    setSelectedUser(user);
    setDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
    setSelectedUser(null);
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

  const handleCreateUser = useCallback(
    async userData => {
      const result = await actions.createUser(userData);
      if (result.success) {
        toast.success(t('admin.users.create.success'));
      } else {
        toast.error(result.error || t('admin.users.create.error'));
      }
      return result;
    },
    [actions, toast, t]
  );

  const handleExportCSV = useCallback(async () => {
    setExporting(true);
    setExportMenuOpen(false);
    try {
      const res = await adminService.exportUsersCSV();
      const blob =
        res.data instanceof Blob
          ? res.data
          : new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      triggerBlobDownload(blob, 'users-export.csv');
      toast.success(t('admin.users.export.success'));
    } catch {
      toast.error(t('admin.users.export.error'));
    } finally {
      setExporting(false);
    }
  }, [toast, t]);

  const handleExportPDF = useCallback(async () => {
    setExporting(true);
    setExportMenuOpen(false);
    try {
      const res = await adminService.getUsers({ limit: 1000 });
      const data = res.data?.data || res.data;
      const allUsers = data.users || data || [];

      const headers = [
        t('admin.users.name'),
        t('admin.users.email'),
        t('admin.users.role'),
        t('admin.users.status'),
        t('admin.users.verified'),
        t('admin.users.joined'),
      ];

      const rows = allUsers.map(u => [
        u.name || '—',
        u.email || '—',
        u.role || '—',
        u.isActive === false ? t('admin.users.banned') : t('admin.users.active'),
        u.isVerified ? '✓' : '✗',
        u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—',
      ]);

      await generatePDF({
        title: t('admin.users.title'),
        headers,
        rows,
        filename: 'users-export.pdf',
        userInfo: { name: authUser?.name, email: authUser?.email },
      });

      toast.success(t('admin.users.export.success'));
    } catch {
      toast.error(t('admin.users.export.error'));
    } finally {
      setExporting(false);
    }
  }, [toast, t, authUser]);

  // ── Error State ─────────────────────────────────
  if (error && !loading && users.length === 0) {
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
          <h1 className={styles.title}>{t('admin.users.title')}</h1>
          <p className={styles.subtitle}>
            {t('admin.users.subtitle', { count: pagination.total })}
          </p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.exportDropdown} ref={exportRef}>
            <button
              className={styles.exportButton}
              onClick={() => guard(() => setExportMenuOpen(p => !p))}
              disabled={exporting || loading}
              type="button"
            >
              <FiDownload size={16} />
              {t('admin.users.export.button')}
              <FiChevronDown size={14} />
            </button>
            {exportMenuOpen && (
              <div className={styles.exportMenu}>
                <button className={styles.exportMenuItem} onClick={handleExportCSV} type="button">
                  CSV
                </button>
                <button className={styles.exportMenuItem} onClick={handleExportPDF} type="button">
                  PDF
                </button>
              </div>
            )}
          </div>
          <button
            className={styles.createButton}
            onClick={() => guard(() => setCreateOpen(true))}
            type="button"
          >
            <FiUserPlus size={16} />
            {t('admin.users.create.button')}
          </button>
          <button
            className={styles.refreshButton}
            onClick={actions.refresh}
            disabled={loading}
            type="button"
            aria-label={t('admin.users.refresh')}
          >
            <FiRefreshCw size={16} className={loading ? styles.spinning : ''} />
            {t('admin.users.refresh')}
          </button>
        </div>
      </div>

      {/* ── Filters / Search Bar ────────────────── */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <FiSearch size={16} className={styles.searchIcon} />
          <input
            id="users-search"
            name="users-search"
            type="text"
            className={styles.searchInput}
            value={filters.search}
            onChange={e => filters.setSearch(e.target.value)}
            placeholder={t('admin.users.searchPlaceholder')}
            aria-label={t('admin.users.searchPlaceholder')}
          />
        </div>

        <div className={styles.filterGroup}>
          <FilterDropdown
            value={filters.roleFilter}
            onChange={filters.setRoleFilter}
            ariaLabel={t('admin.users.filterRole')}
            placeholder={t('admin.users.allRoles')}
            options={[
              { value: '', label: t('admin.users.allRoles') },
              { value: 'admin', label: t('admin.users.roleAdmin') },
              { value: 'viewer', label: t('admin.users.roleViewer') },
              { value: 'user', label: t('admin.users.roleUser') },
            ]}
          />

          <FilterDropdown
            value={filters.statusFilter}
            onChange={filters.setStatusFilter}
            ariaLabel={t('admin.users.filterStatus')}
            placeholder={t('admin.users.allStatuses')}
            options={[
              { value: '', label: t('admin.users.allStatuses') },
              { value: 'true', label: t('admin.users.active') },
              { value: 'false', label: t('admin.users.banned') },
            ]}
          />

          <FilterDropdown
            value={filters.verifiedFilter}
            onChange={filters.setVerifiedFilter}
            ariaLabel={t('admin.users.filterVerified')}
            placeholder={t('admin.users.allVerified')}
            options={[
              { value: '', label: t('admin.users.allVerified') },
              { value: 'true', label: t('admin.users.verified') },
              { value: 'false', label: t('admin.users.unverifiedLabel') },
            ]}
          />
        </div>
      </div>

      {/* ── Total Count Badge ───────────────────── */}
      <div className={styles.countBadge}>
        <FiUsers size={14} />
        <span>{t('admin.users.totalUsers', { count: pagination.total })}</span>
      </div>

      {/* ── Table ───────────────────────────────── */}
      <AdminUserTable
        users={users}
        pagination={pagination}
        loading={loading}
        sort={filters.sort}
        onSortChange={filters.setSort}
        onPageChange={filters.setPage}
        onViewUser={handleViewUser}
        actionLoading={actionLoading}
      />

      {/* ── Detail Modal ────────────────────────── */}
      <AdminUserDetail
        user={selectedUser}
        isOpen={detailOpen}
        onClose={handleCloseDetail}
        actions={actions}
        actionLoading={actionLoading}
        onSuccess={handleActionSuccess}
        onError={handleActionError}
      />

      {/* ── Create User Modal ───────────────────── */}
      <AdminCreateUser
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateUser}
        loading={actionLoading === 'create'}
      />
    </div>
  );
}
