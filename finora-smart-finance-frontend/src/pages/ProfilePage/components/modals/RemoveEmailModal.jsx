/**
 * RemoveEmailModal Component
 * Modal for removing email address
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/useToast';
import { FiTrash2, FiX } from 'react-icons/fi';
import styles from '../../ProfilePage.module.scss';

export function RemoveEmailModal({ isOpen, onClose, onSubmit, isLoading }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirmRemoval, setConfirmRemoval] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await onSubmit(password, confirmRemoval);

    if (result.success) {
      toast.success(t('profile.toasts.emailRemoved'));
      setPassword('');
      setConfirmRemoval(false);
      onClose();
    } else {
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
            className={styles.modal}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>
                <FiTrash2 /> {t('profile.modals.removeEmail.title')}
              </h3>
              <button onClick={onClose} aria-label={t('common.close')}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label htmlFor="removeEmailPassword">{t('profile.modals.removeEmail.passwordLabel')}</label>
                <input
                  type="password"
                  id="removeEmailPassword"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('profile.modals.removeEmail.passwordPlaceholder')}
                  className={styles.input}
                  required
                />
              </div>
              <label className={styles.modalHint} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" checked={confirmRemoval} onChange={(e) => setConfirmRemoval(e.target.checked)} />
                <span>{t('profile.modals.removeEmail.confirmLabel')}</span>
              </label>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={onClose}>
                  {t('profile.modals.removeEmail.cancel')}
                </button>
                <button type="submit" className={styles.btnDanger} disabled={isLoading}>
                  {isLoading ? t('profile.modals.removeEmail.removing') : t('profile.modals.removeEmail.submit')}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
