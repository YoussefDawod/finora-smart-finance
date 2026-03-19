import { useTranslation } from 'react-i18next';
import {
  FiDollarSign,
  FiPieChart,
  FiBarChart2,
  FiDownload,
  FiSearch,
  FiGlobe,
  FiMonitor,
  FiMoon,
  FiShield,
} from 'react-icons/fi';
import styles from './features/FeaturesPage.module.scss';

const FEATURE_ICONS = [
  FiDollarSign,
  FiPieChart,
  FiBarChart2,
  FiDownload,
  FiSearch,
  FiGlobe,
  FiMonitor,
  FiMoon,
  FiShield,
];

export default function FeaturesPage() {
  const { t } = useTranslation();
  const items = t('features.items', { returnObjects: true });

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>{t('features.title')}</h1>
          <p className={styles.subtitle}>{t('features.subtitle')}</p>
        </div>

        <div className={styles.featuresGrid}>
          {Array.isArray(items) &&
            items.map((item, index) => {
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
