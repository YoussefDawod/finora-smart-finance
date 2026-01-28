/**
 * SecuritySection Component
 * Displays password change and security options
 */

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common';
import { FiShield, FiLock } from 'react-icons/fi';
import styles from '../ProfilePage.module.scss';

export function SecuritySection({ onChangePassword }) {
  const { t } = useTranslation();

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className={styles.securityCard}>
        <div className={styles.cardHeader}>
          <h3>
            <FiShield /> {t('profile.security.title')}
          </h3>
        </div>
        <div className={styles.securityContent}>
          <div className={styles.securityField}>
            <div className={styles.securityInfo}>
              <FiLock size={24} className={styles.securityIcon} />
              <div>
                <h4>{t('profile.security.passwordTitle')}</h4>
                <p>{t('profile.security.passwordDescription')}</p>
              </div>
            </div>
            <motion.button
              className={styles.securityBtn}
              onClick={onChangePassword}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t('profile.security.change')}
            </motion.button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
