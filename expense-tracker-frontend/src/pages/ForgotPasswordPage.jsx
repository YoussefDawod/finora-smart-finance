import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ForgotPasswordPage = () => {
  const { forgotPassword, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await forgotPassword(email);
      setDone(true);
    } catch (err) {
      setError(err.message || 'Fehler beim Versenden des Reset-Links');
    }
  };

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <h1>Expense Tracker</h1>
          <div className="alert alert--success">
            <h3>✅ E-Mail versendet!</h3>
            <p>Wenn diese E-Mail in unserem System registriert ist, erhältst du einen Link zum Zurücksetzen deines Passworts.</p>
            <p className="mt-3"><Link to="/login">Zurück zur Anmeldung</Link></p>
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
            <label htmlFor="email">E-Mail</label>
            <input 
              id="email"
              className="form-input" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>
          
          <button 
            className="btn btn--primary" 
            type="submit" 
            disabled={loading}
          >
            {loading ? '⏳ Wird versendet...' : 'Reset-Link versendet'}
          </button>
        </form>
        
        <div className="auth-links">
          <p><Link to="/login">Zurück zur Anmeldung</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
