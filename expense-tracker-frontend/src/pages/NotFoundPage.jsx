import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

/**
 * NotFoundPage (404)
 * Displayed when user navigates to a non-existent route
 */
const NotFoundPage = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '4rem', margin: '0', lineHeight: '1' }}>404</h1>
          <h2>Seite nicht gefunden</h2>
          
          <div className="alert alert--error">
            <p style={{ margin: '1rem 0' }}>
              Die Seite, die du suchst, existiert nicht oder wurde gelöscht.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem', flexWrap: 'wrap' }}>
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
              🏠 Zur Startseite
            </button>
          </div>

          <div className="auth-links" style={{ marginTop: '2rem' }}>
            <p>
              Falls du glaubst, dass dies ein Fehler ist, kontaktiere bitte den Administrator.
            </p>
            <p>
              <Link to="/">Zur Startseite</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
