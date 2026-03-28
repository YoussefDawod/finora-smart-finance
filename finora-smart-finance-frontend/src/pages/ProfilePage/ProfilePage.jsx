/**
 * @fileoverview ProfilePage Component
 * @description User profile management page with email and security management
 * Refactored to use specialized components and custom hooks
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useMotion } from '@/hooks/useMotion';
import { useToast } from '@/hooks/useToast';
import { useProfile } from '@/hooks/useProfile';
import userService from '@/api/userService';
import Skeleton from '@/components/common/Skeleton/Skeleton';
import AuthRequiredOverlay from '@/components/common/AuthRequiredOverlay/AuthRequiredOverlay';
import {
  ProfileHeader,
  ProfileEditForm,
  EmailManager,
  SecuritySection,
  AccountActions,
  AddEmailModal,
  RemoveEmailModal,
  ChangePasswordModal,
  DeleteAccountModal,
} from './components';
import styles from './ProfilePage.module.scss';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { shouldAnimate } = useMotion();
  const toast = useToast();
  const { t } = useTranslation();

  // Modal States
  const [showAddEmailModal, setShowAddEmailModal] = useState(false);
  const [showRemoveEmailModal, setShowRemoveEmailModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Use custom hook for all profile logic
  const {
    isEditing,
    setIsEditing,
    formData,
    handleInputChange,
    handleSave,
    handleCancel,
    isSaving,
    emailStatus,
    fetchEmailStatus,
    isAddingEmail,
    isRemovingEmail,
    isResendingVerification,
    handleAddEmail,
    handleRemoveEmail,
    handleResendVerification,
    handleResendAddEmailVerification,
    isChangingPassword,
    handleChangePassword,
  } = useProfile();

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchEmailStatus();
    }
  }, [isAuthenticated, user, fetchEmailStatus]);

  // ============================================
  // GUEST VIEW (unauthenticated)
  // ============================================
  if (!isLoading && !isAuthenticated) {
    return (
      <section className={styles.profilePage}>
        <div className={styles.pageHeader}>
          <h1>{t('profile.title')}</h1>
          <p>{t('profile.subtitle')}</p>
        </div>
        <AuthRequiredOverlay>
          <div className={styles.content}>
            {/* Placeholder profile card for guests */}
            <div className={styles.profileCard}>
              <div className={styles.profileCardHeader}>
                <div className={styles.skeletonAvatar} />
                <div className={styles.skeletonInfo}>
                  <Skeleton
                    width="180px"
                    height="28px"
                    borderRadius="var(--r-md)"
                    animated={false}
                  />
                  <Skeleton
                    width="220px"
                    height="18px"
                    borderRadius="var(--r-sm)"
                    animated={false}
                  />
                  <Skeleton
                    width="100px"
                    height="24px"
                    borderRadius="var(--r-full)"
                    animated={false}
                  />
                </div>
              </div>
            </div>
            <div className={styles.section}>
              <Skeleton width="140px" height="24px" borderRadius="var(--r-md)" animated={false} />
              <Skeleton width="100%" height="80px" borderRadius="var(--r-lg)" animated={false} />
            </div>
            <div className={styles.section}>
              <Skeleton width="160px" height="24px" borderRadius="var(--r-md)" animated={false} />
              <Skeleton
                count={2}
                width="100%"
                height="48px"
                gap="var(--space-md)"
                borderRadius="var(--r-lg)"
                animated={false}
              />
            </div>
          </div>
        </AuthRequiredOverlay>
      </section>
    );
  }

  // ============================================
  // LOADING SKELETON
  // ============================================
  if (isLoading) {
    return (
      <section className={styles.profilePage} aria-busy="true" aria-label={t('common.loading')}>
        {/* Page Header Skeleton */}
        <div className={styles.pageHeader}>
          <Skeleton width="200px" height="36px" borderRadius="var(--r-md)" />
          <Skeleton width="280px" height="22px" borderRadius="var(--r-sm)" />
        </div>

        {/* Content Skeleton */}
        <div className={styles.content}>
          {/* Profile Card Skeleton */}
          <div className={styles.profileCard}>
            <div className={styles.profileCardHeader}>
              <Skeleton variant="rect" width="120px" height="120px" borderRadius="var(--r-lg)" />
              <div className={styles.skeletonInfo}>
                <Skeleton width="180px" height="28px" borderRadius="var(--r-md)" />
                <Skeleton width="220px" height="18px" borderRadius="var(--r-sm)" />
                <Skeleton width="100px" height="24px" borderRadius="var(--r-full)" />
              </div>
            </div>
          </div>

          {/* Email Section Skeleton */}
          <div className={styles.section}>
            <Skeleton width="140px" height="24px" borderRadius="var(--r-md)" />
            <Skeleton width="100%" height="80px" borderRadius="var(--r-lg)" />
          </div>

          {/* Edit Form Skeleton */}
          <div className={styles.section}>
            <Skeleton width="160px" height="24px" borderRadius="var(--r-md)" />
            <Skeleton
              count={3}
              width="100%"
              height="48px"
              gap="var(--space-md)"
              borderRadius="var(--r-lg)"
            />
          </div>

          {/* Security Section Skeleton */}
          <div className={styles.section}>
            <Skeleton width="120px" height="24px" borderRadius="var(--r-md)" />
            <Skeleton width="100%" height="60px" borderRadius="var(--r-lg)" />
          </div>
        </div>
      </section>
    );
  }
  if (!user) return null;

  // ============================================
  // HANDLERS
  // ============================================
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleDeleteAccount = async password => {
    try {
      await userService.deleteAccount(password);
      toast.success(t('profile.toasts.accountDeleted'));
      await logout();
      navigate('/dashboard', { replace: true });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || t('profile.toasts.accountDeleteError'),
      };
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

  // ============================================
  // RENDER
  // ============================================
  return (
    <motion.section
      className={styles.profilePage}
      initial={shouldAnimate ? 'hidden' : false}
      animate={shouldAnimate ? 'visible' : false}
      variants={containerVariants}
    >
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1>{t('profile.title')}</h1>
        <p>{t('profile.subtitle')}</p>
      </div>

      {/* Main Content */}
      <motion.div className={styles.content}>
        <ProfileHeader user={user} emailStatus={emailStatus} />
        <EmailManager
          emailStatus={emailStatus}
          isAddingEmail={isAddingEmail}
          isRemovingEmail={isRemovingEmail}
          isResendingVerification={isResendingVerification}
          onAddEmail={() => setShowAddEmailModal(true)}
          onRemoveEmail={() => setShowRemoveEmailModal(true)}
          onResendVerification={handleResendVerification}
          onResendAddEmailVerification={handleResendAddEmailVerification}
        />
        <ProfileEditForm
          user={user}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          formData={formData}
          handleInputChange={handleInputChange}
          handleSave={handleSave}
          handleCancel={handleCancel}
          isSaving={isSaving}
        />
        <SecuritySection onChangePassword={() => setShowChangePasswordModal(true)} />
        <AccountActions onLogout={handleLogout} onDelete={() => setShowDeleteAccountModal(true)} />
      </motion.div>

      {/* Modals */}
      <AddEmailModal
        isOpen={showAddEmailModal}
        onClose={() => setShowAddEmailModal(false)}
        hasEmail={emailStatus.hasEmail}
        onSubmit={handleAddEmail}
        isLoading={isAddingEmail}
      />

      <RemoveEmailModal
        isOpen={showRemoveEmailModal}
        onClose={() => setShowRemoveEmailModal(false)}
        onSubmit={handleRemoveEmail}
        isLoading={isRemovingEmail}
      />

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSubmit={handleChangePassword}
        isLoading={isChangingPassword}
      />

      <DeleteAccountModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onSubmit={handleDeleteAccount}
        isLoading={false}
      />
    </motion.section>
  );
}
