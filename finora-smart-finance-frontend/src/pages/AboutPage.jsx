import { useTranslation } from 'react-i18next';
import { FiCheck } from 'react-icons/fi';
import styles from './about/AboutPage.module.scss';

export default function AboutPage() {
  const { t } = useTranslation();
  const values = t('about.values.items', { returnObjects: true });

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>{t('about.title')}</h1>
          <p className={styles.subtitle}>{t('about.subtitle')}</p>
        </div>

        <div className={styles.aboutSection}>
          <h2 className={styles.aboutSectionTitle}>{t('about.mission.title')}</h2>
          <p className={styles.aboutSectionText}>{t('about.mission.description')}</p>
        </div>

        <div className={styles.aboutSection}>
          <h2 className={styles.aboutSectionTitle}>{t('about.whatIs.title')}</h2>
          <p className={styles.aboutSectionText}>{t('about.whatIs.description')}</p>
        </div>

        <div className={styles.aboutSection}>
          <h2 className={styles.aboutSectionTitle}>{t('about.audience.title')}</h2>
          <p className={styles.aboutSectionText}>{t('about.audience.description')}</p>
        </div>

        <div className={styles.aboutSection}>
          <h2 className={styles.aboutSectionTitle}>{t('about.values.title')}</h2>
          {Array.isArray(values) && (
            <ul className={styles.aboutValuesList}>
              {values.map((value, index) => (
                <li key={index} className={styles.aboutValueItem}>
                  <FiCheck />
                  <span>{value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.aboutSection}>
          <h2 className={styles.aboutSectionTitle}>{t('about.developer.title')}</h2>
          <div className={styles.developerCard}>
            <div className={styles.developerAvatar}>YD</div>
            <div className={styles.developerInfo}>
              <div className={styles.developerName}>{t('about.developer.name')}</div>
              <div className={styles.developerRole}>{t('about.developer.role')}</div>
              <p className={styles.developerDesc}>{t('about.developer.description')}</p>
            </div>
          </div>
        </div>

        <div className={styles.aboutSection}>
          <h2 className={styles.aboutSectionTitle}>{t('about.tech.title')}</h2>
          <p className={styles.aboutSectionText}>{t('about.tech.description')}</p>
        </div>
      </div>
    </div>
  );
}
