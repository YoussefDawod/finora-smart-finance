/**
 * @fileoverview Privacy Notice Banner — Scroll-getriggerter Datenschutz-Hinweis.
 *
 * Reiner Informationshinweis (kein Consent nötig — nur technisch
 * notwendige Speicherung). Erscheint:
 *   - beim ersten Besuch erst nach erstem Scrollen (wheel / touchmove)
 *   - sofort, wenn aus dem Footer per `reopenNotice()` geöffnet
 *
 * Schließen via X-Button. Kein Backdrop, kein Modal, kein Focus-Trap.
 *
 * @module components/common/CookieConsent
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiX } from 'react-icons/fi';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import styles from './CookieConsent.module.scss';

export default function CookieConsent() {
  const { t } = useTranslation();
  const { noticeSeen, showNotice, dismissNotice, closeNotice } = useCookieConsent();

  // Scroll-Gate: Banner beim Erstbesuch erst nach erster Scroll-Geste zeigen.
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (noticeSeen) return; // Bereits gesehen — Scroll-Trigger irrelevant.

    const trigger = () => setScrolled(true);
    window.addEventListener('wheel', trigger, { once: true, passive: true });
    window.addEventListener('touchmove', trigger, { once: true, passive: true });

    return () => {
      window.removeEventListener('wheel', trigger);
      window.removeEventListener('touchmove', trigger);
    };
  }, [noticeSeen]);

  // Sichtbar wenn:
  //   - Re-Open aus Footer (showNotice = true) → sofort
  //   - Erstbesuch + bereits gescrollt
  const isVisible = showNotice || (!noticeSeen && scrolled);

  if (!isVisible) return null;

  const handleClose = () => {
    if (!noticeSeen) dismissNotice();
    else closeNotice();
  };

  return (
    <div className={styles.banner} role="note" aria-live="polite">
      <button
        className={styles.close}
        onClick={handleClose}
        aria-label={t('privacyNotice.close')}
        type="button"
      >
        <FiX size={16} />
      </button>
      <p className={styles.text}>
        {t('privacyNotice.description')}{' '}
        <a href="/privacy" className={styles.link} onClick={handleClose}>
          {t('privacyNotice.linkLabel', 'Zur Datenschutzerklärung →')}
        </a>
      </p>
    </div>
  );
}
