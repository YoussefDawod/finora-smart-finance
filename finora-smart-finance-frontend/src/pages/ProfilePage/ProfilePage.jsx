/**
 * @fileoverview ProfilePage Component
 * @description Professionelle Profilverwaltungs-Seite mit vollständigem Design
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card } from '@/components/common';
import { FiUser, FiMail, FiLock, FiEdit2, FiCheck, FiX, FiCamera } from 'react-icons/fi';
import styles from './ProfilePage.module.scss';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  // ============================================
  // PROTECTIONS & REDIRECTS
  // ============================================
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) return null;
  if (!user) return null;

  // ============================================
  // HANDLERS
  // ============================================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      // TODO: API Call für Profilupdate
      setIsEditing(false);
      // Hier könnte ein Toast oder Feedback kommen
    } catch (error) {
      console.error('Profile update failed:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
    });
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // ============================================
  // CONTAINER VARIANTS FOR ANIMATIONS
  // ============================================
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <motion.section
      className={styles.profilePage}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1>Profil</h1>
        <p>Verwalten Sie Ihre persönlichen Daten und Kontoeinstellungen</p>
      </div>

      {/* Main Content */}
      <motion.div className={styles.content} variants={itemVariants}>
        {/* Profile Card */}
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
              <motion.button
                className={styles.uploadBtn}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Profilbild ändern"
              >
                <FiCamera size={20} />
              </motion.button>
            </div>
            <div className={styles.profileInfo}>
              <h2>{user.name}</h2>
              <p>{user.email}</p>
            </div>
          </div>
        </Card>

        {/* Edit Profile Form */}
        <Card className={styles.editCard}>
          <div className={styles.cardHeader}>
            <h3>Persönliche Daten</h3>
            {!isEditing && (
              <motion.button
                className={styles.editBtn}
                onClick={() => setIsEditing(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiEdit2 size={18} />
                Bearbeiten
              </motion.button>
            )}
          </div>

          {isEditing ? (
            // EDIT MODE
            <motion.form
              className={styles.form}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {/* Name Field */}
              <div className={styles.formGroup}>
                <label htmlFor="name">Name</label>
                <div className={styles.inputWrapper}>
                  <FiUser size={20} className={styles.inputIcon} />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ihr Name"
                    className={styles.input}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <div className={styles.inputWrapper}>
                  <FiMail size={20} className={styles.inputIcon} />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Ihre Email"
                    className={styles.input}
                    disabled
                  />
                </div>
                <small>Die E-Mail-Adresse kann nicht geändert werden</small>
              </div>

              {/* Action Buttons */}
              <div className={styles.formActions}>
                <motion.button
                  type="button"
                  className={styles.btnSave}
                  onClick={handleSave}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiCheck size={18} />
                  Speichern
                </motion.button>
                <motion.button
                  type="button"
                  className={styles.btnCancel}
                  onClick={handleCancel}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiX size={18} />
                  Abbrechen
                </motion.button>
              </div>
            </motion.form>
          ) : (
            // VIEW MODE
            <motion.div
              className={styles.viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.dataField}>
                <label>Name</label>
                <p>{user.name}</p>
              </div>
              <div className={styles.dataField}>
                <label>Email</label>
                <p>{user.email}</p>
              </div>
            </motion.div>
          )}
        </Card>

        {/* Security Section */}
        <Card className={styles.securityCard}>
          <div className={styles.cardHeader}>
            <h3>Sicherheit</h3>
          </div>
          <div className={styles.securityContent}>
            <div className={styles.securityField}>
              <div className={styles.securityInfo}>
                <FiLock size={24} className={styles.securityIcon} />
                <div>
                  <h4>Passwort</h4>
                  <p>Ändern Sie Ihr Passwort regelmäßig</p>
                </div>
              </div>
              <motion.button
                className={styles.securityBtn}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Ändern
              </motion.button>
            </div>
          </div>
        </Card>

        {/* Account Actions */}
        <Card className={styles.actionsCard}>
          <div className={styles.cardHeader}>
            <h3>Kontoverwaltung</h3>
          </div>
          <div className={styles.actionsContent}>
            <motion.button
              className={styles.logoutBtn}
              onClick={handleLogout}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Abmelden
            </motion.button>
            <motion.button
              className={styles.deleteBtn}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled
            >
              Konto löschen
            </motion.button>
          </div>
        </Card>
      </motion.div>
    </motion.section>
  );
}
