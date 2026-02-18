/**
 * @fileoverview AuthRequiredOverlay Component
 * @description Overlay für Features, die eine Anmeldung erfordern.
 * Zeigt den gesperrten Inhalt verschwommen mit einem Hinweis zur Anmeldung.
 */

import { Link } from 'react-router-dom';
import { FiLock } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import styles from './AuthRequiredOverlay.module.scss';

export default function AuthRequiredOverlay({ children }) {
  const { t } = useTranslation();

  return (
    <div className={styles.wrapper}>
      <div className={styles.content} aria-hidden="true">
        {children}
      </div>
      <div className={styles.overlay}>
        <FiLock className={styles.icon} />
        <p className={styles.message}>{t('auth.requiredMessage')}</p>
        <Link to="/login" className={styles.link}>
          {t('auth.loginOrRegister')}
        </Link>
      </div>
    </div>
  );
}
