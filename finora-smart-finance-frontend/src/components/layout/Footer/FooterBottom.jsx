import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import FooterNewsletter from './FooterNewsletter';
import LanguageSwitcher from './LanguageSwitcher';
import styles from './Footer.module.scss';

function FooterBottom() {
  const { t } = useTranslation();

  return (
    <div className={styles.bottom}>
      <div className={styles.bottomRow}>
        <FooterNewsletter />
        <LanguageSwitcher />
      </div>

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
