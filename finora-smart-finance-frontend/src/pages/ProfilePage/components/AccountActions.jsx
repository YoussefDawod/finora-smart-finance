/**
 * AccountActions Component
 * Displays logout and delete account options
 */

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common';
import styles from '../ProfilePage.module.scss';

export function AccountActions({ onLogout, onDelete }) {
  const { t } = useTranslation();

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className={styles.actionsCard}>
        <div className={styles.cardHeader}>
          <h3>{t('profile.account.title')}</h3>
        </div>
        <div className={styles.actionsContent}>
          <motion.button
            className={styles.logoutBtn}
            onClick={onLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {t('profile.account.logout')}
          </motion.button>
          <motion.button
            className={styles.deleteBtn}
            onClick={onDelete}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {t('profile.account.delete')}
          </motion.button>
        </div>
      </Card>
    </motion.div>
  );
}
