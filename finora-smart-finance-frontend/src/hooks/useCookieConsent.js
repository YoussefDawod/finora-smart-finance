import { useContext } from 'react';

// Import the context directly to avoid circular deps
import { createContext } from 'react';

// Re-export context for the provider (shared reference)
export const CookieConsentContext = createContext(null);

/**
 * Hook to access the privacy notice state and actions.
 * @returns {{ noticeSeen: boolean, showNotice: boolean, dismissNotice: () => void, reopenNotice: () => void, closeNotice: () => void }}
 */
export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error('useCookieConsent must be used within CookieConsentProvider');
  return ctx;
}
