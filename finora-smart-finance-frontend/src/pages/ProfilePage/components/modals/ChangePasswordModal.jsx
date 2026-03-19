/**
 * ChangePasswordModal Component
 * Modal for changing user password
 */

import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/useToast';
import { useMotion } from '@/hooks/useMotion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MEDIA_QUERIES } from '@/constants';
import { FiX, FiEye, FiEyeOff, FiCheck, FiCircle } from 'react-icons/fi';
import styles from '../../ProfilePage.module.scss';

// ── Password-Anforderungen ───────────────────────────────────────────
const REQUIREMENTS = [
  { id: 'length', test: v => v.length >= 8, label: 'profile.modals.changePassword.req.length' },
  {
    id: 'uppercase',
    test: v => /[A-Z]/.test(v),
    label: 'profile.modals.changePassword.req.uppercase',
  },
  { id: 'number', test: v => /[0-9]/.test(v), label: 'profile.modals.changePassword.req.number' },
  {
    id: 'special',
    test: v => /[^A-Za-z0-9]/.test(v),
    label: 'profile.modals.changePassword.req.special',
  },
];

function PasswordStrengthChecklist({ password }) {
  const { t } = useTranslation();
  if (!password) return null;
  return (
    <ul className={styles.strengthChecklist}>
      {REQUIREMENTS.map(req => {
        const met = req.test(password);
        return (
          <li
            key={req.id}
            className={`${styles.checkItem} ${met ? styles.checkMet : styles.checkUnmet}`}
          >
            {met ? <FiCheck size={12} /> : <FiCircle size={12} />}
            <span>{t(req.label)}</span>
          </li>
        );
      })}
    </ul>
  );
}

function PasswordField({ id, name, label, value, onChange, autoComplete, required, minLength }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={styles.formGroup}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.pwdWrapper}>
        <input
          type={visible ? 'text' : 'password'}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          className={`${styles.input} ${styles.inputNoPadLeft}`}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
        />
        <button
          type="button"
          className={styles.pwdToggle}
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? 'Passwort verbergen' : 'Passwort anzeigen'}
          tabIndex={-1}
        >
          {visible ? <FiEyeOff size={16} /> : <FiEye size={16} />}
        </button>
      </div>
    </div>
  );
}

export function ChangePasswordModal({ isOpen, onClose, onSubmit, isLoading }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { shouldAnimate } = useMotion();
  const isMobile = useMediaQuery(MEDIA_QUERIES.mobile);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const allRequirementsMet = useMemo(
    () => REQUIREMENTS.every(req => req.test(formData.newPassword)),
    [formData.newPassword]
  );

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const result = await onSubmit(
      formData.currentPassword,
      formData.newPassword,
      formData.confirmPassword
    );
    if (result.success) {
      toast.success(t('profile.toasts.passwordChanged'));
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      onClose();
    } else {
      toast.error(t(`profile.toasts.${result.error}`));
    }
  };

  // ── Shared modal content ─────────────────────────────────────────────
  const modalContent = (
    <>
      <div className={styles.modalHeader}>
        <h3>{t('profile.modals.changePassword.title')}</h3>
        <button onClick={onClose} aria-label={t('common.close')} type="button">
          <FiX />
        </button>
      </div>
      <form onSubmit={handleSubmit} className={styles.modalContent}>
        <PasswordField
          id="currentPassword"
          name="currentPassword"
          label={t('profile.modals.changePassword.currentLabel')}
          value={formData.currentPassword}
          onChange={handleChange}
          autoComplete="current-password"
          required
        />
        <div>
          <PasswordField
            id="newPassword"
            name="newPassword"
            label={t('profile.modals.changePassword.newLabel')}
            value={formData.newPassword}
            onChange={handleChange}
            autoComplete="new-password"
            required
            minLength={8}
          />
          <PasswordStrengthChecklist password={formData.newPassword} />
        </div>
        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label={t('profile.modals.changePassword.confirmLabel')}
          value={formData.confirmPassword}
          onChange={handleChange}
          autoComplete="new-password"
          required
        />
        <div className={styles.modalActions}>
          <button type="button" className={styles.btnCancel} onClick={onClose}>
            {t('profile.modals.changePassword.cancel')}
          </button>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={isLoading || !allRequirementsMet}
          >
            {isLoading
              ? t('profile.modals.changePassword.changing')
              : t('profile.modals.changePassword.submit')}
          </button>
        </div>
      </form>
    </>
  );

  // ── Desktop: zentriertes Overlay ─────────────────────────────────────
  const desktopModal = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.modalOverlay}
          initial={shouldAnimate ? { opacity: 0 } : false}
          animate={shouldAnimate ? { opacity: 1 } : false}
          exit={shouldAnimate ? { opacity: 0 } : undefined}
          onClick={onClose}
        >
          <motion.div
            className={styles.modal}
            initial={shouldAnimate ? { scale: 0.95, opacity: 0, y: -8 } : false}
            animate={shouldAnimate ? { scale: 1, opacity: 1, y: 0 } : false}
            exit={shouldAnimate ? { scale: 0.95, opacity: 0, y: -8 } : undefined}
            transition={{ duration: 0.18 }}
            onClick={e => e.stopPropagation()}
          >
            {modalContent}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── Mobile: Bottom Sheet via Portal ───────────────────────────────────
  const mobileSheet = isOpen
    ? createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                className={styles.sheetBackdrop}
                initial={shouldAnimate ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={onClose}
              />
              <motion.div
                className={`${styles.modal} ${styles.mobileSheet}`}
                initial={shouldAnimate ? { y: '100%' } : false}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className={styles.sheetHandle}>
                  <div className={styles.sheetHandleBar} />
                </div>
                {modalContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )
    : null;

  return isMobile ? mobileSheet : desktopModal;
}
