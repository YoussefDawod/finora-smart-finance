import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiDollarSign, FiPieChart, FiBarChart2, FiDownload, FiSearch, FiGlobe, FiMonitor, FiMoon, FiShield } from 'react-icons/fi';
import MiniFooter from '@/components/common/MiniFooter/MiniFooter';
import styles from './InfoPage.module.scss';

const FEATURE_ICONS = [FiDollarSign, FiPieChart, FiBarChart2, FiDownload, FiSearch, FiGlobe, FiMonitor, FiMoon, FiShield];

export default function FeaturesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const items = t('features.items', { returnObjects: true });

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={`${styles.pageContent} ${styles.wideContent}`}>
        <button type="button" onClick={handleBack} className={styles.backButton} aria-label={t('common.back')}>
          <FiArrowLeft />
        </button>

        <div className={styles.pageHeader}>
          <h1 className={styles.title}>{t('features.title')}</h1>
          <p className={styles.subtitle}>{t('features.subtitle')}</p>
        </div>

        <div className={styles.featuresGrid}>
          {Array.isArray(items) && items.map((item, index) => {
            const Icon = FEATURE_ICONS[index] || FiDollarSign;
            return (
              <div key={`feature-${index}`} className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <Icon />
                </div>
                <h3 className={styles.featureTitle}>{item.title}</h3>
                <p className={styles.featureDescription}>{item.description}</p>
              </div>
            );
          })}
        </div>

        <MiniFooter />
      </div>
    </div>
  );
}
