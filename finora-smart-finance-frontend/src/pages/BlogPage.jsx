import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit3 } from 'react-icons/fi';
import styles from './InfoPage.module.scss';

export default function BlogPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageContent}>
        <button type="button" onClick={() => navigate(-1)} className={styles.backLink}>
          <FiArrowLeft />
          {t('blog.backLink')}
        </button>

        <div className={styles.pageHeader}>
          <h1 className={styles.title}>{t('blog.title')}</h1>
          <p className={styles.subtitle}>{t('blog.subtitle')}</p>
        </div>

        <div className={styles.comingSoon}>
          <div className={styles.comingSoonIcon}>
            <FiEdit3 />
          </div>
          <h2 className={styles.comingSoonTitle}>{t('blog.comingSoon')}</h2>
          <p className={styles.comingSoonText}>{t('blog.comingSoonDescription')}</p>
        </div>
      </div>
    </div>
  );
}
