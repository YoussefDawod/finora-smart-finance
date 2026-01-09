import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [tokenError, setTokenError] = useState(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setTokenError('Ungültige oder fehlende Reset-Token-URL');
    }
  }, [token]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.message || 'Fehler beim Zurücksetzen des Passworts');
    }
  };

  if (tokenError) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <h1>Expense Tracker</h1>
          <div className="alert alert--error">
            <h3>❌ Fehler</h3>
            <p>{tokenError}</p>
            <p className="mt-3"><Link to="/forgot-password">Neuen Reset-Link anfordern</Link></p>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <h1>Expense Tracker</h1>
          <div className="alert alert--success">
            <h3>✅ Passwort aktualisiert!</h3>
            <p>Du kannst dich jetzt mit deinem neuen Passwort anmelden.</p>
            <p className="mt-3"><Link to="/login">Zur Anmeldung</Link></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Expense Tracker</h1>
        <h2>Passwort zurücksetzen</h2>
        
        {error && (
          <div className="alert alert--error">
            {error}
          </div>
        )}
        
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="password">Neues Passwort</label>
            <input 
              id="password"
              className="form-input" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              disabled={loading}
              minLength={6}
            />
            <small>Mindestens 6 Zeichen</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Passwort bestätigen</label>
            <input 
              id="confirmPassword"
              className="form-input" 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
              disabled={loading}
              minLength={6}
            />
          </div>
          
          <button 
            className="btn btn--primary" 
            type="submit" 
            disabled={loading}
          >
            {loading ? '⏳ Wird aktualisiert...' : 'Passwort zurücksetzen'}
          </button>
        </form>
        
        <div className="auth-links">
          <p><Link to="/login">Zurück zur Anmeldung</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
