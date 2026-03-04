/**
 * @fileoverview FooterBottom — Bottom-Bar des Footers
 *
 * Zeile 1: Newsletter (links) | Language Switcher (rechts)
 * Zeile 2: Zentrierter Copyright-Text mit „Youssef Dawod" als Link zu dawoddev.com
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import FooterNewsletter from './FooterNewsletter';
import LanguageSwitcher from './LanguageSwitcher';
import styles from './Footer.module.scss';

function FooterBottom() {
  const { t } = useTranslation();

  return (
    <div className={styles.bottom}>
      {/* Zeile 1: Newsletter links — Sprache rechts */}
      <div className={styles.bottomRow}>
        <FooterNewsletter />
        <LanguageSwitcher />
      </div>

      {/* Zeile 2: Zentrierter Copyright */}
      <div className={styles.copyrightRow}>
        <p className={styles.copyright}>
          © {new Date().getFullYear()} Finora.{' '}
          <a
            href="https://dawoddev.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.copyrightLink}
          >
            Youssef Dawod
          </a>
        </p>
        <span className={styles.copyrightDivider}> — </span>
        <p className={styles.rights}>{t('footer.allRightsReserved')}</p>
      </div>
    </div>
  );
}

export default memo(FooterBottom);
