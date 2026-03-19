import { useTranslation, Trans } from 'react-i18next';
import { Link } from 'react-router-dom';
import styles from './help/HelpPage.module.scss';

export default function HelpPage() {
  const { t } = useTranslation();
  const sections = t('help.sections', { returnObjects: true });

  // Last section uses Trans for clickable links (email, contact, FAQ)
  const isLastSection = index => Array.isArray(sections) && index === sections.length - 1;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>{t('help.title')}</h1>
          <p className={styles.subtitle}>{t('help.subtitle')}</p>
        </div>

        {Array.isArray(sections) &&
          sections.map((section, index) => (
            <div key={`help-${index}`} className={styles.helpSection}>
              <h2>{section.title}</h2>
              {isLastSection(index)
                ? section.paragraphs?.map((_, pIndex) => (
                    <p key={`help-p-${pIndex}`}>
                      <Trans
                        i18nKey={`help.sections.${index}.paragraphs.${pIndex}`}
                        components={{
                          email: (
                            <a href="mailto:info@finora.dawoddev.com" className={styles.helpLink} />
                          ),
                          contactLink: <Link to="/contact" className={styles.helpLink} />,
                          faqLink: <Link to="/faq" className={styles.helpLink} />,
                        }}
                      />
                    </p>
                  ))
                : section.paragraphs?.map((paragraph, pIndex) => (
                    <p key={`help-p-${pIndex}`}>{paragraph}</p>
                  ))}
            </div>
          ))}
      </div>
    </div>
  );
}
