import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import styles from './TermsPage.module.scss';

export default function PrivacyNoticePage() {
  const { t } = useTranslation();
  const sections = t('privacyNoticePage.sections', { returnObjects: true });

  return (
    <div className={styles.termsContainer}>
      <div className={styles.termsContent}>
        <h1 className={styles.title}>{t('privacyNoticePage.title')}</h1>
        <p className={styles.lastUpdated}>{t('privacyNoticePage.lastUpdated')}</p>
        <p className={styles.intro}>{t('privacyNoticePage.intro')}</p>

        {Array.isArray(sections) &&
          sections.map((section, index) => (
            <section key={`${section.title}-${index}`} className={styles.section}>
              <h2>{section.title}</h2>
              {section.paragraphs?.map((paragraph, pIndex) => (
                <p key={`${section.title}-p-${pIndex}`}>{paragraph}</p>
              ))}
            </section>
          ))}

        <div className={styles.fullPolicyLink}>
          <Link to="/privacy">{t('privacyNoticePage.fullPolicyLink')}</Link>
        </div>
      </div>
    </div>
  );
}
