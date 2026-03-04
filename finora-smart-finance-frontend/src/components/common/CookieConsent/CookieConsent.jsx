/**
 * @fileoverview Privacy Notice Banner — Einfacher Datenschutz-Hinweis
 *
 * Ersetzt das ehemalige 2-Layer-Consent-Banner.
 * Zeigt einen reinen Informationshinweis an, da ausschließlich
 * technisch notwendige Speicherung erfolgt (kein Consent nötig).
 *
 * - Erscheint beim Erstbesuch (privacyNoticeSeen !== true)
 * - Kann über Footer-Link erneut angezeigt werden
 * - „Verstanden"-Button speichert nur localStorage-Flag, kein Server-Request
 */

import { useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShield, FiX } from 'react-icons/fi';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { useMotion } from '@/hooks/useMotion';
import styles from './CookieConsent.module.scss';

export default function CookieConsent() {
  const { t } = useTranslation();
  const { shouldAnimate } = useMotion();
  const { noticeSeen, showNotice, dismissNotice, closeNotice } = useCookieConsent();

  const bannerRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Show banner if: first visit (not seen) OR re-opened from footer
  const isVisible = !noticeSeen || showNotice;

  // Handle close: first visit → dismiss (persist), re-open → just close
  const handleClose = useCallback(() => {
    if (!noticeSeen) {
      dismissNotice();
    } else {
      closeNotice();
    }
  }, [noticeSeen, dismissNotice, closeNotice]);

  // Escape key to close
  useEffect(() => {
    if (!isVisible) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') handleClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, handleClose]);

  // Focus-Trap: Fokus im Dialog halten (Accessibility)
  useEffect(() => {
    if (!isVisible) return;

    previousActiveElement.current = document.activeElement;

    // Fokus auf erstes fokussierbares Element setzen
    const timer = setTimeout(() => {
      const focusableElements = bannerRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements?.length) focusableElements[0].focus();
    }, 100);

    // Tab-Trap: Zirkulation innerhalb des Banners
    const handleTabKey = (e) => {
      if (e.key !== 'Tab' || !bannerRef.current) return;
      const focusableElements = bannerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements?.length) return;
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleTabKey);
      previousActiveElement.current?.focus?.();
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            className={styles.backdrop}
            initial={shouldAnimate ? { opacity: 0 } : false}
            animate={shouldAnimate ? { opacity: 1 } : false}
            exit={shouldAnimate ? { opacity: 0 } : undefined}
            onClick={noticeSeen ? handleClose : undefined}
            aria-hidden="true"
          />

          {/* Banner */}
          <motion.div
            ref={bannerRef}
            className={styles.banner}
            role="dialog"
            aria-modal="true"
            aria-label={t('privacyNotice.title')}
            initial={shouldAnimate ? { y: 100, opacity: 0 } : false}
            animate={shouldAnimate ? { y: 0, opacity: 1 } : false}
            exit={shouldAnimate ? { y: 100, opacity: 0 } : undefined}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          >
            {/* Close button (only when re-opening from footer) */}
            {noticeSeen && (
              <button
                className={styles.closeButton}
                onClick={handleClose}
                aria-label={t('privacyNotice.close')}
              >
                <FiX size={18} />
              </button>
            )}

            <div className={styles.content}>
              <div className={styles.header}>
                <FiShield className={styles.icon} size={24} />
                <h2 className={styles.title}>{t('privacyNotice.title')}</h2>
              </div>
              <p className={styles.description}>{t('privacyNotice.description')}</p>
              <div className={styles.actions}>
                <button className={styles.btnAccept} onClick={handleClose}>
                  {t('privacyNotice.understood')}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
