/**
 * @fileoverview ProfilePage Component
 * @description Vollständige Profilverwaltungs-Seite mit Email-Management
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import authService from '@/api/authService';
import { Card } from '@/components/common';
import { 
  FiUser, 
  FiMail, 
  FiLock, 
  FiEdit2, 
  FiCheck, 
  FiX, 
  FiAlertCircle,
  FiAlertTriangle,
  FiPlus,
  FiTrash2,
  FiShield,
  FiRefreshCw
} from 'react-icons/fi';
import styles from './ProfilePage.module.scss';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user, logout, refreshUser } = useAuth();
  const toast = useToast();
  const { t } = useTranslation();

  // ============================================
  // STATE
  // ============================================
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
  });
  const [emailStatus, setEmailStatus] = useState({
    hasEmail: false,
    email: '',
    isVerified: false,
    canResetPassword: false,
    pendingEmail: null,
    loading: true,
  });
  
  // Modal states
  const [showAddEmailModal, setShowAddEmailModal] = useState(false);
  const [showRemoveEmailModal, setShowRemoveEmailModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  
  // Form states for modals
  const [newEmail, setNewEmail] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [removeEmailForm, setRemoveEmailForm] = useState({
    password: '',
    confirmRemoval: false,
  });
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const deleteConfirmValue = t('profile.modals.deleteAccount.confirmValue');
  
  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [isRemovingEmail, setIsRemovingEmail] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  // ============================================
  // FETCH EMAIL STATUS
  // ============================================
  const fetchEmailStatus = useCallback(async () => {
    try {
      const response = await authService.getEmailStatus();
      const data = response.data.data;
      setEmailStatus({
        hasEmail: data.hasEmail,
        email: data.email || '',
        isVerified: data.isVerified,
        canResetPassword: data.canResetPassword,
        pendingEmail: data.pendingEmail || null,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to fetch email status:', error);
      setEmailStatus(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData({ name: user.name || '' });
      fetchEmailStatus();
    }
  }, [isAuthenticated, user, fetchEmailStatus]);

  if (isLoading) return null;
  if (!user) return null;

  // ============================================
  // HANDLERS
  // ============================================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    // Validate name
    const trimmedName = formData.name?.trim();
    if (!trimmedName || trimmedName.length < 3) {
      toast.error(t('profile.toasts.nameMin'));
      return;
    }
    if (trimmedName.length > 50) {
      toast.error(t('profile.toasts.nameMax'));
      return;
    }

    setIsSaving(true);
    try {
      const response = await authService.updateProfile({ name: trimmedName });
      // Update user in AuthContext
      if (response.data?.data) {
        // Refresh the user data
        await refreshUser();
      }
      toast.success(t('profile.toasts.saved'));
      setIsEditing(false);
    } catch (error) {
      const message = error.response?.data?.error || t('profile.toasts.saveError');
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: user?.name || '' });
    setIsEditing(false);
  };

  // EMAIL HANDLERS
  const handleAddEmail = async (e) => {
    e.preventDefault();
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast.error(t('profile.toasts.invalidEmail'));
      return;
    }
    if (emailStatus.hasEmail && newEmail === emailStatus.email) {
      toast.error(t('profile.toasts.sameEmail'));
      return;
    }

    setIsAddingEmail(true);
    try {
      const isChange = emailStatus.hasEmail;
      const response = isChange
        ? await authService.changeEmail(newEmail)
        : await authService.addEmail(newEmail);

      toast.success(isChange ? t('profile.toasts.verificationSentChange') : t('profile.toasts.verificationSentAdd'));
      toast.info(t('profile.toasts.spamHint'));
      
      if (response.data?.data?.verificationLink) {
        console.log('DEV MODE - Verifizierungs-Link:', response.data.data.verificationLink);
      }
      
      setShowAddEmailModal(false);
      setNewEmail('');
      fetchEmailStatus();
    } catch (error) {
      const message = error.response?.data?.message || t('profile.toasts.emailSendError');
      toast.error(message);
    } finally {
      setIsAddingEmail(false);
    }
  };

  const handleRemoveEmail = async (e) => {
    e.preventDefault();
    if (!removeEmailForm.password) {
      toast.error(t('profile.toasts.passwordRequired'));
      return;
    }
    if (!removeEmailForm.confirmRemoval) {
      toast.error(t('profile.toasts.confirmRemoval'));
      return;
    }
    setIsRemovingEmail(true);
    try {
      await authService.removeEmail(removeEmailForm.password, true);
      toast.success(t('profile.toasts.emailRemoved'));
      setShowRemoveEmailModal(false);
      setRemoveEmailForm({ password: '', confirmRemoval: false });
      fetchEmailStatus();
    } catch (error) {
      const message = error.response?.data?.message || t('profile.toasts.emailRemoveError');
      toast.error(message);
    } finally {
      setIsRemovingEmail(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResendingVerification(true);
    try {
      await authService.resendVerification();
      toast.success(t('profile.toasts.verificationResent'));
    } catch (error) {
      const message = error.response?.data?.message || t('profile.toasts.emailSendError');
      toast.error(message);
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleResendAddEmailVerification = async () => {
    setIsResendingVerification(true);
    try {
      const response = await authService.resendAddEmailVerification();
      const email = response.data?.data?.email || newEmail;
      toast.success(t('profile.toasts.verificationResentTo', { email }));
    } catch (error) {
      const message = error.response?.data?.message || t('profile.toasts.emailSendError');
      toast.error(message);
    } finally {
      setIsResendingVerification(false);
    }
  };

  // PASSWORD HANDLERS
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('profile.toasts.passwordMismatch'));
      return;
    }

    const strong = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!strong.test(passwordForm.newPassword)) {
      toast.error(t('profile.toasts.passwordWeak'));
      return;
    }

    setIsChangingPassword(true);
    try {
      await authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success(t('profile.toasts.passwordChanged'));
      setShowChangePasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      const message = error.response?.data?.message || t('profile.toasts.passwordChangeError');
      toast.error(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== deleteConfirmValue) {
      toast.error(t('profile.modals.deleteAccount.confirmError', { value: deleteConfirmValue }));
      return;
    }
    try {
      await authService.deleteAccount(user.email);
      toast.success(t('profile.toasts.accountDeleted'));
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      const message = error.response?.data?.message || t('profile.toasts.accountDeleteError');
      toast.error(message);
    }
  };

  // LOGOUT
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // ============================================
  // ANIMATION VARIANTS
  // ============================================
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
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
        <h1>{t('profile.title')}</h1>
        <p>{t('profile.subtitle')}</p>
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
            </div>
            <div className={styles.profileInfo}>
              <h2>{user.name}</h2>
              {emailStatus.hasEmail ? (
                <p className={emailStatus.isVerified ? styles.verified : styles.unverified}>
                  {emailStatus.email}
                  {emailStatus.isVerified ? (
                    <span className={styles.badge}><FiCheck /> {t('profile.badgeVerified')}</span>
                  ) : (
                    <span className={styles.badgeWarning}><FiAlertCircle /> {t('profile.badgeUnverified')}</span>
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

        {/* Email Section */}
        <Card className={styles.emailCard}>
          <div className={styles.cardHeader}>
            <h3><FiMail /> {t('profile.email.title')}</h3>
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
                    <button
                      onClick={handleResendVerification}
                      disabled={isResendingVerification}
                      className={styles.resendBtn}
                    >
                      {isResendingVerification ? t('profile.email.resendSending') : t('profile.email.resend')}
                    </button>
                  </div>
                )}

                <div className={styles.emailActions}>
                  <motion.button
                    className={styles.btnSecondary}
                    onClick={() => setShowAddEmailModal(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiEdit2 /> {t('profile.email.change')}
                  </motion.button>
                  <motion.button
                    className={styles.btnDanger}
                    onClick={() => setShowRemoveEmailModal(true)}
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
                  <p className={styles.modalHintWarning}>
                    {t('profile.email.spamHint')}
                  </p>
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
                    onClick={() => setShowAddEmailModal(true)}
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
                  onClick={() => setShowAddEmailModal(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiPlus /> {t('profile.email.addEmail')}
                </motion.button>
              </div>
            )}
          </div>
        </Card>

        {/* Edit Profile Form */}
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

          {isEditing ? (
            <motion.form
              className={styles.form}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
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
                  onClick={handleSave}
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
              className={styles.viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.dataField}>
                <label>{t('profile.personal.usernameLabel')}</label>
                <p>{user.name}</p>
              </div>
            </motion.div>
          )}
        </Card>

        {/* Security Section */}
        <Card className={styles.securityCard}>
          <div className={styles.cardHeader}>
            <h3><FiShield /> {t('profile.security.title')}</h3>
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
                onClick={() => setShowChangePasswordModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t('profile.security.change')}
              </motion.button>
            </div>
          </div>
        </Card>

        {/* Account Actions */}
        <Card className={styles.actionsCard}>
          <div className={styles.cardHeader}>
            <h3>{t('profile.account.title')}</h3>
          </div>
          <div className={styles.actionsContent}>
            <motion.button
              className={styles.logoutBtn}
              onClick={handleLogout}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('profile.account.logout')}
            </motion.button>
            <motion.button
              className={styles.deleteBtn}
              onClick={() => setShowDeleteAccountModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('profile.account.delete')}
            </motion.button>
          </div>
        </Card>
      </motion.div>

      {/* ============================================ */}
      {/* MODALS */}
      {/* ============================================ */}

      {/* Add/Change Email Modal */}
      <AnimatePresence>
        {showAddEmailModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddEmailModal(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3>{emailStatus.hasEmail ? t('profile.modals.addEmail.titleChange') : t('profile.modals.addEmail.titleAdd')}</h3>
                <button onClick={() => setShowAddEmailModal(false)} aria-label={t('common.close')}><FiX /></button>
              </div>
              <form onSubmit={handleAddEmail} className={styles.modalContent}>
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
                <p className={styles.modalHint}>
                  {t('profile.modals.addEmail.hint')}
                </p>
                <p className={styles.modalHintWarning}>
                  {t('profile.modals.addEmail.spamHint')}
                </p>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.btnCancel}
                    onClick={() => setShowAddEmailModal(false)}
                  >
                    {t('profile.modals.addEmail.cancel')}
                  </button>
                  <button
                    type="submit"
                    className={styles.btnPrimary}
                    disabled={isAddingEmail}
                  >
                    {isAddingEmail ? t('profile.modals.addEmail.sending') : t('profile.modals.addEmail.submit')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Remove Email Modal */}
        {showRemoveEmailModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRemoveEmailModal(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3><FiTrash2 /> {t('profile.modals.removeEmail.title')}</h3>
                <button onClick={() => setShowRemoveEmailModal(false)} aria-label={t('common.close')}><FiX /></button>
              </div>
              <form onSubmit={handleRemoveEmail} className={styles.modalContent}>
                <div className={styles.formGroup}>
                  <label htmlFor="removeEmailPassword">{t('profile.modals.removeEmail.passwordLabel')}</label>
                  <input
                    type="password"
                    id="removeEmailPassword"
                    value={removeEmailForm.password}
                    onChange={(e) => setRemoveEmailForm((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder={t('profile.modals.removeEmail.passwordPlaceholder')}
                    className={styles.input}
                    required
                  />
                </div>
                <label className={styles.modalHint} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={removeEmailForm.confirmRemoval}
                    onChange={(e) => setRemoveEmailForm((prev) => ({ ...prev, confirmRemoval: e.target.checked }))}
                  />
                  <span>{t('profile.modals.removeEmail.confirmLabel')}</span>
                </label>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.btnCancel}
                    onClick={() => setShowRemoveEmailModal(false)}
                  >
                    {t('profile.modals.removeEmail.cancel')}
                  </button>
                  <button
                    type="submit"
                    className={styles.btnDanger}
                    disabled={isRemovingEmail}
                  >
                    {isRemovingEmail ? t('profile.modals.removeEmail.removing') : t('profile.modals.removeEmail.submit')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showChangePasswordModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowChangePasswordModal(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3>{t('profile.modals.changePassword.title')}</h3>
                <button onClick={() => setShowChangePasswordModal(false)} aria-label={t('common.close')}><FiX /></button>
              </div>
              <form onSubmit={handleChangePassword} className={styles.modalContent}>
                <div className={styles.formGroup}>
                  <label htmlFor="currentPassword">{t('profile.modals.changePassword.currentLabel')}</label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className={styles.input}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="newPassword">{t('profile.modals.changePassword.newLabel')}</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className={styles.input}
                    required
                    minLength={8}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword">{t('profile.modals.changePassword.confirmLabel')}</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className={styles.input}
                    required
                  />
                </div>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.btnCancel}
                    onClick={() => setShowChangePasswordModal(false)}
                  >
                    {t('profile.modals.changePassword.cancel')}
                  </button>
                  <button
                    type="submit"
                    className={styles.btnPrimary}
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? t('profile.modals.changePassword.changing') : t('profile.modals.changePassword.submit')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteAccountModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteAccountModal(false)}
          >
            <motion.div
              className={`${styles.modal} ${styles.dangerModal}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3><FiAlertTriangle /> {t('profile.modals.deleteAccount.title')}</h3>
                <button onClick={() => setShowDeleteAccountModal(false)} aria-label={t('common.close')}><FiX /></button>
              </div>
              <div className={styles.modalContent}>
                <div className={styles.dangerWarning}>
                  <p>{t('profile.modals.deleteAccount.warningPrimary')}</p>
                  <p>{t('profile.modals.deleteAccount.warningSecondary')}</p>
                </div>
                <div className={styles.formGroup}>
                  <label>{t('profile.modals.deleteAccount.confirmLabel', { value: deleteConfirmValue })}</label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className={styles.input}
                    placeholder={t('profile.modals.deleteAccount.placeholder', { value: deleteConfirmValue })}
                  />
                </div>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.btnCancel}
                    onClick={() => setShowDeleteAccountModal(false)}
                  >
                    {t('profile.modals.deleteAccount.cancel')}
                  </button>
                  <button
                    type="button"
                    className={styles.btnDanger}
                    disabled={deleteConfirmText !== deleteConfirmValue}
                    onClick={handleDeleteAccount}
                  >
                    {t('profile.modals.deleteAccount.submit')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
