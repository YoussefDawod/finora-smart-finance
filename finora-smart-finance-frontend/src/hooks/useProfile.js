/**
 * useProfile Hook
 * Manages all profile-related state and operations
 */

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './useToast';
import authService from '@/api/authService';

export function useProfile() {
  const { user, refreshUser } = useAuth();
  useToast();

  // ============================================
  // PROFILE FORM STATE
  // ============================================
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // ============================================
  // EMAIL STATE
  // ============================================
  const [emailStatus, setEmailStatus] = useState({
    hasEmail: false,
    email: '',
    isVerified: false,
    canResetPassword: false,
    pendingEmail: null,
    loading: true,
  });
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [isRemovingEmail, setIsRemovingEmail] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  // ============================================
  // PASSWORD STATE
  // ============================================
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // ============================================
  // PROFILE HANDLERS
  // ============================================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const trimmedName = formData.name?.trim();
    if (!trimmedName || trimmedName.length < 3) {
      return { success: false, error: 'nameMin' };
    }
    if (trimmedName.length > 50) {
      return { success: false, error: 'nameMax' };
    }

    setIsSaving(true);
    try {
      await authService.updateProfile({ name: trimmedName });
      await refreshUser();
      setIsEditing(false);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'saveError' };
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: user?.name || '' });
    setIsEditing(false);
  };

  // ============================================
  // EMAIL HANDLERS
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
      setEmailStatus((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const handleAddEmail = async (newEmail) => {
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return { success: false, error: 'invalidEmail', link: null };
    }
    if (emailStatus.hasEmail && newEmail === emailStatus.email) {
      return { success: false, error: 'sameEmail', link: null };
    }

    setIsAddingEmail(true);
    try {
      const isChange = emailStatus.hasEmail;
      const response = isChange
        ? await authService.changeEmail(newEmail)
        : await authService.addEmail(newEmail);

      await fetchEmailStatus();
      return {
        success: true,
        message: isChange ? 'verificationSentChange' : 'verificationSentAdd',
        link: response.data?.data?.verificationLink || null,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'emailSendError',
        link: null,
      };
    } finally {
      setIsAddingEmail(false);
    }
  };

  const handleRemoveEmail = async (password, confirmRemoval) => {
    if (!password) {
      return { success: false, error: 'passwordRequired' };
    }
    if (!confirmRemoval) {
      return { success: false, error: 'confirmRemoval' };
    }

    setIsRemovingEmail(true);
    try {
      await authService.removeEmail(password, true);
      await fetchEmailStatus();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'emailRemoveError' };
    } finally {
      setIsRemovingEmail(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResendingVerification(true);
    try {
      await authService.resendVerification();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'emailSendError' };
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleResendAddEmailVerification = async () => {
    setIsResendingVerification(true);
    try {
      const response = await authService.resendAddEmailVerification();
      const email = response.data?.data?.email;
      return { success: true, email };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'emailSendError' };
    } finally {
      setIsResendingVerification(false);
    }
  };

  // ============================================
  // PASSWORD HANDLERS
  // ============================================
  const handleChangePassword = async (currentPassword, newPassword, confirmPassword) => {
    if (newPassword !== confirmPassword) {
      return { success: false, error: 'passwordMismatch' };
    }

    const strong = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!strong.test(newPassword)) {
      return { success: false, error: 'passwordWeak' };
    }

    setIsChangingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'passwordChangeError' };
    } finally {
      setIsChangingPassword(false);
    }
  };

  return {
    // Profile
    isEditing,
    setIsEditing,
    formData,
    setFormData,
    handleInputChange,
    handleSave,
    handleCancel,
    isSaving,

    // Email
    emailStatus,
    fetchEmailStatus,
    isAddingEmail,
    isRemovingEmail,
    isResendingVerification,
    handleAddEmail,
    handleRemoveEmail,
    handleResendVerification,
    handleResendAddEmailVerification,

    // Password
    passwordForm,
    setPasswordForm,
    isChangingPassword,
    handleChangePassword,
  };
}
