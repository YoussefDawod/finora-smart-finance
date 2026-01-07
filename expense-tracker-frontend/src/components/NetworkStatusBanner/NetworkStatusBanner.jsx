import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useEffect, useState } from 'react';
import './NetworkStatusBanner.scss';

export const NetworkStatusBanner = () => {
  const { isOnline, isOffline, wasOffline } = useNetworkStatus();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setShowBanner(true);
    } else if (wasOffline && isOnline) {
      setShowBanner(true);
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => setShowBanner(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOffline, isOnline, wasOffline]);

  if (!showBanner) return null;

  if (isOffline) {
    return (
      <div className="network-banner network-banner--offline" role="alert">
        <span className="network-banner__icon">📡</span>
        <span className="network-banner__text">
          Keine Internetverbindung. Änderungen werden lokal gespeichert.
        </span>
      </div>
    );
  }

  if (wasOffline && isOnline) {
    return (
      <div className="network-banner network-banner--online" role="alert">
        <span className="network-banner__icon">✅</span>
        <span className="network-banner__text">
          Verbindung wiederhergestellt. Synchronisiere Daten...
        </span>
      </div>
    );
  }

  return null;
};
