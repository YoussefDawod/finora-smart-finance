/**
 * @fileoverview Admin Feedbacks Page
 * @description Feedback-Management mit Such-/Filterfunktion,
 *              Statistiken, Tabelle, Publish/Unpublish/Löschen.
 *
 * @module pages/admin/AdminFeedbacksPage
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiSearch,
  FiRefreshCw,
  FiMessageSquare,
  FiStar,
  FiEye,
  FiEyeOff,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiX,
} from 'react-icons/fi';
import { useAdminFeedbacks, useToast, useViewerGuard } from '@/hooks';
import FilterDropdown from '@/components/common/FilterDropdown/FilterDropdown';
import styles from './AdminFeedbacksPage.module.scss';

function StarRating({ rating }) {
  const { t } = useTranslation();
  return (
    <span className={styles.stars} aria-label={t('admin.feedbacks.starsLabel', { rating })}>
      {[1, 2, 3, 4, 5].map(i => (
        <FiStar
          key={i}
          size={14}
          className={i > rating ? styles.starEmpty : undefined}
          fill={i <= rating ? 'currentColor' : 'none'}
        />
      ))}
    </span>
  );
}

function ConfirmDialog({ title, text, onConfirm, onCancel, confirmLabel, cancelLabel }) {
  return (
    <div className={styles.confirmOverlay} onClick={onCancel} role="presentation">
      <div
        className={styles.confirmDialog}
        onClick={e => e.stopPropagation()}
        role="alertdialog"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-text"
      >
        <h3 id="confirm-title" className={styles.confirmTitle}>
          {title}
        </h3>
        <p id="confirm-text" className={styles.confirmText}>
          {text}
        </p>
        <div className={styles.confirmActions}>
          <button type="button" className={styles.confirmCancel} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={styles.confirmDelete} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function FeedbackDetailModal({
  fb,
  onClose,
  onPublish,
  onUnpublish,
  onDelete,
  actionLoading,
  isViewer,
  t,
}) {
  const { i18n } = useTranslation();
  const formatDate = dateStr => {
    if (!dateStr) return '–';
    return new Date(dateStr).toLocaleDateString(i18n.language, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className={styles.confirmOverlay} onClick={onClose} role="presentation">
      <div
        className={styles.detailModal}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-labelledby="detail-title"
      >
        <div className={styles.detailHeader}>
          <h3 id="detail-title" className={styles.confirmTitle}>
            {t('admin.feedbacks.detailTitle')}
          </h3>
          <button
            type="button"
            className={styles.detailClose}
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <FiX size={18} />
          </button>
        </div>

        <div className={styles.detailBody}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>{t('admin.feedbacks.colUser')}</span>
            <div className={styles.userInfo}>
              <span className={styles.userName}>
                {fb.user?.name || fb.displayName || t('common.anonymous')}
              </span>
              {fb.user?.email && <span className={styles.userEmail}>{fb.user.email}</span>}
            </div>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>{t('admin.feedbacks.colRating')}</span>
            <StarRating rating={fb.rating} />
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>{t('admin.feedbacks.colText')}</span>
            <p className={styles.detailText}>{fb.text || t('admin.feedbacks.noText')}</p>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>{t('admin.feedbacks.colConsent')}</span>
            <span
              className={`${styles.badge} ${fb.consentGiven ? styles.badgeConsent : styles.badgeNoConsent}`}
            >
              {fb.consentGiven
                ? t('admin.feedbacks.consentGiven')
                : t('admin.feedbacks.consentNotGiven')}
            </span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>{t('admin.feedbacks.colStatus')}</span>
            <span
              className={`${styles.badge} ${fb.published ? styles.badgePublished : styles.badgeUnpublished}`}
            >
              {fb.published ? t('admin.feedbacks.published') : t('admin.feedbacks.unpublished')}
            </span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>{t('admin.feedbacks.colDate')}</span>
            <span>{formatDate(fb.createdAt)}</span>
          </div>
        </div>

        {!isViewer && (
          <div className={styles.detailActions}>
            {fb.published ? (
              <button
                type="button"
                className={styles.detailBtn}
                onClick={() => onUnpublish(fb._id)}
                disabled={actionLoading === fb._id}
              >
                <FiEyeOff size={14} />
                {t('admin.feedbacks.unpublish')}
              </button>
            ) : (
              <button
                type="button"
                className={styles.detailBtn}
                onClick={() => onPublish(fb._id)}
                disabled={actionLoading === fb._id || !fb.consentGiven || fb.rating < 4}
                title={
                  !fb.consentGiven
                    ? t('admin.feedbacks.noConsentHint')
                    : fb.rating < 4
                      ? t('admin.feedbacks.lowRatingHint')
                      : ''
                }
              >
                <FiEye size={14} />
                {t('admin.feedbacks.publish')}
              </button>
            )}
            <button
              type="button"
              className={`${styles.detailBtn} ${styles.detailBtnDanger}`}
              onClick={() => onDelete(fb)}
              disabled={actionLoading === fb._id}
            >
              <FiTrash2 size={14} />
              {t('admin.feedbacks.delete')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminFeedbacksPage() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { isViewer } = useViewerGuard();
  const { feedbacks, stats, pagination, loading, error, actionLoading, filters, actions } =
    useAdminFeedbacks();

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [detailFeedback, setDetailFeedback] = useState(null);

  // ── Handlers ────────────────────────────────────

  const handlePublish = useCallback(
    async id => {
      const result = await actions.publishFeedback(id);
      if (result.success) {
        toast.success(t('admin.feedbacks.publishSuccess'));
      } else {
        toast.error(result.error || t('admin.feedbacks.publishError'));
      }
    },
    [actions, toast, t]
  );

  const handleUnpublish = useCallback(
    async id => {
      const result = await actions.unpublishFeedback(id);
      if (result.success) {
        toast.success(t('admin.feedbacks.unpublishSuccess'));
      } else {
        toast.error(result.error || t('admin.feedbacks.unpublishError'));
      }
    },
    [actions, toast, t]
  );

  const handleDelete = useCallback(
    async id => {
      const result = await actions.deleteFeedback(id);
      if (result.success) {
        toast.success(t('admin.feedbacks.deleteSuccess'));
      } else {
        toast.error(result.error || t('admin.feedbacks.deleteError'));
      }
      setConfirmDelete(null);
    },
    [actions, toast, t]
  );

  const formatDate = dateStr => {
    if (!dateStr) return '–';
    return new Date(dateStr).toLocaleDateString(i18n.language, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // ── Error State ─────────────────────────────────
  if (error && !loading && feedbacks.length === 0) {
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

  const from = feedbacks.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const to = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className={styles.page}>
      {/* ── Header ──────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin.feedbacks.title')}</h1>
          <p className={styles.subtitle}>
            {t('admin.feedbacks.subtitle', { count: pagination.total })}
          </p>
        </div>
        <button
          className={styles.refreshButton}
          onClick={actions.refresh}
          disabled={loading}
          type="button"
          aria-label={t('admin.feedbacks.refresh')}
        >
          <FiRefreshCw size={16} className={loading ? styles.spinning : ''} />
          {t('admin.feedbacks.refresh')}
        </button>
      </div>

      {/* ── Stats ───────────────────────────────── */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>{t('admin.feedbacks.statTotal')}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.published}</span>
            <span className={styles.statLabel}>{t('admin.feedbacks.statPublished')}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.avgRating || '–'}</span>
            <span className={styles.statLabel}>{t('admin.feedbacks.statAvgRating')}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.publishedRate}%</span>
            <span className={styles.statLabel}>{t('admin.feedbacks.statPublishRate')}</span>
          </div>
        </div>
      )}

      {/* ── Filters / Search Bar ────────────────── */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <FiSearch size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            value={filters.search}
            onChange={e => filters.setSearch(e.target.value)}
            placeholder={t('admin.feedbacks.searchPlaceholder')}
            aria-label={t('admin.feedbacks.searchPlaceholder')}
          />
        </div>

        <div className={styles.filterGroup}>
          <FilterDropdown
            value={filters.ratingFilter}
            onChange={filters.setRatingFilter}
            ariaLabel={t('admin.feedbacks.filterRating')}
            placeholder={t('admin.feedbacks.allRatings')}
            options={[
              { value: '', label: t('admin.feedbacks.allRatings') },
              { value: 'high', label: t('admin.feedbacks.highRating') },
              { value: 'low', label: t('admin.feedbacks.lowRating') },
              { value: '5', label: '★★★★★ (5)' },
              { value: '4', label: '★★★★ (4)' },
              { value: '3', label: '★★★ (3)' },
              { value: '2', label: '★★ (2)' },
              { value: '1', label: '★ (1)' },
            ]}
          />

          <FilterDropdown
            value={filters.publishedFilter}
            onChange={filters.setPublishedFilter}
            ariaLabel={t('admin.feedbacks.filterPublished')}
            placeholder={t('admin.feedbacks.allStatuses')}
            options={[
              { value: '', label: t('admin.feedbacks.allStatuses') },
              { value: 'true', label: t('admin.feedbacks.published') },
              { value: 'false', label: t('admin.feedbacks.unpublished') },
            ]}
          />

          <FilterDropdown
            value={filters.consentFilter}
            onChange={filters.setConsentFilter}
            ariaLabel={t('admin.feedbacks.filterConsent')}
            placeholder={t('admin.feedbacks.allConsent')}
            options={[
              { value: '', label: t('admin.feedbacks.allConsent') },
              { value: 'true', label: t('admin.feedbacks.consentGiven') },
              { value: 'false', label: t('admin.feedbacks.consentNotGiven') },
            ]}
          />
        </div>
      </div>

      {/* ── Count Badge ─────────────────────────── */}
      <div className={styles.countBadge}>
        <FiMessageSquare size={14} />
        <span>{t('admin.feedbacks.totalFeedbacks', { count: pagination.total })}</span>
      </div>

      {/* ── Table ───────────────────────────────── */}
      {loading && feedbacks.length === 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('admin.feedbacks.colUser')}</th>
                <th>{t('admin.feedbacks.colRating')}</th>
                <th>{t('admin.feedbacks.colText')}</th>
                <th>{t('admin.feedbacks.colConsent')}</th>
                <th>{t('admin.feedbacks.colStatus')}</th>
                <th>{t('admin.feedbacks.colDate')}</th>
                <th>{t('admin.feedbacks.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className={styles.skeletonRow}>
                  {[...Array(7)].map((__, j) => (
                    <td key={j}>
                      <div className={styles.skeletonCell} style={{ width: `${60 + j * 10}%` }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className={styles.emptyState}>
          <FiMessageSquare size={48} className={styles.emptyIcon} />
          <p className={styles.emptyText}>{t('admin.feedbacks.noResults')}</p>
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('admin.feedbacks.colUser')}</th>
                  <th>{t('admin.feedbacks.colRating')}</th>
                  <th>{t('admin.feedbacks.colText')}</th>
                  <th>{t('admin.feedbacks.colConsent')}</th>
                  <th>{t('admin.feedbacks.colStatus')}</th>
                  <th>{t('admin.feedbacks.colDate')}</th>
                  {!isViewer && <th>{t('admin.feedbacks.colActions')}</th>}
                </tr>
              </thead>
              <tbody>
                {feedbacks.map(fb => (
                  <tr key={fb._id}>
                    <td>
                      <div className={styles.userInfo}>
                        <span className={styles.userName}>
                          {fb.user?.name || fb.displayName || t('common.anonymous')}
                        </span>
                        {fb.user?.email && (
                          <span className={styles.userEmail}>{fb.user.email}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <StarRating rating={fb.rating} />
                    </td>
                    <td>
                      <button
                        type="button"
                        className={fb.text ? styles.feedbackTextBtn : styles.feedbackTextEmpty}
                        onClick={() => fb.text && setDetailFeedback(fb)}
                        title={fb.text || undefined}
                      >
                        {fb.text || t('admin.feedbacks.noText')}
                      </button>
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${fb.consentGiven ? styles.badgeConsent : styles.badgeNoConsent}`}
                      >
                        {fb.consentGiven
                          ? t('admin.feedbacks.consentGiven')
                          : t('admin.feedbacks.consentNotGiven')}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${fb.published ? styles.badgePublished : styles.badgeUnpublished}`}
                      >
                        {fb.published
                          ? t('admin.feedbacks.published')
                          : t('admin.feedbacks.unpublished')}
                      </span>
                    </td>
                    <td>{formatDate(fb.createdAt)}</td>
                    {!isViewer && (
                      <td>
                        <div className={styles.actionGroup}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => setDetailFeedback(fb)}
                            aria-label={t('admin.feedbacks.viewDetails')}
                            title={t('admin.feedbacks.viewDetails')}
                          >
                            <FiMessageSquare size={14} />
                          </button>
                          {fb.published ? (
                            <button
                              type="button"
                              className={styles.actionBtn}
                              onClick={() => handleUnpublish(fb._id)}
                              disabled={actionLoading === fb._id}
                              aria-label={t('admin.feedbacks.unpublish')}
                              title={t('admin.feedbacks.unpublish')}
                            >
                              <FiEyeOff size={14} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={styles.actionBtn}
                              onClick={() => handlePublish(fb._id)}
                              disabled={
                                actionLoading === fb._id || !fb.consentGiven || fb.rating < 4
                              }
                              aria-label={t('admin.feedbacks.publish')}
                              title={
                                !fb.consentGiven
                                  ? t('admin.feedbacks.noConsentHint')
                                  : fb.rating < 4
                                    ? t('admin.feedbacks.lowRatingHint')
                                    : t('admin.feedbacks.publish')
                              }
                            >
                              <FiEye size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            onClick={() => setConfirmDelete(fb)}
                            disabled={actionLoading === fb._id}
                            aria-label={t('admin.feedbacks.delete')}
                            title={t('admin.feedbacks.delete')}
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile Card List ────────────────────── */}
          <div className={styles.cardList}>
            {feedbacks.map(fb => (
              <div
                key={fb._id}
                className={styles.feedbackCard}
                onClick={() => setDetailFeedback(fb)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setDetailFeedback(fb)}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>
                      {fb.user?.name || fb.displayName || t('common.anonymous')}
                    </span>
                    {fb.user?.email && <span className={styles.userEmail}>{fb.user.email}</span>}
                  </div>
                  <StarRating rating={fb.rating} />
                </div>
                {fb.text && <p className={styles.cardText}>{fb.text}</p>}
                <div className={styles.cardFooter}>
                  <div className={styles.cardBadges}>
                    <span
                      className={`${styles.badge} ${fb.published ? styles.badgePublished : styles.badgeUnpublished}`}
                    >
                      {fb.published
                        ? t('admin.feedbacks.published')
                        : t('admin.feedbacks.unpublished')}
                    </span>
                    <span
                      className={`${styles.badge} ${fb.consentGiven ? styles.badgeConsent : styles.badgeNoConsent}`}
                    >
                      {fb.consentGiven
                        ? t('admin.feedbacks.consentGiven')
                        : t('admin.feedbacks.consentNotGiven')}
                    </span>
                  </div>
                  <span className={styles.cardDate}>{formatDate(fb.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Pagination ─────────────────────────── */}
          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              {t('admin.feedbacks.showing', { from, to, total: pagination.total })}
            </span>
            <div className={styles.paginationButtons}>
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => filters.setPage(pagination.page - 1)}
                disabled={pagination.page <= 1}
                aria-label={t('admin.feedbacks.prevPage')}
              >
                <FiChevronLeft size={14} />
              </button>
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => filters.setPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                aria-label={t('admin.feedbacks.nextPage')}
              >
                <FiChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Confirm Delete Dialog ──────────────────── */}
      {confirmDelete && (
        <ConfirmDialog
          title={t('admin.feedbacks.confirmDelete')}
          text={t('admin.feedbacks.confirmDeleteText', {
            user: confirmDelete.user?.name || confirmDelete.displayName || t('common.anonymous'),
            rating: confirmDelete.rating,
          })}
          onConfirm={() => handleDelete(confirmDelete._id)}
          onCancel={() => setConfirmDelete(null)}
          confirmLabel={t('admin.feedbacks.delete')}
          cancelLabel={t('common.cancel')}
        />
      )}

      {/* ── Feedback Detail Modal ──────────────────── */}
      {detailFeedback && (
        <FeedbackDetailModal
          fb={detailFeedback}
          onClose={() => setDetailFeedback(null)}
          onPublish={id => {
            handlePublish(id);
            setDetailFeedback(null);
          }}
          onUnpublish={id => {
            handleUnpublish(id);
            setDetailFeedback(null);
          }}
          onDelete={fb => {
            setDetailFeedback(null);
            setConfirmDelete(fb);
          }}
          actionLoading={actionLoading}
          isViewer={isViewer}
          t={t}
        />
      )}
    </div>
  );
}
