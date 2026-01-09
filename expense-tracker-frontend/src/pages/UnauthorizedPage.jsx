import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

/**
 * UnauthorizedPage
 * Displayed when user tries to access a route they don't have permission for
 */
const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get info from navigation state
  const { requiredRole, userRole } = location.state || {};

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '4rem', margin: '0' }}>🚫</h1>
          <h2>Zugriff verweigert</h2>
          
          <div className="alert alert--error">
            <p style={{ margin: '1rem 0' }}>
              Du hast keine Berechtigung, diese Seite anzuzeigen.
            </p>
            
            {requiredRole && userRole && (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                Erforderliche Rolle: <strong>{requiredRole}</strong><br />
                Deine Rolle: <strong>{userRole}</strong>
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
            <button 
              onClick={handleGoBack}
              className="btn btn--secondary"
            >
              ← Zurück
            </button>
            
            <button 
              onClick={handleGoHome}
              className="btn btn--primary"
            >
              🏠 Zum Dashboard
            </button>
          </div>

          <div className="auth-links" style={{ marginTop: '2rem' }}>
            <p>
              Falls du glaubst, dass dies ein Fehler ist, kontaktiere bitte den Administrator.
            </p>
            <p>
              <Link to="/logout">Abmelden</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
