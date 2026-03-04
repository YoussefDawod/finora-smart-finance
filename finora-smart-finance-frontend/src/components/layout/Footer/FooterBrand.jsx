/**
 * @fileoverview FooterBrand — Full-width Top-Band mit Logo + Beschreibung
 * Keine Social Icons — die sind jetzt in FooterNav (Unternehmen-Spalte).
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/common';
import styles from './Footer.module.scss';

function FooterBrand() {
  const { t } = useTranslation();

  return (
    <div className={styles.brand}>
      <Logo className={styles.brandLogo} disableNavigation entrance="none" />
      <p className={styles.brandDescription}>{t('footer.brand.description')}</p>
    </div>
  );
}

export default memo(FooterBrand);
