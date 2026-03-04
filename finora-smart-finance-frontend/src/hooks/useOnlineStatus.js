/**
 * @fileoverview useOnlineStatus Hook
 * @description Erkennt den Online/Offline-Status des Browsers und
 *              gibt ihn als reaktiven State zurück.
 *
 * @module hooks/useOnlineStatus
 */

import { useState, useEffect } from 'react';

/**
 * Hook für reaktiven Online/Offline-Status.
 * @returns {boolean} true wenn online, false wenn offline
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export default useOnlineStatus;
