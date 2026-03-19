/**
 * @fileoverview AdminSubscriberDetail – Subscriber-Detail-Modal
 * @description Zeigt detaillierte Subscriber-Informationen mit Lösch-Aktion
 *              und Bestätigungs-Dialog.
 *
 * @module components/admin/AdminSubscriberDetail
 */

import { useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiMail,
  FiGlobe,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiUser,
  FiUserX,
  FiTrash2,
  FiRefreshCw,
  FiAlertTriangle,
} from 'react-icons/fi';
import Modal from '@/components/common/Modal/Modal';
import SensitiveData from '@/components/ui/SensitiveData/SensitiveData';
import { useAuth } from '@/hooks/useAuth';
import { useViewerGuard } from '@/hooks/useViewerGuard';
import { LANGUAGE_LABELS } from '@/constants';
import styles from './AdminSubscriberDetail.module.scss';

/**
 * Detail-Ansichten-Modes innerhalb des Modals
 */
const VIEW = {
  DETAILS: 'details',
  DELETE: 'delete',
};

/**
 * AdminSubscriberDetail Component
 *
 * @param {Object} props
 * @param {Object|null} props.subscriber - Subscriber-Objekt
 * @param {boolean} props.isOpen - Modal offen?
 * @param {Function} props.onClose - Modal schließen
 * @param {Function} props.onDelete - deleteSubscriber(id) Callback
 * @param {string|null} props.actionLoading - ID der laufenden Aktion
 * @param {Function} props.onSuccess - Callback nach erfolgreicher Aktion (message)
 * @param {Function} props.onError - Callback bei Fehler (errorMessage)
 */
function AdminSubscriberDetail({
  subscriber,
  isOpen,
  onClose,
  onDelete,
  actionLoading = null,
  onSuccess,
  onError,
}) {
  const { t, i18n } = useTranslation();
  const { isViewer } = useAuth();
  const { guard } = useViewerGuard();
  const [view, setView] = useState(VIEW.DETAILS);

  const subscriberId = subscriber?._id || subscriber?.id;
  const isBusy = actionLoading === subscriberId;

  // ── Reset beim Schließen ────────────────────────
  const handleClose = useCallback(() => {
    setView(VIEW.DETAILS);
    onClose?.();
  }, [onClose]);

  // ── Delete Action ───────────────────────────────
  const handleDelete = useCallback(async () => {
    try {
      await onDelete?.(subscriberId);
      onSuccess?.(t('admin.subscribers.deleteSuccess'));
      handleClose();
    } catch {
      onError?.(t('admin.subscribers.deleteError'));
    }
  }, [onDelete, subscriberId, onSuccess, onError, t, handleClose]);

  if (!subscriber) return null;

  // ── Formatierung ────────────────────────────────
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

  // ── Delete Confirm View ─────────────────────────
  const renderDeleteConfirm = () => (
    <div className={styles.confirmView}>
      <div className={`${styles.confirmIcon} ${styles.danger}`}>
        <FiAlertTriangle size={28} />
      </div>
      <h3>{t('admin.subscribers.confirmDelete')}</h3>
      <p className={styles.confirmText}>
        {t('admin.subscribers.confirmDeleteText', { email: subscriber.email })}
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
          {t('admin.subscribers.delete')}
        </button>
      </div>
    </div>
  );

  // ── Details View ────────────────────────────────
  const renderDetails = () => (
    <>
      {/* Subscriber Header */}
      <div className={styles.subscriberHeader}>
        <div className={styles.headerAvatar}>
          <FiMail size={24} />
        </div>
        <div className={styles.headerInfo}>
          <h3 className={styles.subscriberEmail}>
            <SensitiveData active={isViewer}>{subscriber.email}</SensitiveData>
          </h3>
          <div className={styles.headerBadges}>
            {/* Status Badge */}
            {subscriber.isConfirmed ? (
              <span className={`${styles.badge} ${styles.confirmed}`}>
                <FiCheckCircle size={10} />
                {t('admin.subscribers.confirmed')}
              </span>
            ) : (
              <span className={`${styles.badge} ${styles.pending}`}>
                <FiClock size={10} />
                {t('admin.subscribers.pending')}
              </span>
            )}
            {/* Type Badge */}
            {subscriber.userId ? (
              <span className={`${styles.badge} ${styles.registered}`}>
                <FiUser size={10} />
                {t('admin.subscribers.registered')}
              </span>
            ) : (
              <span className={`${styles.badge} ${styles.guest}`}>
                <FiUserX size={10} />
                {t('admin.subscribers.guest')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className={styles.infoGrid}>
        <InfoRow
          icon={FiMail}
          label={t('admin.subscribers.email')}
          value={<SensitiveData active={isViewer}>{subscriber.email || '—'}</SensitiveData>}
        />
        <InfoRow
          icon={FiGlobe}
          label={t('admin.subscribers.language')}
          value={LANGUAGE_LABELS[subscriber.language] || subscriber.language || '—'}
        />
        <InfoRow
          icon={FiCalendar}
          label={t('admin.subscribers.detail.subscribedAt')}
          value={formatDateTime(subscriber.subscribedAt || subscriber.createdAt)}
        />
        {subscriber.isConfirmed && subscriber.confirmedAt && (
          <InfoRow
            icon={FiCheckCircle}
            label={t('admin.subscribers.detail.confirmedAt')}
            value={formatDateTime(subscriber.confirmedAt)}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className={styles.actionGrid}>
        <button
          className={styles.dangerOutlineButton}
          onClick={() => guard(() => setView(VIEW.DELETE))}
          disabled={isBusy}
          type="button"
        >
          <FiTrash2 size={14} /> {t('admin.subscribers.delete')}
        </button>
      </div>
    </>
  );

  // ── Render Mapping ──────────────────────────────
  const viewRenderers = {
    [VIEW.DETAILS]: renderDetails,
    [VIEW.DELETE]: renderDeleteConfirm,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={view === VIEW.DETAILS ? t('admin.subscribers.detail.title') : undefined}
      size="medium"
    >
      <div className={styles.content}>{viewRenderers[view]?.()}</div>
    </Modal>
  );
}

// ── InfoRow Sub-Component ─────────────────────────
function InfoRow({ icon: IconComponent, label, value }) {
  return (
    <div className={styles.infoRow}>
      <IconComponent size={14} className={styles.infoIcon} />
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  );
}

export default memo(AdminSubscriberDetail);
