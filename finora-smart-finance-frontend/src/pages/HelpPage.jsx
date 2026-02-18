import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import styles from './InfoPage.module.scss';

export default function HelpPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sections = t('help.sections', { returnObjects: true });

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageContent}>
        <button type="button" onClick={() => navigate(-1)} className={styles.backLink}>
          <FiArrowLeft />
          {t('help.backLink')}
        </button>

        <div className={styles.pageHeader}>
          <h1 className={styles.title}>{t('help.title')}</h1>
          <p className={styles.subtitle}>{t('help.subtitle')}</p>
        </div>

        {Array.isArray(sections) && sections.map((section, index) => (
          <div key={`help-${index}`} className={styles.helpSection}>
            <h2>{section.title}</h2>
            {section.paragraphs?.map((paragraph, pIndex) => (
              <p key={`help-p-${pIndex}`}>{paragraph}</p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
