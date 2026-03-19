/**
 * @fileoverview Email Verification via Link
 * @description Shows verification result when user clicks email link
 */

import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useMotion } from '@/hooks/useMotion';
import styles from './EmailVerificationPage.module.scss';

const CONTAINER_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const { t } = useTranslation();
  const { shouldAnimate } = useMotion();

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

  return (
    <motion.div
      className={styles.verifyContainer}
      initial={shouldAnimate ? 'hidden' : false}
      animate={shouldAnimate ? 'visible' : false}
      variants={shouldAnimate ? CONTAINER_VARIANTS : {}}
    >
      <div className={styles.verifyCard}>
        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <FiCheckCircle className={styles.statusIconSuccess} />
            </motion.div>
            <h1 className={styles.verifyTitle}>{t('auth.verifySuccessTitle')}</h1>
            <p className={styles.verifyText}>{t('auth.verifySuccessSubtitle', { email })}</p>
            {type === 'add' && (
              <p className={styles.verifyText}>{t('auth.verifySuccessAddNote')}</p>
            )}
            <Link to={type === 'add' ? '/profile' : '/dashboard'} className={styles.actionLink}>
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
              <FiXCircle className={styles.statusIconError} />
            </motion.div>
            <h1 className={styles.verifyTitle}>{t('auth.verifyErrorTitle')}</h1>
            <p className={styles.verifyText}>
              {errorMessages[error] || t('auth.verifyErrorUnknown')}
            </p>
            <Link to={type === 'add' ? '/profile' : '/login'} className={styles.actionLink}>
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
              <FiLoader className={styles.statusIconLoading} />
            </motion.div>
            <h1 className={styles.verifyTitle}>{t('auth.verifyLoadingTitle')}</h1>
            <p className={styles.verifyText}>{t('auth.verifyLoadingSubtitle')}</p>
          </>
        )}
      </div>
    </motion.div>
  );
}
