/**
 * DeleteAccountModal Component
 * Modal for permanently deleting user account
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/useToast';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import styles from '../../ProfilePage.module.scss';

export function DeleteAccountModal({ isOpen, onClose, onSubmit, isLoading }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [confirmText, setConfirmText] = useState('');
  const deleteConfirmValue = t('profile.modals.deleteAccount.confirmValue');

  const handleSubmit = async () => {
    if (confirmText !== deleteConfirmValue) {
      toast.error(t('profile.modals.deleteAccount.confirmError', { value: deleteConfirmValue }));
      return;
    }

    const result = await onSubmit();
    if (!result.success) {
      toast.error(result.error);
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
            className={`${styles.modal} ${styles.dangerModal}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>
                <FiAlertTriangle /> {t('profile.modals.deleteAccount.title')}
              </h3>
              <button onClick={onClose} aria-label={t('common.close')}>
                <FiX />
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.dangerWarning}>
                <p>{t('profile.modals.deleteAccount.warningPrimary')}</p>
                <p>{t('profile.modals.deleteAccount.warningSecondary')}</p>
              </div>
              <div className={styles.formGroup}>
                <label>{t('profile.modals.deleteAccount.confirmLabel', { value: deleteConfirmValue })}</label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className={styles.input}
                  placeholder={t('profile.modals.deleteAccount.placeholder', { value: deleteConfirmValue })}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={onClose}>
                  {t('profile.modals.deleteAccount.cancel')}
                </button>
                <button
                  type="button"
                  className={styles.btnDanger}
                  disabled={confirmText !== deleteConfirmValue || isLoading}
                  onClick={handleSubmit}
                >
                  {t('profile.modals.deleteAccount.submit')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
