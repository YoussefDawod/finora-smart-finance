/**
 * @fileoverview VerifyEmailPage Component
 * @description Page for email verification with token from URL.
 * 
 * @module pages/VerifyEmailPage
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useToast } from '@/hooks';
import styles from './VerifyEmailPage.module.scss';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [error, setError] = useState('');

  const verifyEmail = useCallback(async (token) => {
    try {
      // TODO: Implement actual API call with token
      // await authService.verifyEmail(token);
      console.log('Verifying with token:', token);
      
      // Simulate API call
      await new Promise(resolve => globalThis.setTimeout(resolve, 2000));
      
      setStatus('success');
      toast.success('E-Mail erfolgreich verifiziert!');
      
      // Redirect to login after 3 seconds
      globalThis.setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 
        'Verifizierung fehlgeschlagen. Der Link ist möglicherweise abgelaufen.';
      setStatus('error');
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [navigate, toast]);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setError('Kein Verifizierungs-Token gefunden');
      toast.error('Ungültiger Verifizierungs-Link');
      return;
    }

    verifyEmail(token);
  }, [searchParams, toast, verifyEmail]);

  if (status === 'verifying') {
    return (
      <div className={styles.verifyEmailPage}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.spinner} />
            <h1 className={styles.title}>E-Mail wird verifiziert...</h1>
            <p className={styles.description}>
              Bitte warten Sie einen Moment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className={styles.verifyEmailPage}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.successIcon}>✓</div>
            <h1 className={styles.title}>E-Mail verifiziert!</h1>
            <p className={styles.description}>
              Ihre E-Mail-Adresse wurde erfolgreich verifiziert.
            </p>
            <p className={styles.hint}>
              Sie werden in Kürze zum Login weitergeleitet...
            </p>
            <Link to="/login" className={styles.button}>
              Jetzt anmelden
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className={styles.verifyEmailPage}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.errorIcon}>✕</div>
          <h1 className={styles.title}>Verifizierung fehlgeschlagen</h1>
          <p className={styles.description}>
            {error}
          </p>
          <div className={styles.actions}>
            <Link to="/login" className={styles.button}>
              Zum Login
            </Link>
            <Link to="/register" className={styles.secondaryButton}>
              Neu registrieren
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
