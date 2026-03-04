import { useTranslation, Trans } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import MiniFooter from '@/components/common/MiniFooter/MiniFooter';
import styles from './InfoPage.module.scss';

export default function HelpPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sections = t('help.sections', { returnObjects: true });

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  // Last section uses Trans for clickable links (email, contact, FAQ)
  const isLastSection = (index) => Array.isArray(sections) && index === sections.length - 1;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageContent}>
        <button type="button" onClick={handleBack} className={styles.backButton} aria-label={t('common.back')}>
          <FiArrowLeft />
        </button>

        <div className={styles.pageHeader}>
          <h1 className={styles.title}>{t('help.title')}</h1>
          <p className={styles.subtitle}>{t('help.subtitle')}</p>
        </div>

        {Array.isArray(sections) && sections.map((section, index) => (
          <div key={`help-${index}`} className={styles.helpSection}>
            <h2>{section.title}</h2>
            {isLastSection(index) ? (
              section.paragraphs?.map((_, pIndex) => (
                <p key={`help-p-${pIndex}`}>
                  <Trans
                    i18nKey={`help.sections.${index}.paragraphs.${pIndex}`}
                    components={{
                      email: <a href="mailto:info@finora.dawoddev.com" className={styles.helpLink} />,
                      contactLink: <Link to="/contact" className={styles.helpLink} />,
                      faqLink: <Link to="/faq" className={styles.helpLink} />,
                    }}
                  />
                </p>
              ))
            ) : (
              section.paragraphs?.map((paragraph, pIndex) => (
                <p key={`help-p-${pIndex}`}>{paragraph}</p>
              ))
            )}
          </div>
        ))}

        <MiniFooter />
      </div>
    </div>
  );
}
