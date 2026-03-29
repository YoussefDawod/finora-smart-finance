/**
 * @fileoverview Admin Campaigns Page
 * @description Newsletter-Kampagnen-Übersicht mit Such-/Filterfunktion,
 *              sortierbarer Tabelle, Pagination, Stats und CRUD-Aktionen.
 *
 * @module pages/admin/AdminCampaignsPage
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiRefreshCw,
  FiSend,
  FiPlus,
  FiArrowUp,
  FiArrowDown,
  FiTrash2,
  FiEdit2,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiRotateCcw,
  FiAlertTriangle,
} from 'react-icons/fi';
import { useAdminCampaigns, useToast } from '@/hooks';
import { useViewerGuard } from '@/hooks/useViewerGuard';
import { AdminCampaignDetail } from '@/components/admin';
import Modal from '@/components/common/Modal/Modal';
import FilterDropdown from '@/components/common/FilterDropdown/FilterDropdown';
import { AdminStatCard } from '@/components/admin';
import { SkeletonTableRow } from '@/components/common/Skeleton';
import { getSortDirection, generatePageNumbers } from '@/utils/adminTableHelpers';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from '@/constants';
import styles from './AdminCampaignsPage.module.scss';

// ── Sortierbare Spalten ───────────────────────────
const SORT_FIELDS = {
  subject: 'subject',
  createdAt: 'createdAt',
  sentAt: 'sentAt',
  status: 'status',
  recipientCount: 'recipientCount',
};

// ── Status → Badge-Klasse Mapping ─────────────────
const STATUS_STYLES = {
  draft: 'draft',
  sending: 'sending',
  sent: 'sent',
  failed: 'failed',
};

export default function AdminCampaignsPage() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const { campaigns, stats, pagination, loading, error, actionLoading, filters, actions } =
    useAdminCampaigns();
  const { guard } = useViewerGuard();

  // ── Detail Modal State ──────────────────────────
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleViewCampaign = useCallback(campaign => {
    setSelectedCampaign(campaign);
    setDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
    setSelectedCampaign(null);
  }, []);

  // ── Delete handler ──────────────────────────────
  const handleDelete = useCallback(
    async id => {
      const result = await actions.deleteCampaign(id);
      if (result.success) {
        toast.success(t('admin.campaigns.deleteSuccess'));
        setDeleteConfirm(null);
      } else {
        toast.error(result.error || t('admin.campaigns.deleteError'));
      }
    },
    [actions, toast, t]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm) return;
    const id = deleteConfirm._id || deleteConfirm.id;
    await handleDelete(id);
  }, [deleteConfirm, handleDelete]);

  // ── Reset All handler ───────────────────────
  const handleResetAll = useCallback(async () => {
    setResetting(true);
    try {
      const result = await actions.resetAllCampaigns();
      if (result?.success !== false) {
        toast.success(t('admin.campaigns.resetSuccess'));
      } else {
        toast.error(result?.error || t('admin.campaigns.resetError'));
      }
    } catch {
      toast.error(t('admin.campaigns.resetError'));
    } finally {
      setResetting(false);
      setResetConfirmOpen(false);
    }
  }, [actions, toast, t]);

  // ── Send handler ────────────────────────────────
  const handleSend = useCallback(
    async id => {
      const result = await actions.sendCampaign(id);
      if (result.success) {
        const data = result.data;
        toast.success(
          t('admin.campaigns.sendSuccess', {
            success: data?.successCount ?? 0,
            total: data?.recipientCount ?? 0,
          })
        );
      } else {
        if (result.code === 'NO_RECIPIENTS') {
          toast.error(t('admin.campaigns.noConfirmedRecipients'));
        } else {
          toast.error(result.error || t('admin.campaigns.sendError'));
        }
      }
    },
    [actions, toast, t]
  );

  // ── Sort Handler ────────────────────────────────
  const handleSort = useCallback(
    field => {
      if (!SORT_FIELDS[field]) return;
      const currentField = filters.sort.replace(/^-/, '');
      const isDesc = filters.sort.startsWith('-');
      if (currentField === field) {
        filters.setSort(isDesc ? field : `-${field}`);
      } else {
        filters.setSort(`-${field}`);
      }
    },
    [filters]
  );

  const getSortIcon = useCallback(
    field => {
      const currentField = filters.sort.replace(/^-/, '');
      if (currentField !== field) return null;
      return filters.sort.startsWith('-') ? (
        <FiArrowDown size={12} className={styles.sortIcon} />
      ) : (
        <FiArrowUp size={12} className={styles.sortIcon} />
      );
    },
    [filters.sort]
  );

  // ── Formatierung ────────────────────────────────
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

  // ── Stats Berechnung ────────────────────────────
  const statSent = stats?.statusBreakdown?.find(s => s._id === 'sent')?.count || 0;
  const statDraft = stats?.statusBreakdown?.find(s => s._id === 'draft')?.count || 0;
  const statFailed = stats?.statusBreakdown?.find(s => s._id === 'failed')?.count || 0;

  // ── Error State ─────────────────────────────────
  if (error && !loading && campaigns.length === 0) {
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

  const { page = 1, pages = 1 } = pagination;
  const deleteConfirmId = deleteConfirm?._id || deleteConfirm?.id;

  return (
    <div className={styles.page}>
      {/* ── Header ──────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin.campaigns.title')}</h1>
          <p className={styles.subtitle}>
            {t('admin.campaigns.subtitle', { count: pagination.total })}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.refreshButton}
            onClick={actions.refresh}
            disabled={loading}
            type="button"
            aria-label={t('admin.campaigns.refresh')}
          >
            <FiRefreshCw size={16} className={loading ? styles.spinning : ''} />
            <span className={styles.buttonLabel}>{t('admin.campaigns.refresh')}</span>
          </button>
          <button
            className={styles.resetButton}
            onClick={() => guard(() => setResetConfirmOpen(true))}
            type="button"
            title={t('admin.campaigns.resetAll')}
          >
            <FiRotateCcw size={16} />
            <span className={styles.buttonLabel}>{t('admin.campaigns.resetAll')}</span>
          </button>
          <button
            className={styles.createButton}
            onClick={() => guard(() => navigate('/admin/campaigns/new'))}
            type="button"
          >
            <FiPlus size={16} />
            <span className={styles.buttonLabel}>{t('admin.campaigns.create')}</span>
          </button>
        </div>
      </div>

      {/* ── Stats Cards ─────────────────────────── */}
      <div className={styles.statsGrid}>
        <AdminStatCard
          label={t('admin.campaigns.statTotal')}
          value={stats?.totalCount ?? pagination.total}
          icon={FiSend}
        />
        <AdminStatCard
          label={t('admin.campaigns.statSent')}
          value={statSent}
          icon={FiSend}
          variant="success"
        />
        <AdminStatCard
          label={t('admin.campaigns.statDrafts')}
          value={statDraft}
          icon={FiEdit2}
          variant="warning"
        />
        <AdminStatCard
          label={t('admin.campaigns.statFailed')}
          value={statFailed}
          icon={FiSend}
          variant="error"
        />
      </div>

      {/* ── Filters / Search Bar ────────────────── */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <FiSearch size={16} className={styles.searchIcon} />
          <input
            id="campaigns-search"
            name="campaigns-search"
            type="text"
            className={styles.searchInput}
            value={filters.search}
            onChange={e => filters.setSearch(e.target.value)}
            placeholder={t('admin.campaigns.searchPlaceholder')}
            aria-label={t('admin.campaigns.searchPlaceholder')}
          />
        </div>

        <div className={styles.filterGroup}>
          <FilterDropdown
            value={filters.statusFilter}
            onChange={filters.setStatusFilter}
            ariaLabel={t('admin.campaigns.filterStatus')}
            placeholder={t('admin.campaigns.allStatuses')}
            options={[
              { value: '', label: t('admin.campaigns.allStatuses') },
              { value: 'draft', label: t('admin.campaigns.draft') },
              { value: 'sending', label: t('admin.campaigns.sending') },
              { value: 'sent', label: t('admin.campaigns.sent') },
              { value: 'failed', label: t('admin.campaigns.failed') },
            ]}
          />
          <FilterDropdown
            value={filters.languageFilter}
            onChange={filters.setLanguageFilter}
            ariaLabel={t('admin.campaigns.filterLanguage')}
            placeholder={t('admin.campaigns.allLanguages')}
            options={[
              { value: '', label: t('admin.campaigns.allLanguages') },
              ...SUPPORTED_LANGUAGES.map(lang => ({
                value: lang,
                label: LANGUAGE_LABELS[lang] || lang.toUpperCase(),
              })),
            ]}
          />
        </div>
      </div>

      {/* ── Delete Confirmation Banner ──────────── */}
      {deleteConfirm && (
        <div className={styles.deleteConfirm} role="alert">
          <span>{t('admin.campaigns.confirmDeleteText', { subject: deleteConfirm.subject })}</span>
          <div className={styles.confirmButtons}>
            <button
              className={styles.cancelButton}
              onClick={() => setDeleteConfirm(null)}
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
              {t('admin.campaigns.delete')}
            </button>
          </div>
        </div>
      )}

      {/* ── Count Badge ─────────────────────────── */}
      <div className={styles.countBadge}>
        <FiSend size={14} />
        <span>{t('admin.campaigns.totalCampaigns', { count: pagination.total })}</span>
      </div>

      {/* ── Table ───────────────────────────────── */}
      {loading && campaigns.length === 0 ? (
        <div className={styles.tableWrapper}>
          <SkeletonTableRow columns={5} hasIcon count={6} density="normal" />
        </div>
      ) : !loading && campaigns.length === 0 ? (
        <div className={styles.emptyState}>
          <FiSend size={40} />
          <p>{t('admin.campaigns.noResults')}</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <div className={styles.tableWrapper}>
            <table className={styles.table} role="table">
              <thead>
                <tr>
                  <th
                    className={styles.sortable}
                    onClick={() => handleSort('subject')}
                    aria-sort={getSortDirection('subject', filters.sort)}
                  >
                    {t('admin.campaigns.subject')} {getSortIcon('subject')}
                  </th>
                  <th
                    className={styles.sortable}
                    onClick={() => handleSort('status')}
                    aria-sort={getSortDirection('status', filters.sort)}
                  >
                    {t('admin.campaigns.status')} {getSortIcon('status')}
                  </th>
                  <th>{t('admin.campaigns.language')}</th>
                  <th
                    className={styles.sortable}
                    onClick={() => handleSort('recipientCount')}
                    aria-sort={getSortDirection('recipientCount', filters.sort)}
                  >
                    {t('admin.campaigns.recipients')} {getSortIcon('recipientCount')}
                  </th>
                  <th
                    className={styles.sortable}
                    onClick={() => handleSort('createdAt')}
                    aria-sort={getSortDirection('createdAt', filters.sort)}
                  >
                    {t('admin.campaigns.createdAt')} {getSortIcon('createdAt')}
                  </th>
                  <th>{t('admin.campaigns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(campaign => {
                  const cId = campaign._id || campaign.id;
                  const isDraft = campaign.status === 'draft';
                  return (
                    <tr key={cId} className={styles.row}>
                      <td className={styles.subjectCell} data-label={t('admin.campaigns.subject')}>
                        {campaign.subject}
                      </td>
                      <td data-label={t('admin.campaigns.status')}>
                        <span
                          className={`${styles.statusBadge} ${styles[STATUS_STYLES[campaign.status]] || ''}`}
                        >
                          {t(`admin.campaigns.${campaign.status}`)}
                        </span>
                      </td>
                      <td data-label={t('admin.campaigns.language')}>
                        <span className={styles.langBadge}>
                          {LANGUAGE_LABELS[campaign.language] || campaign.language || '—'}
                        </span>
                      </td>
                      <td data-label={t('admin.campaigns.recipients')}>
                        {campaign.status === 'sent' || campaign.status === 'failed'
                          ? `${campaign.successCount || 0}/${campaign.recipientCount || 0}`
                          : '—'}
                      </td>
                      <td className={styles.dateCell} data-label={t('admin.campaigns.createdAt')}>
                        {formatDate(campaign.sentAt || campaign.createdAt)}
                      </td>
                      <td className={styles.actionsCell} data-label={t('admin.campaigns.actions')}>
                        <button
                          className={styles.viewButton}
                          onClick={() => handleViewCampaign(campaign)}
                          title={t('admin.campaigns.detail.view')}
                          type="button"
                          aria-label={`${t('admin.campaigns.detail.view')} ${campaign.subject}`}
                        >
                          <FiEye size={16} />
                        </button>
                        {isDraft && (
                          <>
                            <button
                              className={styles.editButton}
                              onClick={() => guard(() => navigate(`/admin/campaigns/${cId}/edit`))}
                              title={t('admin.campaigns.editCampaign')}
                              type="button"
                              aria-label={`${t('admin.campaigns.editCampaign')} ${campaign.subject}`}
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              className={styles.sendButton}
                              onClick={() => guard(() => handleSend(cId))}
                              disabled={actionLoading === cId}
                              title={t('admin.campaigns.send')}
                              type="button"
                              aria-label={`${t('admin.campaigns.send')} ${campaign.subject}`}
                            >
                              {actionLoading === cId ? (
                                <FiRefreshCw size={16} className={styles.spinning} />
                              ) : (
                                <FiSend size={16} />
                              )}
                            </button>
                          </>
                        )}
                        {campaign.status !== 'sending' && (
                          <button
                            className={styles.deleteButton}
                            onClick={() => guard(() => setDeleteConfirm(campaign))}
                            disabled={actionLoading === cId}
                            title={t('admin.campaigns.delete')}
                            type="button"
                            aria-label={`${t('admin.campaigns.delete')} ${campaign.subject}`}
                          >
                            <FiTrash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ────────────────────────── */}
          {pages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageButton}
                onClick={() => filters.setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                type="button"
                aria-label={t('admin.campaigns.prevPage')}
              >
                <FiChevronLeft size={16} />
              </button>
              {generatePageNumbers(page, pages).map((p, idx) =>
                p === '...' ? (
                  <span key={`dots-${idx}`} className={styles.pageDots}>
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    className={`${styles.pageButton} ${p === page ? styles.activePage : ''}`}
                    onClick={() => filters.setPage(p)}
                    type="button"
                  >
                    {p}
                  </button>
                )
              )}
              <button
                className={styles.pageButton}
                onClick={() => filters.setPage(Math.min(pages, page + 1))}
                disabled={page >= pages}
                type="button"
                aria-label={t('admin.campaigns.nextPage')}
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Reset All Confirmation Modal ─────── */}
      <Modal
        isOpen={resetConfirmOpen}
        onClose={() => !resetting && setResetConfirmOpen(false)}
        title={t('admin.campaigns.resetAll')}
        size="small"
      >
        <div className={styles.confirmView}>
          <div className={styles.confirmIcon}>
            <FiAlertTriangle size={28} />
          </div>
          <p className={styles.confirmText}>{t('admin.campaigns.resetConfirmText')}</p>
          <div className={styles.confirmActions}>
            <button
              className={styles.cancelButton}
              onClick={() => setResetConfirmOpen(false)}
              disabled={resetting}
              type="button"
            >
              {t('common.cancel')}
            </button>
            <button
              className={styles.dangerButton}
              onClick={handleResetAll}
              disabled={resetting}
              type="button"
            >
              {resetting ? (
                <FiRefreshCw size={14} className={styles.spinning} />
              ) : (
                <FiRotateCcw size={14} />
              )}
              {t('admin.campaigns.resetAll')}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Detail Modal ────────────────────────── */}
      <AdminCampaignDetail
        campaign={selectedCampaign}
        isOpen={detailOpen}
        onClose={handleCloseDetail}
        onDelete={handleDelete}
        onSend={handleSend}
        onEdit={id => navigate(`/admin/campaigns/${id}/edit`)}
        actionLoading={actionLoading}
        onSuccess={msg => toast.success(msg)}
        onError={msg => toast.error(msg)}
      />
    </div>
  );
}
