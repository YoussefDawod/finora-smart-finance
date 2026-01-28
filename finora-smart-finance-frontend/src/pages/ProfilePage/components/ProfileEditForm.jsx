/**
 * ProfileEditForm Component
 * Handles user profile (name) editing
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/common';
import { FiUser, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import styles from '../ProfilePage.module.scss';

export function ProfileEditForm({ user, isEditing, setIsEditing, formData, handleInputChange, handleSave, handleCancel, isSaving }) {
  const { t } = useTranslation();
  const toast = useToast();

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  };

  const handleSaveClick = async () => {
    const result = await handleSave();
    if (result.success) {
      toast.success(t('profile.toasts.saved'));
    } else {
      toast.error(t(`profile.toasts.${result.error}`));
    }
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className={styles.editCard}>
        <div className={styles.cardHeader}>
          <h3>{t('profile.personal.title')}</h3>
          {!isEditing && (
            <motion.button
              className={styles.editBtn}
              onClick={() => setIsEditing(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiEdit2 size={18} />
              {t('profile.personal.edit')}
            </motion.button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.form
              key="edit-form"
              className={styles.form}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.formGroup}>
                <label htmlFor="name">{t('profile.personal.usernameLabel')}</label>
                <div className={styles.inputWrapper}>
                  <FiUser size={20} className={styles.inputIcon} />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t('profile.personal.usernamePlaceholder')}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <motion.button
                  type="button"
                  className={styles.btnSave}
                  onClick={handleSaveClick}
                  disabled={isSaving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiCheck size={18} />
                  {isSaving ? t('profile.personal.saving') : t('profile.personal.save')}
                </motion.button>
                <motion.button
                  type="button"
                  className={styles.btnCancel}
                  onClick={handleCancel}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiX size={18} />
                  {t('profile.personal.cancel')}
                </motion.button>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="view-mode"
              className={styles.viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.dataField}>
                <label>{t('profile.personal.usernameLabel')}</label>
                <p>{user.name}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
