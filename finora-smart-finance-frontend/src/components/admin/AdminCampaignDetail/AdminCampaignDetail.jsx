/**
 * @fileoverview AdminCampaignDetail – Kampagnen-Detail-Modal
 * @description Zeigt detaillierte Campaign-Informationen mit Versand-Statistiken
 *              und kontextabhängigen Aktionen (Edit/Delete/Send für Drafts).
 *
 * @module components/admin/AdminCampaignDetail
 */

import { useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import SensitiveData from '@/components/ui/SensitiveData/SensitiveData';
import {
  FiSend,
  FiGlobe,
  FiCalendar,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiUser,
  FiTrash2,
  FiEdit2,
  FiRefreshCw,
  FiUsers,
  FiXCircle,
} from 'react-icons/fi';
import Modal from '@/components/common/Modal/Modal';
import { LANGUAGE_LABELS } from '@/constants';
import styles from './AdminCampaignDetail.module.scss';

const VIEW = {
  DETAILS: 'details',
  DELETE: 'delete',
};

const STATUS_CONFIG = {
  draft: { icon: FiClock, style: 'draft', key: 'draft' },
  sending: { icon: FiRefreshCw, style: 'sending', key: 'sending' },
  sent: { icon: FiCheckCircle, style: 'sent', key: 'sent' },
  failed: { icon: FiXCircle, style: 'failed', key: 'failed' },
};

/**
 * AdminCampaignDetail Component
 */
function AdminCampaignDetail({
  campaign,
  isOpen,
  onClose,
  onDelete,
  onSend,
  onEdit,
  actionLoading = null,
  onSuccess,
  onError,
}) {
  const { t, i18n } = useTranslation();
  const { isViewer } = useAuth();
  const [view, setView] = useState(VIEW.DETAILS);

  const campaignId = campaign?._id || campaign?.id;
  const isBusy = actionLoading === campaignId;
  const isDraft = campaign?.status === 'draft';
  const isSent = campaign?.status === 'sent' || campaign?.status === 'failed';

  const handleClose = useCallback(() => {
    setView(VIEW.DETAILS);
    onClose?.();
  }, [onClose]);

  const handleDelete = useCallback(async () => {
    try {
      await onDelete?.(campaignId);
      onSuccess?.(t('admin.campaigns.deleteSuccess'));
      handleClose();
    } catch {
      onError?.(t('admin.campaigns.deleteError'));
    }
  }, [onDelete, campaignId, onSuccess, onError, t, handleClose]);

  const handleSend = useCallback(async () => {
    try {
      const result = await onSend?.(campaignId);
      if (result?.success === false) {
        if (result.code === 'NO_RECIPIENTS') {
          onError?.(t('admin.campaigns.noConfirmedRecipients'));
        } else {
          onError?.(result.error || t('admin.campaigns.sendError'));
        }
        // Modal offen lassen damit Fehlermeldung sichtbar ist
      } else {
        handleClose();
      }
    } catch {
      onError?.(t('admin.campaigns.sendError'));
    }
  }, [onSend, campaignId, onError, t, handleClose]);

  if (!campaign) return null;

  const formatDateTime = dateStr => {
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
  };

  const statusCfg = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
  const StatusIcon = statusCfg.icon;

  // ── Delete Confirm View ─────────────────────────
  const renderDeleteConfirm = () => (
    <div className={styles.confirmView}>
      <div className={`${styles.confirmIcon} ${styles.danger}`}>
        <FiAlertTriangle size={28} />
      </div>
      <h3>{t('admin.campaigns.confirmDelete')}</h3>
      <p className={styles.confirmText}>
        {t('admin.campaigns.confirmDeleteText', { subject: campaign.subject })}
      </p>
      <div className={styles.confirmActions}>
        <button
          className={styles.cancelButton}
          onClick={() => setView(VIEW.DETAILS)}
          disabled={isBusy}
          type="button"
        >
          {t('common.cancel')}
        </button>
        <button
          className={styles.dangerButton}
          onClick={handleDelete}
          disabled={isBusy}
          type="button"
        >
          {isBusy ? <FiRefreshCw size={14} className={styles.spinning} /> : <FiTrash2 size={14} />}
          {t('admin.campaigns.delete')}
        </button>
      </div>
    </div>
  );

  // ── Details View ────────────────────────────────
  const renderDetails = () => (
    <>
      {/* Campaign Header */}
      <div className={styles.campaignHeader}>
        <div className={styles.headerAvatar}>
          <FiSend size={24} />
        </div>
        <div className={styles.headerInfo}>
          <h3 className={styles.campaignSubject}>{campaign.subject}</h3>
          <div className={styles.headerBadges}>
            <span className={`${styles.badge} ${styles[statusCfg.style]}`}>
              <StatusIcon size={10} />
              {t(`admin.campaigns.${statusCfg.key}`)}
            </span>
            <span className={`${styles.badge} ${styles.langBadge}`}>
              <FiGlobe size={10} />
              {LANGUAGE_LABELS[campaign.language] || campaign.language}
            </span>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className={styles.infoGrid}>
        <InfoRow
          icon={FiCalendar}
          label={t('admin.campaigns.detail.createdAt')}
          value={formatDateTime(campaign.createdAt)}
        />
        {campaign.sentAt && (
          <InfoRow
            icon={FiSend}
            label={t('admin.campaigns.detail.sentAt')}
            value={formatDateTime(campaign.sentAt)}
          />
        )}
        {campaign.sentBy && (
          <InfoRow
            icon={FiUser}
            label={t('admin.campaigns.detail.sentBy')}
            value={
              <SensitiveData active={isViewer}>
                {campaign.sentBy.name || campaign.sentBy.email || '—'}
              </SensitiveData>
            }
          />
        )}
      </div>

      {/* Recipient Stats (if sent) */}
      {isSent && (
        <div className={styles.statsSection}>
          <h4 className={styles.sectionTitle}>{t('admin.campaigns.detail.recipientStats')}</h4>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <FiUsers size={16} className={styles.statIcon} />
              <span className={styles.statValue}>{campaign.recipientCount || 0}</span>
              <span className={styles.statLabel}>{t('admin.campaigns.detail.recipientCount')}</span>
            </div>
            <div className={`${styles.statItem} ${styles.statSuccess}`}>
              <FiCheckCircle size={16} className={styles.statIcon} />
              <span className={styles.statValue}>{campaign.successCount || 0}</span>
              <span className={styles.statLabel}>{t('admin.campaigns.detail.successCount')}</span>
            </div>
            <div className={`${styles.statItem} ${styles.statError}`}>
              <FiXCircle size={16} className={styles.statIcon} />
              <span className={styles.statValue}>{campaign.failCount || 0}</span>
              <span className={styles.statLabel}>{t('admin.campaigns.detail.failCount')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Content Preview */}
      <div className={styles.contentSection}>
        <h4 className={styles.sectionTitle}>{t('admin.campaigns.detail.contentPreview')}</h4>
        <div className={styles.contentPreview}>{campaign.content}</div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actionGrid}>
        {isDraft && (
          <>
            <button
              className={styles.primaryOutlineButton}
              onClick={() => onEdit?.(campaignId)}
              disabled={isBusy}
              type="button"
            >
              <FiEdit2 size={14} /> {t('admin.campaigns.editCampaign')}
            </button>
            <button
              className={styles.primaryButton}
              onClick={handleSend}
              disabled={isBusy}
              type="button"
            >
              {isBusy ? (
                <FiRefreshCw size={14} className={styles.spinning} />
              ) : (
                <FiSend size={14} />
              )}
              {t('admin.campaigns.send')}
            </button>
          </>
        )}
        {campaign?.status !== 'sending' && (
          <button
            className={styles.dangerOutlineButton}
            onClick={() => setView(VIEW.DELETE)}
            disabled={isBusy}
            type="button"
          >
            <FiTrash2 size={14} /> {t('admin.campaigns.delete')}
          </button>
        )}
      </div>
    </>
  );

  const viewRenderers = {
    [VIEW.DETAILS]: renderDetails,
    [VIEW.DELETE]: renderDeleteConfirm,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={view === VIEW.DETAILS ? t('admin.campaigns.detail.title') : undefined}
      size="medium"
    >
      <div className={styles.content}>{viewRenderers[view]?.()}</div>
    </Modal>
  );
}

function InfoRow({ icon: IconComponent, label, value }) {
  return (
    <div className={styles.infoRow}>
      <IconComponent size={14} className={styles.infoIcon} />
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  );
}

export default memo(AdminCampaignDetail);
