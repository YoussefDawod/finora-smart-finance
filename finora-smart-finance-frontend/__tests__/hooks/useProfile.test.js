/**
 * @fileoverview useProfile Custom Hook Tests
 * @description Unit tests for profile state management hook
 */
/* eslint-disable */

import { renderHook, act, waitFor } from '@testing-library/react';
import useProfile from '../../hooks/useProfile';
import * as userService from '../../api/userService';
import * as authService from '../../api/authService';

// Mock API services
jest.mock('../../api/userService');
jest.mock('../../api/authService');

describe('useProfile Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  // ============================================
  // Initial State Tests
  // ============================================
  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useProfile());

      expect(result.current.profile).toEqual({
        name: '',
        email: '',
        emails: [],
        verifiedEmail: false,
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should fetch user profile on mount', async () => {
      const mockProfile = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        emails: ['max@example.com'],
        verifiedEmail: true,
      };

      mockUserService.getProfile = jest.fn().mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useProfile());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.profile).toEqual(mockProfile);
      expect(userService.getProfile).toHaveBeenCalled();
    });

    it('should handle profile fetch error', async () => {
      const mockError = new Error('Failed to fetch profile');
      userService.getProfile = jest.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.profile.name).toBe('');
    });
  });

  // ============================================
  // Profile Edit Tests
  // ============================================
  describe('editProfile', () => {
    it('should update profile successfully', async () => {
      const mockProfile = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        emails: ['max@example.com'],
        verifiedEmail: true,
      };

      userService.getProfile = jest.fn().mockResolvedValue(mockProfile);
      userService.updateProfile = jest
        .fn()
        .mockResolvedValue({ name: 'Neuer Name', ...mockProfile });

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.editProfile({ name: 'Neuer Name' });
      });

      await waitFor(() => {
        expect(result.current.profile.name).toBe('Neuer Name');
      });

      expect(userService.updateProfile).toHaveBeenCalledWith({ name: 'Neuer Name' });
    });

    it('should handle profile update error', async () => {
      const mockProfile = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        emails: [],
        verifiedEmail: false,
      };

      userService.getProfile = jest.fn().mockResolvedValue(mockProfile);
      userService.updateProfile = jest.fn().mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.editProfile({ name: 'Neuer Name' });
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.profile.name).toBe('Max Mustermann');
    });

    it('should validate name update', async () => {
      const mockProfile = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        emails: [],
        verifiedEmail: false,
      };

      userService.getProfile = jest.fn().mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.editProfile({ name: '' });
      });

      expect(result.current.error).toBeTruthy();
      expect(userService.updateProfile).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // Email Management Tests
  // ============================================
  describe('Email Management', () => {
    it('should send verification email', async () => {
      const mockProfile = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        emails: ['max@example.com'],
        verifiedEmail: false,
      };

      userService.getProfile = jest.fn().mockResolvedValue(mockProfile);
      userService.sendVerificationEmail = jest.fn().mockResolvedValue({ sent: true });

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.sendVerificationEmail();
      });

      expect(userService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should handle verification email send error', async () => {
      const mockProfile = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        emails: [],
        verifiedEmail: false,
      };

      userService.getProfile = jest.fn().mockResolvedValue(mockProfile);
      userService.sendVerificationEmail = jest
        .fn()
        .mockRejectedValue(new Error('Email send failed'));

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.sendVerificationEmail();
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should add new email', async () => {
      const mockProfile = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        emails: ['max@example.com'],
        verifiedEmail: true,
      };

      userService.getProfile = jest.fn().mockResolvedValue(mockProfile);
      userService.initiateEmailChange = jest
        .fn()
        .mockResolvedValue({ initiated: true });

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.addEmail('new@example.com');
      });

      expect(userService.initiateEmailChange).toHaveBeenCalledWith('new@example.com');
    });

    it('should remove email', async () => {
      const mockProfile = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        emails: ['max@example.com', 'secondary@example.com'],
        verifiedEmail: true,
      };

      userService.getProfile = jest.fn().mockResolvedValue(mockProfile);
      userService.removeEmail = jest.fn().mockResolvedValue({ removed: true });

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.removeEmail('secondary@example.com');
      });

      expect(userService.removeEmail).toHaveBeenCalledWith('secondary@example.com');
    });

    it('should verify email change', async () => {
      const mockProfile = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        emails: [],
        verifiedEmail: false,
      };

      userService.getProfile = jest.fn().mockResolvedValue(mockProfile);
      userService.verifyEmailChange = jest.fn().mockResolvedValue({ changed: true });

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.verifyEmailChange('email-token');
      });

      expect(userService.verifyEmailChange).toHaveBeenCalledWith('email-token');
    });
  });

  // ============================================
  // Password Management Tests
  // ============================================
  describe('Password Management', () => {
    it('should change password', async () => {
      const mockProfile = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        emails: [],
        verifiedEmail: false,
      };

      userService.getProfile = jest.fn().mockResolvedValue(mockProfile);
      authService.changePassword = jest
        .fn()
        .mockResolvedValue({ changed: true });

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.changePassword('oldPassword', 'newPassword');
      });

      expect(authService.changePassword).toHaveBeenCalledWith(
        'oldPassword',
        'newPassword'
      );
    });

    it('should handle password change error', async () => {
      const mockProfile = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        emails: [],
        verifiedEmail: false,
      };

      userService.getProfile = jest.fn().mockResolvedValue(mockProfile);
      authService.changePassword = jest
        .fn()
        .mockRejectedValue(new Error('Invalid current password'));

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.changePassword('wrongPassword', 'newPassword');
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should initiate password reset', async () => {
      const mockProfile = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        emails: [],
        verifiedEmail: false,
      };

      userService.getProfile = jest.fn().mockResolvedValue(mockProfile);
      authService.initiatePasswordReset = jest
        .fn()
        .mockResolvedValue({ initiated: true });

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.initiatePasswordReset();
      });

      expect(authService.initiatePasswordReset).toHaveBeenCalled();
    });
  });

  // ============================================
  // Account Deletion Tests
  // ============================================
  describe('Account Deletion', () => {
    it('should delete account with password confirmation', async () => {
      const mockProfile = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        emails: [],
        verifiedEmail: false,
      };

      userService.getProfile = jest.fn().mockResolvedValue(mockProfile);
      userService.deleteAccount = jest
        .fn()
        .mockResolvedValue({ deleted: true });

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.deleteAccount('password');
      });

      expect(userService.deleteAccount).toHaveBeenCalledWith('password');
    });

    it('should handle account deletion error', async () => {
      const mockProfile = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        emails: [],
        verifiedEmail: false,
      };

      userService.getProfile = jest.fn().mockResolvedValue(mockProfile);
      userService.deleteAccount = jest
        .fn()
        .mockRejectedValue(new Error('Deletion failed'));

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.deleteAccount('password');
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  // ============================================
  // Form State Tests
  // ============================================
  describe('Form State Management', () => {
    it('should manage form state for profile edit', async () => {
      const mockProfile = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        emails: [],
        verifiedEmail: false,
      };

      userService.getProfile = jest.fn().mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setEditFormData({ name: 'Neuer Name' });
      });

      expect(result.current.editFormData.name).toBe('Neuer Name');
    });

    it('should manage form state for password change', async () => {
      const mockProfile = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        emails: [],
        verifiedEmail: false,
      };

      userService.getProfile = jest.fn().mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setPasswordFormData({
          oldPassword: 'old',
          newPassword: 'new',
        });
      });

      expect(result.current.passwordFormData.oldPassword).toBe('old');
    });

    it('should clear form data after successful operation', async () => {
      const mockProfile = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        emails: [],
        verifiedEmail: false,
      };

      userService.getProfile = jest.fn().mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setPasswordFormData({
          oldPassword: 'old',
          newPassword: 'new',
        });
      });

      expect(result.current.passwordFormData.newPassword).toBe('new');

      act(() => {
        result.current.clearPasswordForm();
      });

      expect(result.current.passwordFormData.oldPassword).toBe('');
      expect(result.current.passwordFormData.newPassword).toBe('');
    });
  });

  // ============================================
  // Error Handling Tests
  // ============================================
  describe('Error Handling', () => {
    it('should clear error after dismissal', async () => {
      const mockProfile = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        emails: [],
        verifiedEmail: false,
      };

      userService.getProfile = jest.fn().mockResolvedValue(mockProfile);
      userService.updateProfile = jest.fn().mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.editProfile({ name: 'New Name' });
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should set custom error message', async () => {
      const mockProfile = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        emails: [],
        verifiedEmail: false,
      };

      userService.getProfile = jest.fn().mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setError('Custom error message');
      });

      expect(result.current.error).toBe('Custom error message');
    });
  });
});
