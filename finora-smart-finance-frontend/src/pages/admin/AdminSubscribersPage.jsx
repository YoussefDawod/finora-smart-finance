/**
 * @fileoverview Admin Subscribers Page
 * @description Newsletter-Abonnenten-Übersicht mit Such-/Filterfunktion,
 *              sortierbarer Tabelle, Pagination und Lösch-Aktion.
 *
 * Komponente:  AdminSubscriberTable
 * Hook:        useAdminSubscribers (Laden, Filter, Sortierung, Aktionen)
 *
 * @module pages/admin/AdminSubscribersPage
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSearch, FiRefreshCw, FiMail } from 'react-icons/fi';
import { useAdminSubscribers, useToast } from '@/hooks';
import { AdminSubscriberTable, AdminSubscriberDetail } from '@/components/admin';
import FilterDropdown from '@/components/common/FilterDropdown/FilterDropdown';
import { SUPPORTED_LANGUAGES } from '@/constants';
import styles from './AdminSubscribersPage.module.scss';

export default function AdminSubscribersPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { subscribers, pagination, loading, error, actionLoading, filters, actions } =
    useAdminSubscribers();

  // ── Detail Modal State ──────────────────────────
  const [selectedSubscriber, setSelectedSubscriber] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleViewSubscriber = useCallback(sub => {
    setSelectedSubscriber(sub);
    setDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
    setSelectedSubscriber(null);
  }, []);

  // ── Delete handler ──────────────────────────────
  const handleDelete = useCallback(
    async id => {
      try {
        await actions.deleteSubscriber(id);
        toast.success(t('admin.subscribers.deleteSuccess'));
      } catch {
        toast.error(t('admin.subscribers.deleteError'));
      }
    },
    [actions, toast, t]
  );

  // ── Error State ─────────────────────────────────
  if (error && !loading && subscribers.length === 0) {
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
          <h1 className={styles.title}>{t('admin.subscribers.title')}</h1>
          <p className={styles.subtitle}>
            {t('admin.subscribers.subtitle', { count: pagination.total })}
          </p>
        </div>
        <button
          className={styles.refreshButton}
          onClick={actions.refresh}
          disabled={loading}
          type="button"
          aria-label={t('admin.subscribers.refresh')}
        >
          <FiRefreshCw size={16} className={loading ? styles.spinning : ''} />
          {t('admin.subscribers.refresh')}
        </button>
      </div>

      {/* ── Filters / Search Bar ────────────────── */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <FiSearch size={16} className={styles.searchIcon} />
          <input
            id="subscribers-search"
            name="subscribers-search"
            type="text"
            className={styles.searchInput}
            value={filters.search}
            onChange={e => filters.setSearch(e.target.value)}
            placeholder={t('admin.subscribers.searchPlaceholder')}
            aria-label={t('admin.subscribers.searchPlaceholder')}
          />
        </div>

        <div className={styles.filterGroup}>
          <FilterDropdown
            value={filters.confirmedFilter}
            onChange={filters.setConfirmedFilter}
            ariaLabel={t('admin.subscribers.filterStatus')}
            placeholder={t('admin.subscribers.allStatuses')}
            options={[
              { value: '', label: t('admin.subscribers.allStatuses') },
              { value: 'true', label: t('admin.subscribers.confirmed') },
              { value: 'false', label: t('admin.subscribers.pending') },
            ]}
          />

          <FilterDropdown
            value={filters.languageFilter}
            onChange={filters.setLanguageFilter}
            ariaLabel={t('admin.subscribers.filterLanguage')}
            placeholder={t('admin.subscribers.allLanguages')}
            options={[
              { value: '', label: t('admin.subscribers.allLanguages') },
              ...SUPPORTED_LANGUAGES.map(lang => ({
                value: lang,
                label: t(`admin.subscribers.lang_${lang}`, lang.toUpperCase()),
              })),
            ]}
          />
        </div>
      </div>

      {/* ── Total Count Badge ───────────────────── */}
      <div className={styles.countBadge}>
        <FiMail size={14} />
        <span>{t('admin.subscribers.totalSubscribers', { count: pagination.total })}</span>
      </div>

      {/* ── Table ───────────────────────────────── */}
      <AdminSubscriberTable
        subscribers={subscribers}
        pagination={pagination}
        loading={loading}
        sort={filters.sort}
        onSortChange={filters.setSort}
        onPageChange={filters.setPage}
        onDelete={handleDelete}
        onViewSubscriber={handleViewSubscriber}
        actionLoading={actionLoading}
      />

      {/* ── Detail Modal ────────────────────────── */}
      <AdminSubscriberDetail
        subscriber={selectedSubscriber}
        isOpen={detailOpen}
        onClose={handleCloseDetail}
        onDelete={handleDelete}
        actionLoading={actionLoading}
        onSuccess={msg => toast.success(msg)}
        onError={msg => toast.error(msg)}
      />
    </div>
  );
}
