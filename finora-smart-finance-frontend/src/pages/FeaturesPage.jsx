import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiDollarSign, FiPieChart, FiBarChart2, FiDownload, FiGlobe, FiShield } from 'react-icons/fi';
import styles from './InfoPage.module.scss';

const FEATURE_ICONS = [FiDollarSign, FiPieChart, FiBarChart2, FiDownload, FiGlobe, FiShield];

export default function FeaturesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const items = t('features.items', { returnObjects: true });

  return (
    <div className={styles.pageContainer}>
      <div className={`${styles.pageContent} ${styles.wideContent}`}>
        <button type="button" onClick={() => navigate(-1)} className={styles.backLink}>
          <FiArrowLeft />
          {t('features.backLink')}
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
      </div>
    </div>
  );
}
