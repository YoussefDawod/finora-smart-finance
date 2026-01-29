/**
 * ChangePasswordModal Component
 * Modal for changing user password
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/useToast';
import { FiX } from 'react-icons/fi';
import styles from '../../ProfilePage.module.scss';

export function ChangePasswordModal({ isOpen, onClose, onSubmit, isLoading }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await onSubmit(formData.currentPassword, formData.newPassword, formData.confirmPassword);

    if (result.success) {
      toast.success(t('profile.toasts.passwordChanged'));
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      onClose();
    } else {
      toast.error(t(`profile.toasts.${result.error}`));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.modalOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.modal}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>{t('profile.modals.changePassword.title')}</h3>
              <button onClick={onClose} aria-label={t('common.close')}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label htmlFor="currentPassword">{t('profile.modals.changePassword.currentLabel')}</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="newPassword">{t('profile.modals.changePassword.newLabel')}</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className={styles.input}
                  required
                  minLength={8}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">{t('profile.modals.changePassword.confirmLabel')}</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={onClose}>
                  {t('profile.modals.changePassword.cancel')}
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={isLoading}>
                  {isLoading ? t('profile.modals.changePassword.changing') : t('profile.modals.changePassword.submit')}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
