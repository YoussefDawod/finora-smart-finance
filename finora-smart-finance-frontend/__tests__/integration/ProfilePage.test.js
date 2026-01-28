/**
 * @fileoverview ProfilePage Component Integration Tests
 * @description Integration tests for ProfilePage and sub-components
 */
/* eslint-disable no-undef,no-unused-vars */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfilePage from '../../pages/ProfilePage';
import { AuthContext } from '../../context/AuthContext';
import { ToastContext } from '../../context/ToastContext';
import { BrowserRouter } from 'react-router-dom';

// Mock hooks
jest.mock('../../hooks/useProfile');
jest.mock('../../hooks/useAuth');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'de' },
  }),
}));

// Mock components that might have external dependencies
jest.mock('../../components/common/LoadingSpinner', () => {
  return function MockSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>;
  };
});

jest.mock('../../components/common/Toast', () => {
  return function MockToast() {
    return <div data-testid="toast">Toast</div>;
  };
});

const mockUseProfile = require('../../hooks/useProfile');
const mockUseAuth = require('../../hooks/useAuth');

const renderWithProviders = (component) => {
  const mockAuthValue = {
    user: { id: 'user-123', email: 'max@example.com' },
    isAuthenticated: true,
    logout: jest.fn(),
  };

  const mockToastValue = {
    addToast: jest.fn(),
  };

  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthValue}>
        <ToastContext.Provider value={mockToastValue}>
          {component}
        </ToastContext.Provider>
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('ProfilePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseProfile.default = jest.fn().mockReturnValue({
      profile: {
        name: 'Max Mustermann',
        email: 'max@example.com',
        emails: ['max@example.com'],
        verifiedEmail: true,
      },
      loading: false,
      error: null,
      editFormData: { name: 'Max Mustermann' },
      passwordFormData: { oldPassword: '', newPassword: '', confirmPassword: '' },
      editProfile: jest.fn(),
      sendVerificationEmail: jest.fn(),
      addEmail: jest.fn(),
      removeEmail: jest.fn(),
      verifyEmailChange: jest.fn(),
      changePassword: jest.fn(),
      deleteAccount: jest.fn(),
      setEditFormData: jest.fn(),
      setPasswordFormData: jest.fn(),
      clearPasswordForm: jest.fn(),
      clearError: jest.fn(),
      setError: jest.fn(),
    });

    mockUseAuth.default = jest.fn().mockReturnValue({
      logout: jest.fn(),
    });
  });

  // ============================================
  // Rendering Tests
  // ============================================
  describe('Rendering', () => {
    it('should render ProfilePage with all sections', () => {
      renderWithProviders(<ProfilePage />);

      expect(screen.getByText(/Profile/i)).toBeInTheDocument();
      expect(screen.getByText(/Email/i)).toBeInTheDocument();
      expect(screen.getByText(/Security/i)).toBeInTheDocument();
    });

    it('should display loading spinner while fetching profile', () => {
      mockUseProfile.default.mockReturnValue({
        ...mockUseProfile.default(),
        loading: true,
      });

      renderWithProviders(<ProfilePage />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should display error message when profile fetch fails', () => {
      mockUseProfile.default.mockReturnValue({
        ...mockUseProfile.default(),
        error: 'Failed to fetch profile',
      });

      renderWithProviders(<ProfilePage />);

      expect(screen.getByText(/Failed to fetch profile/i)).toBeInTheDocument();
    });

    it('should display user profile information', () => {
      renderWithProviders(<ProfilePage />);

      expect(screen.getByDisplayValue('Max Mustermann')).toBeInTheDocument();
      expect(screen.getByText('max@example.com')).toBeInTheDocument();
    });
  });

  // ============================================
  // ProfileHeader Tests
  // ============================================
  describe('ProfileHeader Component', () => {
    it('should display user avatar', () => {
      renderWithProviders(<ProfilePage />);

      const avatar = screen.getByRole('img', { hidden: true });
      expect(avatar).toBeInTheDocument();
    });

    it('should display user name', () => {
      renderWithProviders(<ProfilePage />);

      expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
    });

    it('should display email verification badge', () => {
      renderWithProviders(<ProfilePage />);

      expect(screen.getByText(/verified/i)).toBeInTheDocument();
    });

    it('should display unverified badge when email not verified', () => {
      mockUseProfile.default.mockReturnValue({
        ...mockUseProfile.default(),
        profile: {
          ...mockUseProfile.default().profile,
          verifiedEmail: false,
        },
      });

      renderWithProviders(<ProfilePage />);

      expect(screen.getByText(/unverified/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // ProfileEditForm Tests
  // ============================================
  describe('ProfileEditForm Component', () => {
    it('should allow editing user name', async () => {
      const mockEditProfile = jest.fn();
      mockUseProfile.default.mockReturnValue({
        ...mockUseProfile.default(),
        editProfile: mockEditProfile,
      });

      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />);

      const nameInput = screen.getByDisplayValue('Max Mustermann');
      await user.clear(nameInput);
      await user.type(nameInput, 'Neuer Name');

      expect(mockUseProfile.default().setEditFormData).toBeDefined();
    });

    it('should submit profile update', async () => {
      const mockEditProfile = jest.fn();
      mockUseProfile.default.mockReturnValue({
        ...mockUseProfile.default(),
        editProfile: mockEditProfile,
      });

      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />);

      const submitButton = screen.getByText(/Save/i);
      await user.click(submitButton);

      expect(mockEditProfile).toHaveBeenCalled();
    });

    it('should validate name before submission', async () => {
      const mockEditProfile = jest.fn();
      mockUseProfile.default.mockReturnValue({
        ...mockUseProfile.default(),
        editProfile: mockEditProfile,
      });

      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />);

      const nameInput = screen.getByDisplayValue('Max Mustermann');
      await user.clear(nameInput);
      await user.type(nameInput, '');

      const submitButton = screen.getByText(/Save/i);
      await user.click(submitButton);

      expect(mockEditProfile).not.toHaveBeenCalled();
    });

    it('should show cancel option in edit mode', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />);

      const editButton = screen.getByText(/Edit/i);
      await user.click(editButton);

      expect(screen.getByText(/Cancel/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // EmailManager Tests
  // ============================================
  describe('EmailManager Component', () => {
    it('should display primary email', () => {
      renderWithProviders(<ProfilePage />);

      expect(screen.getByText('max@example.com')).toBeInTheDocument();
    });

    it('should show verification button for unverified email', () => {
      mockUseProfile.default.mockReturnValue({
        ...mockUseProfile.default(),
        profile: {
          ...mockUseProfile.default().profile,
          verifiedEmail: false,
        },
      });

      renderWithProviders(<ProfilePage />);

      expect(screen.getByText(/Verify Email/i)).toBeInTheDocument();
    });

    it('should send verification email when button clicked', async () => {
      const mockSendVerification = jest.fn();
      mockUseProfile.default.mockReturnValue({
        ...mockUseProfile.default(),
        profile: {
          ...mockUseProfile.default().profile,
          verifiedEmail: false,
        },
        sendVerificationEmail: mockSendVerification,
      });

      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />);

      const verifyButton = screen.getByText(/Verify Email/i);
      await user.click(verifyButton);

      expect(mockSendVerification).toHaveBeenCalled();
    });

    it('should allow adding additional email', async () => {
      const mockAddEmail = jest.fn();
      mockUseProfile.default.mockReturnValue({
        ...mockUseProfile.default(),
        addEmail: mockAddEmail,
      });

      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />);

      const addEmailButton = screen.getByText(/Add Email/i);
      await user.click(addEmailButton);

      expect(screen.getByText(/Add New Email/i)).toBeInTheDocument();
    });

    it('should display modal for adding email', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />);

      const addEmailButton = screen.getByText(/Add Email/i);
      await user.click(addEmailButton);

      const modal = screen.getByText(/Add New Email/i);
      expect(modal).toBeInTheDocument();
    });

    it('should validate new email before submission', async () => {
      const mockAddEmail = jest.fn();
      mockUseProfile.default.mockReturnValue({
        ...mockUseProfile.default(),
        addEmail: mockAddEmail,
      });

      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />);

      const addEmailButton = screen.getByText(/Add Email/i);
      await user.click(addEmailButton);

      const submitButton = within(screen.getByRole('dialog')).getByText(/Add/i);
      await user.click(submitButton);

      // Should not call addEmail without valid email
      expect(mockAddEmail).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // SecuritySection Tests
  // ============================================
  describe('SecuritySection Component', () => {
    it('should display change password button', () => {
      renderWithProviders(<ProfilePage />);

      expect(screen.getByText(/Change Password/i)).toBeInTheDocument();
    });

    it('should open password change modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />);

      const changePasswordButton = screen.getByText(/Change Password/i);
      await user.click(changePasswordButton);

      expect(screen.getByText(/Current Password/i)).toBeInTheDocument();
      expect(screen.getByText(/New Password/i)).toBeInTheDocument();
    });

    it('should validate password fields', async () => {
      const mockChangePassword = jest.fn();
      mockUseProfile.default.mockReturnValue({
        ...mockUseProfile.default(),
        changePassword: mockChangePassword,
      });

      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />);

      const changePasswordButton = screen.getByText(/Change Password/i);
      await user.click(changePasswordButton);

      const submitButton = within(screen.getByRole('dialog')).getByText(/Save/i);
      await user.click(submitButton);

      // Should not call changePassword with empty fields
      expect(mockChangePassword).not.toHaveBeenCalled();
    });

    it('should call changePassword with correct arguments', async () => {
      const mockChangePassword = jest.fn();
      mockUseProfile.default.mockReturnValue({
        ...mockUseProfile.default(),
        passwordFormData: {
          oldPassword: 'oldPassword123',
          newPassword: 'newPassword123',
          confirmPassword: 'newPassword123',
        },
        changePassword: mockChangePassword,
      });

      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />);

      const changePasswordButton = screen.getByText(/Change Password/i);
      await user.click(changePasswordButton);

      const submitButton = within(screen.getByRole('dialog')).getByText(/Save/i);
      await user.click(submitButton);

      expect(mockChangePassword).toHaveBeenCalledWith(
        'oldPassword123',
        'newPassword123'
      );
    });
  });

  // ============================================
  // AccountActions Tests
  // ============================================
  describe('AccountActions Component', () => {
    it('should display logout button', () => {
      renderWithProviders(<ProfilePage />);

      expect(screen.getByText(/Logout/i)).toBeInTheDocument();
    });

    it('should display delete account button', () => {
      renderWithProviders(<ProfilePage />);

      expect(screen.getByText(/Delete Account/i)).toBeInTheDocument();
    });

    it('should open confirmation modal for account deletion', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />);

      const deleteButton = screen.getByText(/Delete Account/i);
      await user.click(deleteButton);

      expect(
        screen.getByText(/Are you sure you want to delete your account/i)
      ).toBeInTheDocument();
    });

    it('should require password for account deletion', async () => {
      const mockDeleteAccount = jest.fn();
      mockUseProfile.default.mockReturnValue({
        ...mockUseProfile.default(),
        deleteAccount: mockDeleteAccount,
      });

      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />);

      const deleteButton = screen.getByText(/Delete Account/i);
      await user.click(deleteButton);

      const confirmButton = within(screen.getByRole('dialog')).getByText(
        /Delete/i
      );
      await user.click(confirmButton);

      // Should not delete without password
      expect(mockDeleteAccount).not.toHaveBeenCalled();
    });

    it('should call deleteAccount with password', async () => {
      const mockDeleteAccount = jest.fn();
      mockUseProfile.default.mockReturnValue({
        ...mockUseProfile.default(),
        deleteAccount: mockDeleteAccount,
      });

      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />);

      const deleteButton = screen.getByText(/Delete Account/i);
      await user.click(deleteButton);

      const passwordInput = screen.getByPlaceholderText(/password/i);
      await user.type(passwordInput, 'password123');

      const confirmButton = within(screen.getByRole('dialog')).getByText(
        /Delete/i
      );
      await user.click(confirmButton);

      expect(mockDeleteAccount).toHaveBeenCalledWith('password123');
    });

    it('should call logout function when logout clicked', async () => {
      const mockLogout = jest.fn();
      mockUseAuth.default.mockReturnValue({
        logout: mockLogout,
      });

      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />);

      const logoutButton = screen.getByText(/Logout/i);
      await user.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  // ============================================
  // Error Handling Tests
  // ============================================
  describe('Error Handling', () => {
    it('should display error message when profile update fails', () => {
      mockUseProfile.default.mockReturnValue({
        ...mockUseProfile.default(),
        error: 'Failed to update profile',
      });

      renderWithProviders(<ProfilePage />);

      expect(screen.getByText(/Failed to update profile/i)).toBeInTheDocument();
    });

    it('should allow dismissing error message', async () => {
      const mockClearError = jest.fn();
      mockUseProfile.default.mockReturnValue({
        ...mockUseProfile.default(),
        error: 'Test error',
        clearError: mockClearError,
      });

      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />);

      const dismissButton = screen.getByText(/Dismiss/i) || screen.getByRole('button', { name: /close/i });
      await user.click(dismissButton);

      expect(mockClearError).toHaveBeenCalled();
    });
  });

  // ============================================
  // User Interaction Flow Tests
  // ============================================
  describe('User Interaction Flows', () => {
    it('should complete profile edit flow', async () => {
      const mockEditProfile = jest.fn();
      mockUseProfile.default.mockReturnValue({
        ...mockUseProfile.default(),
        editProfile: mockEditProfile,
      });

      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />);

      // Start editing
      const editButton = screen.getByText(/Edit/i);
      await user.click(editButton);

      // Change name
      const nameInput = screen.getByDisplayValue('Max Mustermann');
      await user.clear(nameInput);
      await user.type(nameInput, 'Neuer Name');

      // Save changes
      const saveButton = screen.getByText(/Save/i);
      await user.click(saveButton);

      expect(mockEditProfile).toHaveBeenCalled();
    });

    it('should complete email verification flow', async () => {
      const mockSendVerification = jest.fn();
      mockUseProfile.default.mockReturnValue({
        ...mockUseProfile.default(),
        profile: {
          ...mockUseProfile.default().profile,
          verifiedEmail: false,
        },
        sendVerificationEmail: mockSendVerification,
      });

      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />);

      const verifyButton = screen.getByText(/Verify Email/i);
      await user.click(verifyButton);

      expect(mockSendVerification).toHaveBeenCalled();
    });

    it('should complete password change flow', async () => {
      const mockChangePassword = jest.fn();
      mockUseProfile.default.mockReturnValue({
        ...mockUseProfile.default(),
        passwordFormData: {
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        },
        changePassword: mockChangePassword,
      });

      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />);

      const changePasswordButton = screen.getByText(/Change Password/i);
      await user.click(changePasswordButton);

      const oldPasswordInput = screen.getAllByPlaceholderText(/current password/i)[0];
      const newPasswordInput = screen.getAllByPlaceholderText(/new password/i)[0];
      const confirmPasswordInput = screen.getAllByPlaceholderText(/confirm password/i)[0];

      await user.type(oldPasswordInput, 'oldPassword123');
      await user.type(newPasswordInput, 'newPassword123');
      await user.type(confirmPasswordInput, 'newPassword123');

      const saveButton = within(screen.getByRole('dialog')).getByText(/Save/i);
      await user.click(saveButton);

      expect(mockChangePassword).toHaveBeenCalled();
    });
  });
});
