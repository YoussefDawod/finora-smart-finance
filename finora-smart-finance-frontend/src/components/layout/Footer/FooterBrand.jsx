/**
 * @fileoverview FooterBrand — Full-width Top-Band mit Logo + Beschreibung
 * Keine Social Icons — die sind jetzt in FooterNav (Unternehmen-Spalte).
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Footer.module.scss';

function FooterBrand() {
  const { t } = useTranslation();

  return (
    <div className={styles.brand}>
      <img src="/logo-branding/finora-logo.svg" alt="Finora" className={`app-logo ${styles.brandLogo}`} />
      <p className={styles.brandDescription}>{t('footer.brand.description')}</p>
    </div>
  );
}

export default memo(FooterBrand);
