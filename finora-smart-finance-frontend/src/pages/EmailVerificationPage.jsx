/**
 * @fileoverview Email Verification via Link
 * @description Shows verification result when user clicks email link
 */

import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const { t } = useTranslation();
  
  const success = searchParams.get('success');
  const error = searchParams.get('error');
  const email = searchParams.get('email');
  const type = searchParams.get('type');

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      if (success === 'true') {
        setStatus('success');
      } else if (error) {
        setStatus('error');
      }
    }, 500);
    return () => globalThis.clearTimeout(timer);
  }, [success, error]);

  const errorMessages = {
    missing_token: t('auth.verifyErrorMissingToken'),
    invalid_token: t('auth.verifyErrorInvalidToken'),
    server_error: t('auth.verifyErrorServer'),
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'var(--color-bg-primary)',
      }}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div style={{
        background: 'var(--color-bg-secondary)',
        borderRadius: '1rem',
        padding: '3rem',
        textAlign: 'center',
        maxWidth: '400px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}>
        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <FiCheckCircle style={{ fontSize: '3rem', color: '#10b981', marginBottom: '1rem' }} />
            </motion.div>
            <h1 style={{ margin: '1rem 0', color: 'var(--color-text-primary)' }}>
              {t('auth.verifySuccessTitle')}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0' }}>
              {t('auth.verifySuccessSubtitle', { email })}
            </p>
            {type === 'add' && (
              <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0' }}>
                {t('auth.verifySuccessAddNote')}
              </p>
            )}
            <Link 
              to={type === 'add' ? '/profile' : '/dashboard'}
              style={{
                display: 'inline-block',
                marginTop: '1.5rem',
                padding: '0.75rem 1.5rem',
                background: 'var(--color-primary)',
                color: 'white',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                transition: 'opacity 0.3s',
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              {type === 'add' ? t('auth.goToProfile') : t('auth.goToDashboard')}
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <FiXCircle style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '1rem' }} />
            </motion.div>
            <h1 style={{ margin: '1rem 0', color: 'var(--color-text-primary)' }}>
              {t('auth.verifyErrorTitle')}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0' }}>
              {errorMessages[error] || t('auth.verifyErrorUnknown')}
            </p>
            <Link 
              to={type === 'add' ? '/profile' : '/login'}
              style={{
                display: 'inline-block',
                marginTop: '1.5rem',
                padding: '0.75rem 1.5rem',
                background: 'var(--color-primary)',
                color: 'white',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                transition: 'opacity 0.3s',
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              {type === 'add' ? t('auth.backToProfile') : t('common.backToLogin')}
            </Link>
          </>
        )}

        {status === 'loading' && (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <FiLoader style={{ fontSize: '3rem', color: 'var(--color-primary)', marginBottom: '1rem' }} />
            </motion.div>
            <h1 style={{ margin: '1rem 0', color: 'var(--color-text-primary)' }}>
              {t('auth.verifyLoadingTitle')}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>{t('auth.verifyLoadingSubtitle')}</p>
          </>
        )}
      </div>
    </motion.div>
  );
}
