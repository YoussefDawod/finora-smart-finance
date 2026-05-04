/**
 * @fileoverview HintBanner — Datenschutz-Hinweis
 *
 * Erscheint beim ersten Scrollen (wheel / touchmove).
 * Einmaliges Schließen via localStorage (finora-notice).
 * Kein Tracking-Hinweis mit direktem Link zur Datenschutzseite.
 *
 * @module components/common/HintBanner
 */

import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import styles from './HintBanner.module.scss';

const STORAGE_KEY = 'finora-notice';

export default function HintBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    function show() {
      setVisible(true);
    }

    window.addEventListener('wheel', show, { once: true, passive: true });
    window.addEventListener('touchmove', show, { once: true, passive: true });

    return () => {
      window.removeEventListener('wheel', show);
      window.removeEventListener('touchmove', show);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className={styles.banner} role="note" aria-live="polite">
      <div className={styles.top}>
        <button
          className={styles.close}
          onClick={dismiss}
          aria-label="Hinweis schließen"
          type="button"
        >
          <FiX size={16} />
        </button>
      </div>
      <p className={styles.text}>
        Finora respektiert Ihre Privatsphäre vollständig — kein Tracking, keine Analyse-Tools und
        keine Drittanbieter-Cookies. Lediglich technisch notwendige Daten werden lokal in Ihrem
        Browser gespeichert.{' '}
        <a href="/privacy" className={styles.link} onClick={dismiss}>
          Zur Datenschutzerklärung →
        </a>
      </p>
    </div>
  );
}
