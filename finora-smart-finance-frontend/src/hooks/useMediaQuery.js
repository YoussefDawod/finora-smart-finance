import { useCallback, useSyncExternalStore } from 'react';

/**
 * Custom hook for responsive breakpoints
 * Uses useSyncExternalStore for tear-free reads of matchMedia
 */
export const useMediaQuery = (query) => {
  const subscribe = useCallback(
    (callback) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', callback);
      return () => media.removeEventListener('change', callback);
    },
    [query]
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
};

// Preset breakpoint hooks
export const useIsMobile = () => useMediaQuery('(max-width: 639px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
