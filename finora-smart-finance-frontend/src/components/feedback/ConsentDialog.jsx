/**
 * @fileoverview ConsentDialog Component
 * @description Post-Submit Consent-Dialog für Feedback ≥4 Sterne (§8.4)
 */

import { motion } from 'framer-motion';
import { FiMessageCircle } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import styles from './ConsentDialog.module.scss';

const overlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

const panel = {
  initial: { opacity: 0, scale: 0.92, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.92, y: 20 },
  transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] },
};

/**
 * @param {{ onConsent: () => void, onDecline: () => void }} props
 */
export default function ConsentDialog({ onConsent, onDecline }) {
  const { t } = useTranslation();

  return (
    <motion.div
      className={styles.overlay}
      {...overlay}
      onClick={onDecline}
      role="dialog"
      aria-modal="true"
      aria-label={t('feedback.consent.title')}
    >
      <motion.div className={styles.panel} {...panel} onClick={e => e.stopPropagation()}>
        <div className={styles.icon}>
          <FiMessageCircle />
        </div>

        <h3 className={styles.title}>{t('feedback.consent.title')}</h3>
        <p className={styles.description}>{t('feedback.consent.description')}</p>
        <p className={styles.anonymized}>{t('feedback.consent.anonymized')}</p>

        <div className={styles.actions}>
          <button className={styles.acceptBtn} onClick={onConsent} type="button">
            {t('feedback.consent.accept')}
          </button>
          <button className={styles.declineBtn} onClick={onDecline} type="button">
            {t('feedback.consent.decline')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
