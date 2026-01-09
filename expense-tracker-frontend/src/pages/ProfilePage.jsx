import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../api/authService';
import useToast from '../hooks/useToast';
import Modal from '../components/Modal/Modal';
import AccountDeletionDialog from '../components/AccountDeletionDialog';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import '../styles/auth.scss';
import '../styles/profile.scss';

/**
 * ProfilePage - User Profile Management
 * Features:
 * - View and edit profile name
 * - Change email with verification
 * - Upload avatar (local preview)
 * - Delete account
 */
const ProfilePage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { success, error: errorToast } = useToast();
  
  // States
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isEmailChangeDialogOpen, setIsEmailChangeDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);

  // Initialize name from user
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  // ============================================
  // Avatar Upload
  // ============================================
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      errorToast('Nur JPG und PNG Dateien erlaubt');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      errorToast('Datei zu groß (max. 5MB)');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      setAvatar(file);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatar) return;

    try {
      setLoading(true);
      // TODO: Implement avatar upload to backend when ready
      // For now, just save to localStorage
      localStorage.setItem('user_avatar', avatarPreview);
      success('Avatar hochgeladen');
      setAvatar(null);
    } catch (err) {
      errorToast('Avatar-Upload fehlgeschlagen');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarCancel = () => {
    setAvatar(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ============================================
  // Name Edit
  // ============================================
  const handleEditName = () => {
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!name || name.trim().length === 0) {
      setError('Name darf nicht leer sein');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await authService.updateProfile(name.trim());
      success('Name aktualisiert');
      setIsEditingName(false);
    } catch (err) {
      setError(err.message || 'Fehler beim Speichern');
      errorToast('Name-Update fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEditName = () => {
    setName(user?.name || '');
    setIsEditingName(false);
    setError(null);
  };

  // ============================================
  // Email Change
  // ============================================
  const handleOpenEmailChange = () => {
    setNewEmail('');
    setIsEmailChangeDialogOpen(true);
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      setError('Gültige Email erforderlich');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await authService.changeEmail(newEmail);
      success('Verifizierungs-Email gesendet an ' + newEmail);
      setIsEmailChangeDialogOpen(false);
      setNewEmail('');
    } catch (err) {
      if (err.status === 409) {
        setError('Email bereits registriert');
      } else {
        setError(err.message || 'Fehler beim Senden');
      }
      errorToast('Email-Änderung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // Helpers
  // ============================================
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unbekannt';
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // ============================================
  // Loading State
  // ============================================
  if (authLoading || !user) {
    return (
      <div className="auth-container">
        <LoadingSpinner message="Lade Profil..." />
      </div>
    );
  }

  const storedAvatar = localStorage.getItem('user_avatar');

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '600px' }}>
        <h1 className="auth-card__title">Profil</h1>

        {/* Avatar Section */}
        <section className="profile-section" aria-labelledby="avatar-heading">
          <h2 id="avatar-heading" className="profile-section__title">Profilbild</h2>
          
          <div className="profile-avatar-container">
            <div 
              className="profile-avatar" 
              onClick={handleAvatarClick}
              role="button"
              tabIndex={0}
              aria-label="Profilbild ändern"
              onKeyPress={(e) => e.key === 'Enter' && handleAvatarClick()}
            >
              {avatarPreview || storedAvatar ? (
                <img src={avatarPreview || storedAvatar} alt="Avatar" />
              ) : (
                <div className="profile-avatar__initials">
                  {getInitials(user.name || user.email)}
                </div>
              )}
              <div className="profile-avatar__overlay">
                <span>📷 Ändern</span>
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
              aria-label="Datei auswählen"
            />

            {avatar && (
              <div className="profile-avatar-actions">
                <button
                  className="btn btn--primary btn--sm"
                  onClick={handleAvatarUpload}
                  disabled={loading}
                  aria-busy={loading}
                >
                  Hochladen
                </button>
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={handleAvatarCancel}
                  disabled={loading}
                >
                  Abbrechen
                </button>
              </div>
            )}
          </div>
          
          <p className="text-small text-muted">
            Maximal 5MB • JPG oder PNG
          </p>
        </section>

        {/* User Info Section */}
        <section className="profile-section" aria-labelledby="info-heading">
          <h2 id="info-heading" className="profile-section__title">Persönliche Informationen</h2>

          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="name">Name</label>
            {isEditingName ? (
              <div className="profile-edit-field">
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dein Name"
                  disabled={loading}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'name-error' : undefined}
                />
                <div className="profile-edit-actions">
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={handleSaveName}
                    disabled={loading || !name.trim()}
                    aria-busy={loading}
                  >
                    Speichern
                  </button>
                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={handleCancelEditName}
                    disabled={loading}
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile-view-field">
                <span>{user.name || 'Nicht angegeben'}</span>
                <button
                  className="btn btn--icon btn--sm"
                  onClick={handleEditName}
                  aria-label="Name bearbeiten"
                  title="Bearbeiten"
                >
                  ✏️
                </button>
              </div>
            )}
            {error && isEditingName && (
              <p id="name-error" className="form-error" role="alert">
                {error}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="profile-view-field">
              <span>{user.email}</span>
              <button
                className="btn btn--icon btn--sm"
                onClick={handleOpenEmailChange}
                aria-label="Email ändern"
                title="Ändern"
              >
                ✏️
              </button>
            </div>
            {user.isVerified ? (
              <p className="text-small text-success">✓ Verifiziert</p>
            ) : (
              <p className="text-small text-warning">⚠ Nicht verifiziert</p>
            )}
          </div>

          {/* Account Created Date */}
          <div className="form-group">
            <label>Mitglied seit</label>
            <div className="profile-view-field">
              <span>{formatDate(user.createdAt)}</span>
            </div>
          </div>
        </section>

        {/* Delete Account Section */}
        <section className="profile-section profile-section--danger" aria-labelledby="delete-heading">
          <h2 id="delete-heading" className="profile-section__title">Gefahrenzone</h2>
          <p className="text-small text-muted mb-sm">
            Das Löschen deines Accounts kann nicht rückgängig gemacht werden. 
            Alle deine Transaktionen werden unwiderruflich gelöscht.
          </p>
          <button
            className="btn btn--danger"
            onClick={() => setIsDeleteDialogOpen(true)}
            aria-label="Account löschen"
          >
            🗑️ Account löschen
          </button>
        </section>
      </div>

      {/* Email Change Dialog */}
      <Modal
        isOpen={isEmailChangeDialogOpen}
        onClose={() => setIsEmailChangeDialogOpen(false)}
        title="Email ändern"
        size="sm"
      >
        <div className="modal-content">
          <p className="text-small text-muted mb-md">
            Du erhältst eine Verifizierungs-Email an die neue Adresse. 
            Deine Email wird erst nach Bestätigung geändert.
          </p>

          <div className="form-group">
            <label htmlFor="newEmail">Neue Email</label>
            <input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="neue@email.com"
              disabled={loading}
              aria-invalid={!!error}
              aria-describedby={error ? 'email-error' : undefined}
            />
            {error && (
              <p id="email-error" className="form-error" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="modal-actions">
            <button
              className="btn btn--secondary"
              onClick={() => setIsEmailChangeDialogOpen(false)}
              disabled={loading}
            >
              Abbrechen
            </button>
            <button
              className="btn btn--primary"
              onClick={handleChangeEmail}
              disabled={loading || !newEmail.includes('@')}
              aria-busy={loading}
            >
              {loading ? 'Sende...' : 'Verifizierung senden'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Dialog */}
      <AccountDeletionDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
};

export default ProfilePage;
