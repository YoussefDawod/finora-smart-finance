/**
 * EmailManager Component
 * Handles all email-related operations
 */

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/common';
import { FiMail, FiCheck, FiAlertCircle, FiAlertTriangle, FiEdit2, FiTrash2, FiRefreshCw, FiPlus } from 'react-icons/fi';
import styles from '../ProfilePage.module.scss';

export function EmailManager({
  emailStatus,
  isRemovingEmail,
  isResendingVerification,
  onAddEmail,
  onRemoveEmail,
  onResendVerification,
  onResendAddEmailVerification,
}) {
  const { t } = useTranslation();
  const toast = useToast();

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  };

  const handleResendVerification = async () => {
    const result = await onResendVerification();
    if (result.success) {
      toast.success(t('profile.toasts.verificationResent'));
    } else {
      toast.error(result.error);
    }
  };

  const handleResendAddEmailVerification = async () => {
    const result = await onResendAddEmailVerification();
    if (result.success) {
      toast.success(t('profile.toasts.verificationResentTo', { email: result.email }));
    } else {
      toast.error(result.error);
    }
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className={styles.emailCard}>
        <div className={styles.cardHeader}>
          <h3>
            <FiMail /> {t('profile.email.title')}
          </h3>
        </div>

        <div className={styles.emailContent}>
          {emailStatus.loading ? (
            <div className={styles.loading}>
              <FiRefreshCw className={styles.spinner} />
              <span>{t('profile.email.loading')}</span>
            </div>
          ) : emailStatus.hasEmail ? (
            <>
              <div className={styles.emailInfo}>
                <div className={styles.emailField}>
                  <label>{t('profile.email.currentLabel')}</label>
                  <p>{emailStatus.email}</p>
                </div>

                <div className={styles.emailStatus}>
                  <label>{t('profile.email.statusLabel')}</label>
                  {emailStatus.isVerified ? (
                    <span className={styles.statusVerified}>
                      <FiCheck /> {t('profile.email.verified')}
                    </span>
                  ) : (
                    <span className={styles.statusPending}>
                      <FiAlertCircle /> {t('profile.email.pending')}
                    </span>
                  )}
                </div>
              </div>

              {!emailStatus.isVerified && (
                <div className={styles.warningBanner}>
                  <FiAlertTriangle />
                  <span>{t('profile.email.warningUnverified')}</span>
                  <button onClick={handleResendVerification} disabled={isResendingVerification} className={styles.resendBtn}>
                    {isResendingVerification ? t('profile.email.resendSending') : t('profile.email.resend')}
                  </button>
                </div>
              )}

              <div className={styles.emailActions}>
                <motion.button
                  className={styles.btnSecondary}
                  onClick={() => onAddEmail()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiEdit2 /> {t('profile.email.change')}
                </motion.button>
                <motion.button
                  className={styles.btnDanger}
                  onClick={() => onRemoveEmail()}
                  disabled={isRemovingEmail}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiTrash2 /> {isRemovingEmail ? t('profile.email.removing') : t('profile.email.remove')}
                </motion.button>
              </div>
            </>
          ) : emailStatus.pendingEmail ? (
            <>
              <div className={styles.pendingEmailWarning}>
                <div className={styles.warningHeader}>
                  <FiAlertCircle className={styles.warningIcon} />
                  <div>
                    <h4>{t('profile.email.pendingTitle')}</h4>
                    <p>{t('profile.email.pendingSent', { email: emailStatus.pendingEmail })}</p>
                  </div>
                </div>
                <p className={styles.modalHintWarning}>{t('profile.email.spamHint')}</p>
              </div>

              <div className={styles.pendingEmailActions}>
                <motion.button
                  className={styles.btnPrimary}
                  onClick={handleResendAddEmailVerification}
                  disabled={isResendingVerification}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiRefreshCw /> {isResendingVerification ? t('profile.email.pendingResendSending') : t('profile.email.pendingResend')}
                </motion.button>
                <motion.button
                  className={styles.btnSecondary}
                  onClick={() => onAddEmail()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiEdit2 /> {t('profile.email.pendingUseDifferent')}
                </motion.button>
              </div>
            </>
          ) : (
            <div className={styles.noEmailSection}>
              <div className={styles.noEmailWarning}>
                <FiAlertTriangle className={styles.warningIcon} />
                <div>
                  <h4>{t('profile.email.noEmailTitle')}</h4>
                  <p>{t('profile.email.noEmailDescription')}</p>
                </div>
              </div>
              <motion.button
                className={styles.btnPrimary}
                onClick={() => onAddEmail()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiPlus /> {t('profile.email.addEmail')}
              </motion.button>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
