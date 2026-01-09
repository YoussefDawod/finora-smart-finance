import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import Modal from './Modal/Modal';
import LoadingSpinner from './LoadingSpinner/LoadingSpinner';
import { authService } from '../api/authService';
import './styles/accountDeletionDialog.scss';

/**
 * AccountDeletionDialog - 2-Step Account Deletion Confirmation
 * 
 * Features:
 * - Step 1: Warning & Confirmation
 * - Step 2: Email Verification
 * - Loading State during Deletion
 * - Error Handling
 * - Success + Redirect
 * 
 * Props:
 *   - isOpen: boolean
 *   - onClose: () => void
 */
const AccountDeletionDialog = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { success: showSuccess, error: showError } = useToast();

  // Dialog State
  const [step, setStep] = useState(1);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const emailInputRef = useRef(null);

  /**
   * Reset dialog state when closed
   */
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setConfirmEmail('');
      setError(null);
    } else {
      // Focus email input when step 2 is reached
      if (step === 2) {
        setTimeout(() => {
          emailInputRef.current?.focus();
        }, 100);
      }
    }
  }, [isOpen, step]);

  /**
   * Check if email matches
   */
  const emailMatches = confirmEmail.toLowerCase() === user?.email?.toLowerCase();

  /**
   * Go to step 2 (Email Verification)
   */
  const handleGoToStep2 = useCallback(() => {
    setError(null);
    setConfirmEmail('');
    setStep(2);
  }, []);

  /**
   * Go back to step 1
   */
  const handleGoBack = useCallback(() => {
    setError(null);
    setConfirmEmail('');
    setStep(1);
  }, []);

  /**
   * Handle email input change
   */
  const handleEmailChange = useCallback((e) => {
    setConfirmEmail(e.target.value);
    setError(null);
  }, []);

  /**
   * Handle account deletion
   */
  const handleDeleteAccount = useCallback(async () => {
    // Final validation
    if (!emailMatches) {
      setError('Email stimmt nicht überein');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call DELETE /api/users/me
      const response = await authService.deleteAccount(user?.email);

      if (response.success) {
        // Show success notification
        showSuccess('Account wurde permanently gelöscht');

        // Close dialog
        onClose();

        // Clear auth state and logout
        await logout();

        // Redirect to login
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1000);
      } else {
        setError(response.message || 'Fehler beim Löschen des Accounts');
        showError(response.message || 'Fehler beim Löschen des Accounts');
      }
    } catch (err) {
      let errorMsg = 'Fehler beim Löschen des Accounts';

      if (err.response?.status === 401) {
        // Unauthorized - might need to re-login
        errorMsg = 'Authentifizierung erforderlich. Bitte melden Sie sich erneut an.';
        await logout();
        navigate('/login', { replace: true });
      } else if (err.response?.status === 400) {
        errorMsg = err.response.data?.message || 'Validierungsfehler';
      } else if (err.response?.status === 404) {
        errorMsg = 'Account nicht gefunden';
      } else if (err.message) {
        errorMsg = err.message;
      }

      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [emailMatches, user?.email, onClose, logout, navigate, showSuccess, showError]);

  /**
   * Handle dialog close (Escape key)
   */
  const handleClose = useCallback(() => {
    if (!loading) {
      onClose();
    }
  }, [loading, onClose]);

  if (!user) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <div className="account-deletion-dialog" role="alertdialog">
        {/* Step Indicator */}
        <div className="account-deletion-dialog__steps">
          <div className={`step ${step === 1 ? 'step--active' : 'step--done'}`}>
            <span className="step__number">1</span>
          </div>
          <div className="step__line"></div>
          <div className={`step ${step === 2 ? 'step--active' : ''}`}>
            <span className="step__number">2</span>
          </div>
        </div>

        {/* STEP 1: Warning & Confirmation */}
        {step === 1 && (
          <div className="account-deletion-dialog__step1">
            {/* Warning Icon */}
            <div className="account-deletion-dialog__warning">
              <span className="warning-icon">⚠️</span>
            </div>

            {/* Title */}
            <h2 className="account-deletion-dialog__title">
              Account wirklich löschen?
            </h2>

            {/* Warning Text */}
            <p className="account-deletion-dialog__description">
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>

            {/* What will be deleted */}
            <div className="account-deletion-dialog__content">
              <p className="account-deletion-dialog__subtitle">
                Ihre Daten werden permanently gelöscht:
              </p>
              <ul className="deletion-items">
                <li className="deletion-item">
                  <span className="deletion-item__icon">👤</span>
                  <span className="deletion-item__text">Benutzerprofil</span>
                </li>
                <li className="deletion-item">
                  <span className="deletion-item__icon">💰</span>
                  <span className="deletion-item__text">Alle Transaktionen</span>
                </li>
                <li className="deletion-item">
                  <span className="deletion-item__icon">📋</span>
                  <span className="deletion-item__text">Alle persönlichen Daten</span>
                </li>
                <li className="deletion-item">
                  <span className="deletion-item__icon">🔐</span>
                  <span className="deletion-item__text">Authentifizierungsdaten</span>
                </li>
              </ul>
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert--danger" role="alert">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="account-deletion-dialog__actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Abbrechen
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={handleGoToStep2}
                disabled={loading}
              >
                Weiter
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Email Verification */}
        {step === 2 && (
          <div className="account-deletion-dialog__step2">
            {/* Title */}
            <h2 className="account-deletion-dialog__title">
              Bestätigung erforderlich
            </h2>

            {/* Description */}
            <p className="account-deletion-dialog__description">
              Um Ihren Account zu löschen, bestätigen Sie bitte Ihre Email-Adresse:
            </p>

            {/* Show current email */}
            <div className="email-display">
              <span className="email-display__label">Ihre Email:</span>
              <span className="email-display__email">{user?.email}</span>
            </div>

            {/* Email Input */}
            <div className="form-group">
              <label htmlFor="confirm-email" className="form-label">
                Email-Adresse bestätigen *
              </label>
              <div className="email-input-wrapper">
                <input
                  ref={emailInputRef}
                  id="confirm-email"
                  type="email"
                  name="confirmEmail"
                  value={confirmEmail}
                  onChange={handleEmailChange}
                  placeholder={user?.email}
                  disabled={loading}
                  aria-invalid={confirmEmail !== '' && !emailMatches}
                  aria-describedby={confirmEmail !== '' && !emailMatches ? 'email-error' : 'email-help'}
                  autoComplete="email"
                  className="form-input"
                />
                {confirmEmail && (
                  <div className={`email-indicator ${emailMatches ? 'match' : 'mismatch'}`}>
                    {emailMatches ? '✓' : '✗'}
                  </div>
                )}
              </div>

              {/* Email Validation Message */}
              {confirmEmail && (
                <p
                  id={emailMatches ? 'email-help' : 'email-error'}
                  className={`form-help ${emailMatches ? 'text-success' : 'text-danger'}`}
                >
                  {emailMatches
                    ? '✓ Email stimmt überein'
                    : '✗ Email stimmt nicht überein'}
                </p>
              )}
            </div>

            {/* Warning Text */}
            <div className="account-deletion-dialog__warning-box">
              <p className="warning-text">
                ⚠️ <strong>Warnung:</strong> Dies wird alle Daten permanent löschen.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert--danger" role="alert">
                {error}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="loading-overlay">
                <LoadingSpinner message="Account wird gelöscht..." />
              </div>
            )}

            {/* Buttons */}
            <div className="account-deletion-dialog__actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleGoBack}
                disabled={loading}
              >
                Zurück
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={handleDeleteAccount}
                disabled={!emailMatches || loading}
                aria-busy={loading}
              >
                {loading ? 'Wird gelöscht...' : 'Permanent löschen'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AccountDeletionDialog;
