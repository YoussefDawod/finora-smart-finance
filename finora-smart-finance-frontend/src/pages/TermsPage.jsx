import { useTranslation } from 'react-i18next';
import styles from './TermsPage.module.scss';

export default function TermsPage() {
  const { t } = useTranslation();
  const sections = t('terms.sections', { returnObjects: true });
  return (
    <div className={styles.termsContainer}>
      <div className={styles.termsContent}>
        <h1 className={styles.title}>{t('terms.title')}</h1>

        {Array.isArray(sections) && sections.map((section, index) => (
          <section key={`${section.title}-${index}`} className={styles.section}>
            <h2>{section.title}</h2>
            {section.paragraphs?.map((paragraph, pIndex) => (
              <p key={`${section.title}-p-${pIndex}`}>{paragraph}</p>
            ))}
            {section.list?.length > 0 && (
              <ul>
                {section.list.map((item, liIndex) => (
                  <li key={`${section.title}-li-${liIndex}`}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <div className={styles.footer}>
          <p className={styles.lastUpdated}>
            {t('terms.lastUpdated')}
          </p>
        </div>
      </div>
    </div>
  );
}
