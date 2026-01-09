import React, { useEffect, useState } from 'react';
import { authService } from '../api/authService';
import { Link, useNavigate } from 'react-router-dom';

const VerifyEmailPage = ({ token }) => {
  const [status, setStatus] = useState('pending');
  const [currentToken, setCurrentToken] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const statusParam = params.get('status');
        if (statusParam) {
          if (statusParam === 'done') return setStatus('done');
          if (statusParam === 'missing') return setStatus('missing');
          if (statusParam === 'invalid') return setStatus('error');
          if (statusParam === 'error') return setStatus('error');
        }

        const t = token || params.get('token');
        if (!t) return setStatus('missing');
        setCurrentToken(t);
        const res = await authService.verifyEmail(t);
        if (res?.success || res?.data?.verified) {
          setStatus('done');
        } else {
          setStatus('error');
          setErrorMsg(res?.error || 'Verifizierung fehlgeschlagen');
        }
      } catch (e) {
        setStatus('error');
        setErrorMsg(e?.message || 'Verifizierung fehlgeschlagen');
      }
    };
    run();
  }, [token]);

  const handleManualSubmit = async () => {
    if (!currentToken) {
      setStatus('missing');
      return;
    }
    setStatus('pending');
    setErrorMsg('');
    try {
      const res = await authService.verifyEmail(currentToken);
      if (res?.success || res?.data?.verified) {
        setStatus('done');
      } else {
        setStatus('error');
        setErrorMsg(res?.error || 'Verifizierung fehlgeschlagen');
      }
    } catch (e) {
      setStatus('error');
      setErrorMsg(e?.message || 'Verifizierung fehlgeschlagen');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {status === 'pending' && (
          <p>Verifiziere...</p>
        )}

        {status === 'done' && (
          <div className="alert alert--success">
            <h3>✅ E-Mail verifiziert!</h3>
            <p>Du kannst dich jetzt anmelden.</p>
            <p className="mt-3"><Link to="/login">Zur Anmeldung</Link></p>
            <button className="btn btn--primary mt-2" onClick={() => navigate('/login')}>Jetzt anmelden</button>
          </div>
        )}

        {status === 'missing' && (
          <div className="alert alert--error">Verifizierungs-Token fehlt.</div>
        )}

        {status === 'error' && (
          <div className="alert alert--error">
            Verifizierung fehlgeschlagen. Bitte fordere einen neuen Link an.
            {errorMsg && <p style={{ marginTop: '0.5rem' }}>{errorMsg}</p>}
          </div>
        )}

        {/* Debug/Manual Helper */}
        <div className="card" style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(99,102,241,0.05)', borderRadius: '0.75rem' }}>
          <h4>Debug / Manuell verifizieren</h4>
          <label htmlFor="tokenInput" className="text-small">Token</label>
          <input
            id="tokenInput"
            className="form-input"
            value={currentToken || ''}
            onChange={(e) => setCurrentToken(e.target.value)}
            placeholder="Token aus Link"
          />
          <button className="btn btn--primary btn--sm" style={{ marginTop: '0.5rem' }} onClick={handleManualSubmit}>Token jetzt verifizieren</button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
