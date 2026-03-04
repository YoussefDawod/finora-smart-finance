import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit3 } from 'react-icons/fi';
import MiniFooter from '@/components/common/MiniFooter/MiniFooter';
import styles from './InfoPage.module.scss';

export default function BlogPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageContent}>
        <button type="button" onClick={handleBack} className={styles.backButton} aria-label={t('common.back')}>
          <FiArrowLeft />
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

        <MiniFooter />
      </div>
    </div>
  );
}
