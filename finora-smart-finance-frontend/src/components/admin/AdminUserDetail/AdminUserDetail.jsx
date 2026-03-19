/**
 * @fileoverview AdminUserDetail – User-Detail-Modal
 * @description Zeigt detaillierte Benutzerinformationen mit Aktions-Buttons
 *              (Ban/Unban, Rolle ändern, Passwort zurücksetzen, Löschen).
 *
 * @module components/admin/AdminUserDetail
 */

import { useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiUser,
  FiShield,
  FiMail,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiSlash,
  FiUnlock,
  FiKey,
  FiTrash2,
  FiRefreshCw,
  FiAlertTriangle,
  FiEdit,
} from 'react-icons/fi';
import Modal from '@/components/common/Modal/Modal';
import Checkbox from '@/components/common/Checkbox/Checkbox';
import SensitiveData from '@/components/ui/SensitiveData/SensitiveData';
import { useAuth } from '@/hooks/useAuth';
import { useViewerGuard } from '@/hooks/useViewerGuard';
import styles from './AdminUserDetail.module.scss';

/**
 * Detail-Ansichten-Modes innerhalb des Modals
 */
const VIEW = {
  DETAILS: 'details',
  EDIT: 'edit',
  BAN: 'ban',
  RESET_PASSWORD: 'resetPassword',
  DELETE: 'delete',
  CHANGE_ROLE: 'changeRole',
};

/**
 * AdminUserDetail Component
 *
 * @param {Object} props
 * @param {Object|null} props.user - User-Objekt
 * @param {boolean} props.isOpen - Modal offen?
 * @param {Function} props.onClose - Modal schließen
 * @param {Object} props.actions - { banUser, unbanUser, changeRole, deleteUser, resetPassword }
 * @param {string|null} props.actionLoading - userId der laufenden Aktion
 * @param {Function} props.onSuccess - Callback nach erfolgreicher Aktion (message)
 * @param {Function} props.onError - Callback bei Fehler (errorMessage)
 */
function AdminUserDetail({
  user,
  isOpen,
  onClose,
  actions,
  actionLoading = null,
  onSuccess,
  onError,
}) {
  const { t, i18n } = useTranslation();
  const { isViewer } = useAuth();
  const { guard } = useViewerGuard();
  const [view, setView] = useState(VIEW.DETAILS);
  const [banReason, setBanReason] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [editForm, setEditForm] = useState({ name: '', email: '', isVerified: false });

  const userId = user?._id || user?.id;
  const isBusy = actionLoading === userId;

  // ── Reset beim Wechsel ──────────────────────────
  const backToDetails = useCallback(() => {
    setView(VIEW.DETAILS);
    setBanReason('');
    setNewPassword('');
    setEditForm({ name: '', email: '', isVerified: false });
  }, []);

  const handleClose = useCallback(() => {
    backToDetails();
    onClose?.();
  }, [backToDetails, onClose]);

  // ── Actions ─────────────────────────────────────

  const handleBan = useCallback(async () => {
    const result = await actions.banUser(userId, banReason);
    if (result.success) {
      onSuccess?.(t('admin.users.banSuccess'));
      handleClose();
    } else {
      onError?.(result.error);
    }
  }, [actions, userId, banReason, onSuccess, onError, t, handleClose]);

  const handleUnban = useCallback(async () => {
    const result = await actions.unbanUser(userId);
    if (result.success) {
      onSuccess?.(t('admin.users.unbanSuccess'));
      handleClose();
    } else {
      onError?.(result.error);
    }
  }, [actions, userId, onSuccess, onError, t, handleClose]);

  const handleChangeRole = useCallback(async () => {
    const newRole = user?.role === 'admin' ? 'user' : 'admin';
    const result = await actions.changeRole(userId, newRole);
    if (result.success) {
      onSuccess?.(t('admin.users.roleChangeSuccess'));
      handleClose();
    } else {
      onError?.(result.error);
    }
  }, [actions, userId, user?.role, onSuccess, onError, t, handleClose]);

  const handleResetPassword = useCallback(async () => {
    if (newPassword.length < 8) return;
    const result = await actions.resetPassword(userId, newPassword);
    if (result.success) {
      onSuccess?.(t('admin.users.passwordResetSuccess'));
      backToDetails();
      setNewPassword('');
    } else {
      onError?.(result.error);
    }
  }, [actions, userId, newPassword, onSuccess, onError, t, backToDetails]);

  const handleDelete = useCallback(async () => {
    const result = await actions.deleteUser(userId);
    if (result.success) {
      onSuccess?.(t('admin.users.deleteSuccess'));
      handleClose();
    } else {
      onError?.(result.error);
    }
  }, [actions, userId, onSuccess, onError, t, handleClose]);

  const handleStartEdit = useCallback(() => {
    setEditForm({
      name: user?.name || '',
      email: user?.email || '',
      isVerified: user?.isVerified || false,
    });
    setView(VIEW.EDIT);
  }, [user]);

  const handleEditSubmit = useCallback(async () => {
    const data = {};
    if (editForm.name.trim() && editForm.name.trim() !== user?.name) {
      data.name = editForm.name.trim();
    }
    if (editForm.email.trim() && editForm.email.trim() !== user?.email) {
      data.email = editForm.email.trim();
    }
    // Verifizierung nur erlauben wenn eine Email vorhanden ist (bestehend oder neu)
    if (editForm.isVerified !== user?.isVerified) {
      const hasEmail = editForm.email.trim() || user?.email;
      if (editForm.isVerified && !hasEmail) {
        onError?.(t('admin.users.edit.verifyRequiresEmail'));
        return;
      }
      data.isVerified = editForm.isVerified;
    }
    if (Object.keys(data).length === 0) {
      backToDetails();
      return;
    }
    const result = await actions.updateUser(userId, data);
    if (result.success) {
      onSuccess?.(t('admin.users.edit.success'));
      handleClose();
    } else {
      onError?.(result.error);
    }
  }, [editForm, user, actions, userId, onSuccess, onError, t, handleClose, backToDetails]);

  if (!user) return null;

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

  // ── Sub-Views ───────────────────────────────────

  const renderBanConfirm = () => (
    <div className={styles.confirmView}>
      <div className={`${styles.confirmIcon} ${styles.warning}`}>
        <FiSlash size={28} />
      </div>
      <h3>{t('admin.users.confirmBan')}</h3>
      <p className={styles.confirmText}>{t('admin.users.confirmBanText', { name: user.name })}</p>
      <label className={styles.inputLabel}>
        {t('admin.users.banReason')}
        <input
          type="text"
          className={styles.input}
          value={banReason}
          onChange={e => setBanReason(e.target.value)}
          placeholder={t('admin.users.banReasonPlaceholder')}
          disabled={isBusy}
        />
      </label>
      <div className={styles.confirmActions}>
        <button
          className={styles.cancelButton}
          onClick={backToDetails}
          disabled={isBusy}
          type="button"
        >
          {t('common.cancel')}
        </button>
        <button className={styles.dangerButton} onClick={handleBan} disabled={isBusy} type="button">
          {isBusy ? <FiRefreshCw size={14} className={styles.spinning} /> : <FiSlash size={14} />}
          {t('admin.users.ban')}
        </button>
      </div>
    </div>
  );

  const renderResetPassword = () => (
    <div className={styles.confirmView}>
      <div className={`${styles.confirmIcon} ${styles.info}`}>
        <FiKey size={28} />
      </div>
      <h3>{t('admin.users.resetPasswordTitle')}</h3>
      <p className={styles.confirmText}>
        {t('admin.users.resetPasswordText', { name: user.name })}
      </p>
      <label className={styles.inputLabel}>
        {t('admin.users.newPassword')}
        <input
          type="password"
          className={styles.input}
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          placeholder={t('admin.users.newPasswordPlaceholder')}
          minLength={8}
          disabled={isBusy}
        />
      </label>
      {newPassword.length > 0 && newPassword.length < 8 && (
        <p className={styles.inputHint}>{t('admin.users.passwordMinLength')}</p>
      )}
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
          className={styles.primaryButton}
          onClick={handleResetPassword}
          disabled={isBusy || newPassword.length < 8}
          type="button"
        >
          {isBusy ? <FiRefreshCw size={14} className={styles.spinning} /> : <FiKey size={14} />}
          {t('admin.users.resetPassword')}
        </button>
      </div>
    </div>
  );

  const renderDeleteConfirm = () => (
    <div className={styles.confirmView}>
      <div className={`${styles.confirmIcon} ${styles.danger}`}>
        <FiAlertTriangle size={28} />
      </div>
      <h3>{t('admin.users.confirmDelete')}</h3>
      <p className={styles.confirmText}>
        {t('admin.users.confirmDeleteText', { name: user.name })}
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
          {t('admin.users.delete')}
        </button>
      </div>
    </div>
  );

  const renderChangeRoleConfirm = () => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    return (
      <div className={styles.confirmView}>
        <div className={`${styles.confirmIcon} ${styles.warning}`}>
          <FiShield size={28} />
        </div>
        <h3>{t('admin.users.confirmRoleChange')}</h3>
        <p className={styles.confirmText}>
          {t('admin.users.confirmRoleChangeText', {
            name: user.name,
            role: newRole === 'admin' ? t('admin.users.roleAdmin') : t('admin.users.roleUser'),
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
            className={styles.primaryButton}
            onClick={handleChangeRole}
            disabled={isBusy}
            type="button"
          >
            {isBusy ? (
              <FiRefreshCw size={14} className={styles.spinning} />
            ) : (
              <FiShield size={14} />
            )}
            {t('admin.users.changeRole')}
          </button>
        </div>
      </div>
    );
  };

  // ── Details View ────────────────────────────────

  const renderDetails = () => (
    <>
      {/* User Info Header */}
      <div className={styles.userHeader}>
        <div
          className={`${styles.headerAvatar} ${user.role === 'admin' ? styles.adminAvatar : ''}`}
        >
          {user.role === 'admin' ? <FiShield size={24} /> : <FiUser size={24} />}
        </div>
        <div className={styles.headerInfo}>
          <h3 className={styles.userName}>
            <SensitiveData active={isViewer}>{user.name}</SensitiveData>
          </h3>
          <div className={styles.headerBadges}>
            <span className={`${styles.badge} ${styles[`role_${user.role}`]}`}>
              {user.role === 'admin'
                ? t('admin.users.roleAdmin')
                : user.role === 'viewer'
                  ? t('admin.users.roleViewer')
                  : t('admin.users.roleUser')}
            </span>
            {user.isActive === false ? (
              <span className={`${styles.badge} ${styles.banned}`}>{t('admin.users.banned')}</span>
            ) : (
              <span className={`${styles.badge} ${styles.active}`}>{t('admin.users.active')}</span>
            )}
            {user.isVerified ? (
              <span className={`${styles.badge} ${styles.verified}`}>
                <FiCheckCircle size={10} /> {t('admin.users.verified')}
              </span>
            ) : (
              <span className={`${styles.badge} ${styles.unverified}`}>
                <FiXCircle size={10} /> {t('admin.users.unverifiedLabel')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className={styles.infoGrid}>
        <InfoRow
          icon={FiMail}
          label={t('admin.users.email')}
          value={<SensitiveData active={isViewer}>{user.email || '—'}</SensitiveData>}
        />
        <InfoRow
          icon={FiCalendar}
          label={t('admin.users.joined')}
          value={formatDateTime(user.createdAt)}
        />
        <InfoRow
          icon={FiClock}
          label={t('admin.users.lastLogin')}
          value={formatDateTime(user.lastLogin)}
        />
        {user.isActive === false && user.banReason && (
          <InfoRow icon={FiSlash} label={t('admin.users.banReason')} value={user.banReason} />
        )}
      </div>

      {/* Action Buttons */}
      <div className={styles.actionGrid}>
        <button
          className={styles.outlineButton}
          onClick={() => guard(handleStartEdit)}
          disabled={isBusy}
          type="button"
        >
          <FiEdit size={14} /> {t('admin.users.edit.button')}
        </button>
        {user.isActive === false ? (
          <button
            className={styles.successButton}
            onClick={() => guard(handleUnban)}
            disabled={isBusy}
            type="button"
          >
            <FiUnlock size={14} /> {t('admin.users.unban')}
          </button>
        ) : (
          <button
            className={styles.warningButton}
            onClick={() => guard(() => setView(VIEW.BAN))}
            disabled={isBusy}
            type="button"
          >
            <FiSlash size={14} /> {t('admin.users.ban')}
          </button>
        )}
        <button
          className={styles.outlineButton}
          onClick={() => guard(() => setView(VIEW.CHANGE_ROLE))}
          disabled={isBusy}
          type="button"
        >
          <FiShield size={14} /> {t('admin.users.changeRole')}
        </button>
        <button
          className={styles.outlineButton}
          onClick={() => guard(() => setView(VIEW.RESET_PASSWORD))}
          disabled={isBusy}
          type="button"
        >
          <FiKey size={14} /> {t('admin.users.resetPassword')}
        </button>
        <button
          className={styles.dangerOutlineButton}
          onClick={() => guard(() => setView(VIEW.DELETE))}
          disabled={isBusy}
          type="button"
        >
          <FiTrash2 size={14} /> {t('admin.users.delete')}
        </button>
      </div>
    </>
  );

  // ── Edit View ─────────────────────────────────

  const renderEditView = () => (
    <div className={styles.editView}>
      <div className={`${styles.confirmIcon} ${styles.info}`}>
        <FiEdit size={28} />
      </div>
      <h3>{t('admin.users.edit.title')}</h3>

      <div className={styles.editForm}>
        <label className={styles.inputLabel}>
          {t('admin.users.name')}
          <input
            type="text"
            className={styles.input}
            value={editForm.name}
            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
            disabled={isBusy}
          />
        </label>

        <label className={styles.inputLabel}>
          {t('admin.users.email')}
          <input
            type="email"
            className={styles.input}
            value={editForm.email}
            onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
            disabled={isBusy}
          />
        </label>

        <Checkbox
          checked={editForm.isVerified}
          onChange={e => setEditForm(f => ({ ...f, isVerified: e.target.checked }))}
          disabled={isBusy}
        >
          <FiCheckCircle size={14} /> {t('admin.users.verified')}
        </Checkbox>
      </div>

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
          className={styles.primaryButton}
          onClick={handleEditSubmit}
          disabled={isBusy}
          type="button"
        >
          {isBusy ? <FiRefreshCw size={14} className={styles.spinning} /> : <FiEdit size={14} />}
          {t('admin.users.edit.save')}
        </button>
      </div>
    </div>
  );

  // ── Render Mapping ──────────────────────────────
  const viewRenderers = {
    [VIEW.DETAILS]: renderDetails,
    [VIEW.EDIT]: renderEditView,
    [VIEW.BAN]: renderBanConfirm,
    [VIEW.RESET_PASSWORD]: renderResetPassword,
    [VIEW.DELETE]: renderDeleteConfirm,
    [VIEW.CHANGE_ROLE]: renderChangeRoleConfirm,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        view === VIEW.DETAILS
          ? t('admin.users.userDetails')
          : view === VIEW.EDIT
            ? t('admin.users.edit.title')
            : undefined
      }
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

export default memo(AdminUserDetail);
