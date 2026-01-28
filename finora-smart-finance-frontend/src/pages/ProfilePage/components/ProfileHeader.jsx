/**
 * ProfileHeader Component
 * Displays user avatar and basic info
 */

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common';
import { FiCheck, FiAlertCircle, FiAlertTriangle } from 'react-icons/fi';
import styles from '../ProfilePage.module.scss';

export function ProfileHeader({ user, emailStatus }) {
  const { t } = useTranslation();

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className={styles.profileCard}>
        <div className={styles.profileCardHeader}>
          <div className={styles.profileAvatar}>
            <div className={styles.avatarContent}>
              {user.name
                ?.split(' ')
                .map((p) => p[0])
                .join('')
                .toUpperCase() || 'U'}
            </div>
          </div>
          <div className={styles.profileInfo}>
            <h2>{user.name}</h2>
            {emailStatus.hasEmail ? (
              <p className={emailStatus.isVerified ? styles.verified : styles.unverified}>
                {emailStatus.email}
                {emailStatus.isVerified ? (
                  <span className={styles.badge}>
                    <FiCheck /> {t('profile.badgeVerified')}
                  </span>
                ) : (
                  <span className={styles.badgeWarning}>
                    <FiAlertCircle /> {t('profile.badgeUnverified')}
                  </span>
                )}
              </p>
            ) : (
              <p className={styles.noEmail}>
                <FiAlertTriangle /> {t('profile.noEmailInline')}
              </p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
