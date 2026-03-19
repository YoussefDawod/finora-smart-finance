/**
 * @fileoverview AdminTransactionDetail – Transaction-Detail-Modal
 * @description Zeigt vollständige Transaktions-Details mit Lösch-Aktion.
 *
 * @module components/admin/AdminTransactionDetail
 */

import { useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiTag,
  FiCalendar,
  FiUser,
  FiFileText,
  FiTrash2,
  FiRefreshCw,
  FiAlertTriangle,
  FiTrendingUp,
  FiTrendingDown,
  FiHash,
} from 'react-icons/fi';
import Modal from '@/components/common/Modal/Modal';
import SensitiveData from '@/components/ui/SensitiveData/SensitiveData';
import { useAuth } from '@/hooks/useAuth';
import { useViewerGuard } from '@/hooks/useViewerGuard';
import { translateCategory } from '@/utils/categoryTranslations';
import { formatAdminCurrency } from '@/utils/adminTableHelpers';
import styles from './AdminTransactionDetail.module.scss';

/**
 * Detail-Ansichten-Modes
 */
const VIEW = {
  DETAILS: 'details',
  DELETE: 'delete',
};

/**
 * AdminTransactionDetail Component
 *
 * @param {Object} props
 * @param {Object|null} props.transaction - Transaction-Objekt (mit populated userId)
 * @param {boolean} props.isOpen - Modal offen?
 * @param {Function} props.onClose - Modal schließen
 * @param {Function} props.onDelete - deleteTransaction(id)
 * @param {string|null} props.actionLoading - id der laufenden Aktion
 * @param {Function} props.onSuccess - Callback nach erfolgreicher Aktion
 * @param {Function} props.onError - Callback bei Fehler
 */
function AdminTransactionDetail({
  transaction,
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

  const txId = transaction?._id || transaction?.id;
  const isBusy = actionLoading === txId;

  // ── Reset beim Wechsel ──────────────────────────
  const backToDetails = useCallback(() => {
    setView(VIEW.DETAILS);
  }, []);

  const handleClose = useCallback(() => {
    backToDetails();
    onClose?.();
  }, [backToDetails, onClose]);

  // ── Delete Action ───────────────────────────────
  const handleDelete = useCallback(async () => {
    const result = await onDelete?.(txId);
    if (result?.success) {
      onSuccess?.(t('admin.transactions.deleteSuccess'));
      handleClose();
    } else {
      onError?.(result?.error || t('admin.transactions.deleteError'));
    }
  }, [onDelete, txId, onSuccess, onError, t, handleClose]);

  if (!transaction) return null;

  // ── Formatierung ────────────────────────────────
  const formatDate = dateStr => {
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
  };

  const formatAmount = amount => {
    if (amount == null) return '—';
    return formatAdminCurrency(amount, i18n.language);
  };

  const isIncome = transaction.type === 'income';

  // ── Delete Confirm View ─────────────────────────
  const renderDeleteConfirm = () => (
    <div className={styles.confirmView}>
      <div className={`${styles.confirmIcon} ${styles.danger}`}>
        <FiAlertTriangle size={28} />
      </div>
      <h3>{t('admin.transactions.confirmDelete')}</h3>
      <p className={styles.confirmText}>
        {t('admin.transactions.confirmDeleteText', {
          description: transaction.description || '—',
          amount: formatAmount(transaction.amount),
        })}
      </p>
      <div className={styles.confirmActions}>
        <button
          className={styles.cancelButton}
          onClick={backToDetails}
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
          {t('admin.transactions.delete')}
        </button>
      </div>
    </div>
  );

  // ── Details View ────────────────────────────────
  const renderDetails = () => (
    <>
      {/* Header */}
      <div className={styles.txHeader}>
        <div className={`${styles.headerIcon} ${isIncome ? styles.income : styles.expense}`}>
          {isIncome ? <FiTrendingUp size={24} /> : <FiTrendingDown size={24} />}
        </div>
        <div className={styles.headerInfo}>
          <h3 className={styles.txDescription}>
            <SensitiveData active={isViewer}>{transaction.description || '—'}</SensitiveData>
          </h3>
          <div className={styles.headerBadges}>
            <span className={`${styles.badge} ${styles[transaction.type]}`}>
              {isIncome ? t('admin.transactions.income') : t('admin.transactions.expense')}
            </span>
            <span className={styles.categoryBadge}>
              {translateCategory(transaction.category, t)}
            </span>
          </div>
        </div>
        <div className={`${styles.amountDisplay} ${isIncome ? styles.income : styles.expense}`}>
          <SensitiveData active={isViewer}>
            {isIncome ? '+' : '-'}
            {formatAmount(transaction.amount)}
          </SensitiveData>
        </div>
      </div>

      {/* Info Grid */}
      <div className={styles.infoGrid}>
        <InfoRow
          icon={FiCalendar}
          label={t('admin.transactions.date')}
          value={formatDate(transaction.date)}
        />
        <InfoRow
          icon={FiTag}
          label={t('admin.transactions.category')}
          value={translateCategory(transaction.category, t)}
        />
        <InfoRow
          icon={FiUser}
          label={t('admin.transactions.user')}
          value={
            <SensitiveData active={isViewer}>
              {transaction.userId?.name || transaction.userId?.email || '—'}
            </SensitiveData>
          }
        />
        {transaction.userId?.email && transaction.userId?.name && (
          <InfoRow
            icon={FiUser}
            label={t('admin.transactions.userEmail')}
            value={<SensitiveData active={isViewer}>{transaction.userId.email}</SensitiveData>}
          />
        )}
        {transaction.notes && (
          <InfoRow
            icon={FiFileText}
            label={t('admin.transactions.notes')}
            value={<SensitiveData active={isViewer}>{transaction.notes}</SensitiveData>}
          />
        )}
        {transaction.tags && transaction.tags.length > 0 && (
          <InfoRow
            icon={FiHash}
            label={t('admin.transactions.tags')}
            value={transaction.tags.join(', ')}
          />
        )}
      </div>

      {/* Delete Button */}
      <div className={styles.actionGrid}>
        <button
          className={styles.dangerOutlineButton}
          onClick={() => guard(() => setView(VIEW.DELETE))}
          disabled={isBusy}
          type="button"
        >
          <FiTrash2 size={14} /> {t('admin.transactions.delete')}
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
      title={view === VIEW.DETAILS ? t('admin.transactions.transactionDetails') : undefined}
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

export default memo(AdminTransactionDetail);
