import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import usePasswordChange from '../hooks/usePasswordChange';
import { authService } from '../api/authService';
import useToast from '../hooks/useToast';
import Modal from '../components/Modal/Modal';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import '../styles/auth.scss';
import '../styles/settings.scss';

/**
 * SettingsPage - User Settings & Preferences
 * Features:
 * - Account Security (change password)
 * - Preferences (theme, currency, timezone, etc.)
 * - Data & Privacy (export, delete transactions)
 */
const SettingsPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { success, error: errorToast } = useToast();

  // Use password change hook
  const {
    form: passwordForm,
    loading: passwordLoading,
    error: passwordError,
    success: passwordSuccess,
    passwordStrength,
    showPassword,
    requirements: passwordRequirements,
    failedRequirements,
    handlePasswordChange,
    handleChangePassword,
    togglePasswordVisibility,
  } = usePasswordChange();

  // Tab State
  const [activeTab, setActiveTab] = useState('security');

  // Preferences State
  const [preferences, setPreferences] = useState({
    theme: 'system',
    currency: 'EUR',
    timezone: 'Europe/Berlin',
    language: 'de',
    notifications: true,
  });
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesError, setPreferencesError] = useState(null);

  // Data & Privacy State
  const [isDeleteTransactionsDialogOpen, setIsDeleteTransactionsDialogOpen] = useState(false);
  const [deleteTransactionsPassword, setDeleteTransactionsPassword] = useState('');
  const [deleteTransactionsLoading, setDeleteTransactionsLoading] = useState(false);
  const [deleteTransactionsError, setDeleteTransactionsError] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Load user preferences on mount
  useEffect(() => {
    if (user?.preferences) {
      setPreferences({
        theme: user.preferences.theme || 'system',
        currency: user.preferences.currency || 'EUR',
        timezone: user.preferences.timezone || 'Europe/Berlin',
        language: user.preferences.language || 'de',
        notifications: user.preferences.notifications !== false,
      });
    }
  }, [user]);

  // ============================================
  // PASSWORD CHANGE
  // ============================================
  // All logic is now in usePasswordChange hook

  // ============================================
  // PREFERENCES
  // ============================================
  const handlePreferenceChange = (key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleSavePreferences = async () => {
    try {
      setPreferencesLoading(true);
      setPreferencesError(null);
      await authService.updatePreferences(preferences);
      success('Einstellungen gespeichert');

      // Apply theme if changed
      if (preferences.theme !== 'system') {
        document.documentElement.setAttribute('data-theme', preferences.theme);
        localStorage.setItem('theme', preferences.theme);
      } else {
        localStorage.removeItem('theme');
      }
    } catch (err) {
      setPreferencesError(err.message || 'Fehler beim Speichern');
      errorToast('Einstellungen nicht gespeichert');
    } finally {
      setPreferencesLoading(false);
    }
  };

  // ============================================
  // DATA & PRIVACY
  // ============================================
  const handleExportData = async () => {
    try {
      setExportLoading(true);
      const result = await authService.exportData();

      // Create and download JSON file
      const dataStr = JSON.stringify(result.data.export, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expense-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      success('Daten exportiert');
    } catch {
      errorToast('Datenexport fehlgeschlagen');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteTransactions = async () => {
    if (!deleteTransactionsPassword) {
      setDeleteTransactionsError('Passwort erforderlich');
      return;
    }

    try {
      setDeleteTransactionsLoading(true);
      setDeleteTransactionsError(null);
      const result = await authService.deleteTransactions(deleteTransactionsPassword);
      success(`${result.data.deletedCount} Transaktionen gelöscht`);
      setIsDeleteTransactionsDialogOpen(false);
      setDeleteTransactionsPassword('');
    } catch (err) {
      if (err.status === 400) {
        setDeleteTransactionsError('Passwort ist falsch');
      } else {
        setDeleteTransactionsError(err.message || 'Fehler beim Löschen');
      }
      errorToast('Transaktionenlöschung fehlgeschlagen');
    } finally {
      setDeleteTransactionsLoading(false);
    }
  };

  // ============================================
  // Loading State
  // ============================================
  if (authLoading || !user) {
    return (
      <div className="auth-container">
        <LoadingSpinner message="Lade Einstellungen..." />
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card settings-card">
        <h1 className="auth-card__title">Einstellungen</h1>

        {/* Tab Navigation */}
        <div className="settings-tabs" role="tablist" aria-label="Einstellungs-Tabs">
          {['security', 'preferences', 'privacy'].map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`${tab}-panel`}
              className={`settings-tab ${activeTab === tab ? 'settings-tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'security' && '🔒 Sicherheit'}
              {tab === 'preferences' && '⚙️ Einstellungen'}
              {tab === 'privacy' && '📊 Datenschutz'}
            </button>
          ))}
        </div>

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <section id="security-panel" role="tabpanel" aria-labelledby="security-tab" className="settings-panel">
            <h2 className="settings-panel__title">Passwort ändern</h2>

            <form onSubmit={handleChangePassword} className="settings-form">
              {/* Success Message */}
              {passwordSuccess && (
                <div className="alert alert--success" role="alert">
                  ✓ Passwort erfolgreich geändert!
                </div>
              )}

              {/* Current Password */}
              <div className="form-group">
                <label htmlFor="currentPassword">Aktuelles Passwort *</label>
                <div className="password-input-wrapper">
                  <input
                    id="currentPassword"
                    type={showPassword.current ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    disabled={passwordLoading}
                    aria-invalid={!!passwordError}
                    aria-describedby={passwordError ? 'password-error' : undefined}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => togglePasswordVisibility('current')}
                    aria-label={showPassword.current ? 'Passwort verbergen' : 'Passwort anzeigen'}
                    disabled={!passwordForm.currentPassword}
                  >
                    {showPassword.current ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="form-group">
                <label htmlFor="newPassword">Neues Passwort *</label>
                <div className="password-input-wrapper">
                  <input
                    id="newPassword"
                    type={showPassword.new ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    disabled={passwordLoading}
                    aria-invalid={!!passwordError}
                    aria-describedby="password-requirements"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => togglePasswordVisibility('new')}
                    aria-label={showPassword.new ? 'Passwort verbergen' : 'Passwort anzeigen'}
                    disabled={!passwordForm.newPassword}
                  >
                    {showPassword.new ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {passwordForm.newPassword && (
                  <>
                    <div className={`password-strength password-strength--${passwordStrength}`} role="status">
                      <div className="password-strength__bar">
                        <div className="password-strength__fill"></div>
                      </div>
                      <span className="password-strength__label">
                        {passwordStrength === 'weak' && '⚠️ Schwach'}
                        {passwordStrength === 'medium' && '⚠️ Mittel'}
                        {passwordStrength === 'strong' && '✓ Sicher'}
                      </span>
                    </div>

                    {/* Requirements Checklist */}
                    <div id="password-requirements" className="password-requirements" role="status">
                      <p className="password-requirements__title">Anforderungen:</p>
                      <ul className="password-requirements__list">
                        <li className={passwordRequirements.length ? 'met' : ''}>
                          {passwordRequirements.length ? '✓' : '○'} Mindestens 8 Zeichen
                        </li>
                        <li className={passwordRequirements.uppercase ? 'met' : ''}>
                          {passwordRequirements.uppercase ? '✓' : '○'} Großbuchstabe (A-Z)
                        </li>
                        <li className={passwordRequirements.lowercase ? 'met' : ''}>
                          {passwordRequirements.lowercase ? '✓' : '○'} Kleinbuchstabe (a-z)
                        </li>
                        <li className={passwordRequirements.number ? 'met' : ''}>
                          {passwordRequirements.number ? '✓' : '○'} Ziffer (0-9)
                        </li>
                        <li className={passwordRequirements.special ? 'met' : ''}>
                          {passwordRequirements.special ? '✓' : '○'} Sonderzeichen (!@#$...)
                        </li>
                      </ul>
                    </div>
                  </>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label htmlFor="confirmPassword">Passwort bestätigen *</label>
                <div className="password-input-wrapper">
                  <input
                    id="confirmPassword"
                    type={showPassword.confirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    disabled={passwordLoading}
                    aria-invalid={
                      passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
                    }
                    aria-describedby={
                      passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
                        ? 'confirm-error'
                        : undefined
                    }
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => togglePasswordVisibility('confirm')}
                    aria-label={showPassword.confirm ? 'Passwort verbergen' : 'Passwort anzeigen'}
                    disabled={!passwordForm.confirmPassword}
                  >
                    {showPassword.confirm ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>

                {/* Match Indicator */}
                {passwordForm.confirmPassword && (
                  <div className={`password-match ${passwordForm.newPassword === passwordForm.confirmPassword ? 'match' : 'mismatch'}`} role="status">
                    {passwordForm.newPassword === passwordForm.confirmPassword
                      ? '✓ Passwörter stimmen überein'
                      : '✗ Passwörter stimmen nicht überein'}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {passwordError && (
                <div id="password-error" className="alert alert--danger" role="alert">
                  {passwordError}
                </div>
              )}

              {/* Submit Button */}
              <div className="settings-actions">
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={
                    passwordLoading ||
                    !passwordForm.currentPassword ||
                    !passwordForm.newPassword ||
                    !passwordForm.confirmPassword ||
                    failedRequirements.length > 0 ||
                    passwordForm.newPassword !== passwordForm.confirmPassword
                  }
                  aria-busy={passwordLoading}
                >
                  {passwordLoading ? (
                    <>
                      <LoadingSpinner size="sm" inline /> Wird geändert...
                    </>
                  ) : (
                    'Passwort ändern'
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* PREFERENCES TAB */}
        {activeTab === 'preferences' && (
          <section id="preferences-panel" role="tabpanel" aria-labelledby="preferences-tab" className="settings-panel">
            <h2 className="settings-panel__title">Einstellungen</h2>

            <form className="settings-form">
              {/* Theme Selection */}
              <div className="form-group">
                <label className="label-block">Erscheinungsbild</label>
                <div className="radio-group">
                  {['light', 'dark', 'system'].map((theme) => (
                    <label key={theme} className="radio-label">
                      <input
                        type="radio"
                        name="theme"
                        value={theme}
                        checked={preferences.theme === theme}
                        onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                        disabled={preferencesLoading}
                      />
                      <span>
                        {theme === 'light' && '☀️ Hell'}
                        {theme === 'dark' && '🌙 Dunkel'}
                        {theme === 'system' && '🖥️ System'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Currency Selection */}
              <div className="form-group">
                <label htmlFor="currency">Währung</label>
                <select
                  id="currency"
                  value={preferences.currency}
                  onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                  disabled={preferencesLoading}
                >
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="GBP">GBP (£) - Britisches Pfund</option>
                  <option value="CHF">CHF (Fr.) - Schweizer Franken</option>
                  <option value="JPY">JPY (¥) - Japanischer Yen</option>
                </select>
              </div>

              {/* Timezone Selection */}
              <div className="form-group">
                <label htmlFor="timezone">Zeitzone</label>
                <select
                  id="timezone"
                  value={preferences.timezone}
                  onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                  disabled={preferencesLoading}
                >
                  <option value="Europe/Berlin">Europe/Berlin</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="Europe/Amsterdam">Europe/Amsterdam</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                  <option value="Australia/Sydney">Australia/Sydney</option>
                </select>
              </div>

              {/* Language Selection */}
              <div className="form-group">
                <label htmlFor="language">Sprache</label>
                <select
                  id="language"
                  value={preferences.language}
                  onChange={(e) => handlePreferenceChange('language', e.target.value)}
                  disabled={preferencesLoading}
                >
                  <option value="de">Deutsch</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
              </div>

              {/* Notifications Toggle */}
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={preferences.notifications}
                    onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                    disabled={preferencesLoading}
                  />
                  <span>Benachrichtigungen aktivieren</span>
                </label>
              </div>

              {/* Error Message */}
              {preferencesError && (
                <div className="alert alert--danger" role="alert">
                  {preferencesError}
                </div>
              )}

              {/* Save Button */}
              <div className="settings-actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleSavePreferences}
                  disabled={preferencesLoading}
                  aria-busy={preferencesLoading}
                >
                  {preferencesLoading ? 'Wird gespeichert...' : 'Einstellungen speichern'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* PRIVACY TAB */}
        {activeTab === 'privacy' && (
          <section id="privacy-panel" role="tabpanel" aria-labelledby="privacy-tab" className="settings-panel">
            <h2 className="settings-panel__title">Datenschutz & Daten</h2>

            {/* Data Export */}
            <div className="settings-section">
              <h3 className="settings-section__title">📥 Daten exportieren</h3>
              <p className="text-small text-muted mb-md">
                Lade eine Kopie aller deiner Daten als JSON herunter.
                Dies umfasst alle Transaktionen und Profilinformationen (GDPR-konform).
              </p>
              <button
                className="btn btn--secondary"
                onClick={handleExportData}
                disabled={exportLoading}
                aria-busy={exportLoading}
              >
                {exportLoading ? 'Wird exportiert...' : '📥 Daten jetzt exportieren'}
              </button>
            </div>

            {/* Delete Transactions */}
            <div className="settings-section settings-section--danger">
              <h3 className="settings-section__title">🗑️ Transaktionen löschen</h3>
              <p className="text-small text-muted mb-md">
                Lösche alle deine Transaktionen. Dein Account bleibt bestehen.
                Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <button
                className="btn btn--danger"
                onClick={() => setIsDeleteTransactionsDialogOpen(true)}
              >
                🗑️ Alle Transaktionen löschen
              </button>
            </div>

            {/* Delete Account */}
            <div className="settings-section settings-section--danger">
              <h3 className="settings-section__title">⚠️ Account löschen</h3>
              <p className="text-small text-muted mb-md">
                Lösche deinen Account und alle zugehörigen Daten dauerhaft.
                Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <a href="/profile" className="btn btn--danger">
                ⚠️ Zum Account-Löschen
              </a>
            </div>

            {/* Links */}
            <div className="settings-section settings-section--info mt-lg pt-lg">
              <p className="text-small">
                <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
                  Datenschutzrichtlinie
                </a>
                {' • '}
                <a href="/terms-of-service" target="_blank" rel="noopener noreferrer">
                  Nutzungsbedingungen
                </a>
              </p>
            </div>
          </section>
        )}
      </div>

      {/* Delete Transactions Dialog */}
      <Modal
        isOpen={isDeleteTransactionsDialogOpen}
        onClose={() => setIsDeleteTransactionsDialogOpen(false)}
        title="Transaktionen löschen"
        size="sm"
      >
        <div className="modal-content">
          <div className="alert alert--danger mb-md" role="alert">
            <strong>⚠️ Warnung:</strong> Alle deine Transaktionen werden gelöscht!
          </div>

          <p className="text-small mb-md">
            Diese Aktion kann nicht rückgängig gemacht werden. 
            Gib dein Passwort ein zur Bestätigung:
          </p>

          <div className="form-group">
            <label htmlFor="deletePassword">Passwort</label>
            <input
              id="deletePassword"
              type="password"
              value={deleteTransactionsPassword}
              onChange={(e) => setDeleteTransactionsPassword(e.target.value)}
              placeholder="••••••••"
              disabled={deleteTransactionsLoading}
              aria-invalid={!!deleteTransactionsError}
              aria-describedby={deleteTransactionsError ? 'delete-error' : undefined}
            />
            {deleteTransactionsError && (
              <p id="delete-error" className="form-error" role="alert">
                {deleteTransactionsError}
              </p>
            )}
          </div>

          <div className="modal-actions">
            <button
              className="btn btn--secondary"
              onClick={() => setIsDeleteTransactionsDialogOpen(false)}
              disabled={deleteTransactionsLoading}
            >
              Abbrechen
            </button>
            <button
              className="btn btn--danger"
              onClick={handleDeleteTransactions}
              disabled={deleteTransactionsLoading || !deleteTransactionsPassword}
              aria-busy={deleteTransactionsLoading}
            >
              {deleteTransactionsLoading ? 'Wird gelöscht...' : 'Unwiderruflich löschen'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPage;
