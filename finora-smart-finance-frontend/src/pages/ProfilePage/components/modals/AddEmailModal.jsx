/**
 * AddEmailModal Component
 * Modal for adding or changing email
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/useToast';
import { FiX } from 'react-icons/fi';
import styles from '../../ProfilePage.module.scss';

export function AddEmailModal({ isOpen, onClose, hasEmail, onSubmit, isLoading }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [newEmail, setNewEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await onSubmit(newEmail);

    if (result.success) {
      toast.success(t(`profile.toasts.${result.message}`));
      toast.info(t('profile.toasts.spamHint'));
      if (result.link) {
        console.log('DEV MODE - Verifizierungs-Link:', result.link);
      }
      setNewEmail('');
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
              <h3>{hasEmail ? t('profile.modals.addEmail.titleChange') : t('profile.modals.addEmail.titleAdd')}</h3>
              <button onClick={onClose} aria-label={t('common.close')}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label htmlFor="newEmail">{t('profile.modals.addEmail.label')}</label>
                <input
                  type="email"
                  id="newEmail"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={t('profile.modals.addEmail.placeholder')}
                  className={styles.input}
                  required
                />
              </div>
              <p className={styles.modalHint}>{t('profile.modals.addEmail.hint')}</p>
              <p className={styles.modalHintWarning}>{t('profile.modals.addEmail.spamHint')}</p>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={onClose}>
                  {t('profile.modals.addEmail.cancel')}
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={isLoading}>
                  {isLoading ? t('profile.modals.addEmail.sending') : t('profile.modals.addEmail.submit')}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
