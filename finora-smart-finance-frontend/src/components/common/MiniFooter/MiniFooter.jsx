import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './MiniFooter.module.scss';

function MiniFooter() {
  const { t } = useTranslation();

  return (
    <nav className={styles.miniFooter} aria-label={t('miniFooter.ariaLabel')}>
      <Link to="/" className={styles.link}>
        {t('miniFooter.home')}
      </Link>
      <span className={styles.divider} aria-hidden="true">
        ·
      </span>
      <Link to="/impressum" className={styles.link}>
        {t('footer.impressum')}
      </Link>
      <span className={styles.divider} aria-hidden="true">
        ·
      </span>
      <Link to="/privacy" className={styles.link}>
        {t('footer.privacy')}
      </Link>
      <span className={styles.divider} aria-hidden="true">
        ·
      </span>
      <Link to="/terms" className={styles.link}>
        {t('footer.terms')}
      </Link>
    </nav>
  );
}

export default memo(MiniFooter);
