/**
 * React hook to respect user motion preferences.
 * Observes the `prefers-reduced-motion` media query and updates in real time.
 */
import { useEffect, useState } from 'react';

const MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const getInitialPreference = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia(MOTION_QUERY).matches;
};

/**
 * Returns the current motion preference.
 * @returns {{ prefersReducedMotion: boolean }}
 */
export const useMotionPreference = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getInitialPreference);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(MOTION_QUERY);
    const updatePreference = (event) => setPrefersReducedMotion(event.matches);

    updatePreference(mediaQuery);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updatePreference);
    } else {
      mediaQuery.addListener(updatePreference);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', updatePreference);
      } else {
        mediaQuery.removeListener(updatePreference);
      }
    };
  }, []);

  return { prefersReducedMotion };
};
