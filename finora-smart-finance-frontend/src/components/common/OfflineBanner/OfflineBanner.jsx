/**
 * @fileoverview OfflineBanner Component
 * @description Zeigt ein dezentes Banner am oberen Rand, wenn der
 *              Benutzer offline ist. Verschwindet automatisch, sobald
 *              die Verbindung wiederhergestellt wird.
 *
 * @module components/common/OfflineBanner
 */

import { useTranslation } from 'react-i18next';
import { FiWifiOff } from 'react-icons/fi';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import styles from './OfflineBanner.module.scss';

/**
 * Offline-Banner – wird nur im Offline-Zustand gerendert.
 * @returns {JSX.Element|null}
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { t } = useTranslation();

  if (isOnline) return null;

  return (
    <div className={styles.banner} role="alert" aria-live="assertive">
      <FiWifiOff className={styles.icon} aria-hidden="true" />
      <span>{t('common.offline', 'Du bist offline – einige Funktionen sind eingeschränkt')}</span>
    </div>
  );
}

export default OfflineBanner;
