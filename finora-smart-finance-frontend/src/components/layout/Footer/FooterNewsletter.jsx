/**
 * @fileoverview FooterNewsletter — Kompaktes Newsletter-Formular für die Bottom Bar
 *
 * Horizontales Layout: Input + Button inline, Privacy Hint darunter.
 * Wird im Footer Bottom-Bereich links platziert.
 */

import { useState, useCallback, memo } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail } from 'react-icons/fi';
import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { useMotion } from '@/hooks/useMotion';
import Checkbox from '@/components/common/Checkbox/Checkbox';
import styles from './Footer.module.scss';

function FooterNewsletter() {
  const { t, i18n } = useTranslation();
  const { shouldAnimate } = useMotion();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      setStatus('emailRequired');
      setTimeout(() => setStatus(null), 3000);
      return;
    }

    if (!emailRegex.test(email)) {
      setStatus('error');
      setTimeout(() => setStatus(null), 3000);
      return;
    }

    if (!consent) {
      setStatus('consentRequired');
      setTimeout(() => setStatus(null), 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      await client.post(ENDPOINTS.newsletter.subscribe, {
        email,
        language: i18n.language,
      });
      setStatus('success');
      setEmail('');
      setConsent(false);
    } catch {
      setStatus('serverError');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setStatus(null), 5000);
    }
  }, [email, i18n.language, consent]);

  const statusConfig = {
    success: { className: styles.newsletterSuccess, key: 'footer.newsletter.success' },
    emailRequired: { className: styles.newsletterError, key: 'footer.newsletter.emailRequired' },
    error: { className: styles.newsletterError, key: 'footer.newsletter.error' },
    serverError: { className: styles.newsletterError, key: 'footer.newsletter.serverError' },
    consentRequired: { className: styles.newsletterError, key: 'footer.newsletter.consentRequired' },
  };

  return (
    <div className={styles.newsletterWrap}>
      <h4 className={styles.newsletterTitle}>{t('footer.newsletter.title')}</h4>
      <p className={styles.newsletterSubtitle}>{t('footer.newsletter.subtitle')}</p>

      <form onSubmit={handleSubmit} className={styles.newsletterForm}>
        <div className={styles.newsletterRow}>
          <div className={styles.inputWrapper}>
            <FiMail className={styles.inputIcon} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('footer.newsletter.placeholder')}
              className={styles.newsletterInput}
              aria-label={t('footer.newsletter.placeholder')}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.newsletterButton}
          >
            {isSubmitting ? '...' : t('footer.newsletter.button')}
          </button>
        </div>

        {/* Status-Meldung */}
        {status && statusConfig[status] && (
          <motion.p
            className={statusConfig[status].className}
            initial={shouldAnimate ? { opacity: 0, y: -8 } : false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
          >
            {t(statusConfig[status].key)}
          </motion.p>
        )}
      </form>

      {/* DSGVO Consent Checkbox */}
      <Checkbox
        checked={consent}
        onChange={(e) => setConsent(e.target.checked)}
        size="sm"
      >
        <Trans
          i18nKey="footer.newsletter.consent"
          components={{ link: <Link to="/privacy" /> }}
        />
      </Checkbox>
    </div>
  );
}

export default memo(FooterNewsletter);
