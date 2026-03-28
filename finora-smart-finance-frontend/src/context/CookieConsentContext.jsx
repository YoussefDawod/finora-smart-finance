/**
 * @fileoverview Privacy Notice Provider — Einfacher Datenschutz-Hinweis
 *
 * Ersetzt das ehemalige 2-Layer-Consent-Banner.
 * Da ausschließlich technisch notwendige Speicherung erfolgt,
 * genügt ein reiner Informationshinweis (kein Consent nötig).
 *
 * localStorage-Key: "privacyNoticeSeen" (boolean)
 */

import { useState, useCallback, useMemo } from 'react';
import { CookieConsentContext } from '@/hooks/useCookieConsent';

const STORAGE_KEY = 'privacyNoticeSeen';

/**
 * Check if the privacy notice has been seen before.
 */
function hasSeenNotice() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * CookieConsentProvider — manages privacy notice visibility.
 * Wraps the entire app so any component can read/control the notice.
 */
export function CookieConsentProvider({ children }) {
  const [noticeSeen, setNoticeSeen] = useState(hasSeenNotice);
  const [showNotice, setShowNotice] = useState(false);

  // Dismiss the notice and persist to localStorage
  const dismissNotice = useCallback(() => {
    setNoticeSeen(true);
    setShowNotice(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Storage full — silently fail
    }
  }, []);

  // Re-open the notice (e.g. from Footer link)
  const reopenNotice = useCallback(() => {
    setShowNotice(true);
  }, []);

  // Close notice without changing seen-state (only when re-opened)
  const closeNotice = useCallback(() => {
    setShowNotice(false);
  }, []);

  const value = useMemo(
    () => ({
      noticeSeen,
      showNotice,
      dismissNotice,
      reopenNotice,
      closeNotice,
    }),
    [noticeSeen, showNotice, dismissNotice, reopenNotice, closeNotice]
  );

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}
