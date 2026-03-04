/**
 * AddEmailModal Component
 * Modal for adding or changing email
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/useToast';
import { useMotion } from '@/hooks/useMotion';
import { FiX } from 'react-icons/fi';
import styles from '../../ProfilePage.module.scss';

export function AddEmailModal({ isOpen, onClose, hasEmail, onSubmit, isLoading }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { shouldAnimate } = useMotion();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (hasEmail && !password) {
      toast.error(t('profile.modals.addEmail.passwordRequired'));
      return;
    }

    const result = await onSubmit(newEmail, password);

    if (result.success) {
      toast.success(t(`profile.toasts.${result.message}`));
      toast.info(t('profile.toasts.spamHint'));
      setNewEmail('');
      setPassword('');
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
          initial={shouldAnimate ? { opacity: 0 } : false}
          animate={shouldAnimate ? { opacity: 1 } : false}
          exit={shouldAnimate ? { opacity: 0 } : undefined}
          onClick={onClose}
        >
          <motion.div
            className={styles.modal}
            initial={shouldAnimate ? { scale: 0.9, opacity: 0 } : false}
            animate={shouldAnimate ? { scale: 1, opacity: 1 } : false}
            exit={shouldAnimate ? { scale: 0.9, opacity: 0 } : undefined}
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
                  name="newEmail"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={t('profile.modals.addEmail.placeholder')}
                  className={styles.input}
                  autoComplete="email"
                  required
                />
              </div>
              <p className={styles.modalHint}>{t('profile.modals.addEmail.hint')}</p>
              {hasEmail && (
                <div className={styles.formGroup}>
                  <label htmlFor="emailPassword">{t('profile.modals.addEmail.passwordLabel')}</label>
                  <input
                    type="password"
                    id="emailPassword"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('profile.modals.addEmail.passwordPlaceholder')}
                    className={styles.input}
                    autoComplete="current-password"
                    required
                  />
                </div>
              )}
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
