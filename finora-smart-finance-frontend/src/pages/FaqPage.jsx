import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiChevronDown } from 'react-icons/fi';
import MiniFooter from '@/components/common/MiniFooter/MiniFooter';
import styles from './InfoPage.module.scss';

export default function FaqPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const questions = t('faq.questions', { returnObjects: true });
  const [openIndex, setOpenIndex] = useState(null);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const toggleQuestion = useCallback((index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  }, []);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageContent}>
        <button type="button" onClick={handleBack} className={styles.backButton} aria-label={t('common.back')}>
          <FiArrowLeft />
        </button>

        <div className={styles.pageHeader}>
          <h1 className={styles.title}>{t('faq.title')}</h1>
          <p className={styles.subtitle}>{t('faq.subtitle')}</p>
        </div>

        <div className={styles.faqList}>
          {Array.isArray(questions) && questions.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={`faq-${index}`} className={styles.faqItem}>
                <button
                  type="button"
                  className={`${styles.faqQuestion} ${isOpen ? styles.faqQuestionOpen : ''}`}
                  onClick={() => toggleQuestion(index)}
                  aria-expanded={isOpen}
                >
                  <span>{item.question}</span>
                  <FiChevronDown />
                </button>
                {isOpen && (
                  <div className={styles.faqAnswer}>
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <MiniFooter />
      </div>
    </div>
  );
}
