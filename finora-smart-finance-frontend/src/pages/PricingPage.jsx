import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import MiniFooter from '@/components/common/MiniFooter/MiniFooter';
import styles from './InfoPage.module.scss';

export default function PricingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const plans = t('pricing.plans', { returnObjects: true });
  const [expandedCards, setExpandedCards] = useState({});

  const toggleExpand = (index) => {
    setExpandedCards((prev) => ({ ...prev, [index]: !prev[index] }));
  };

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
          <h1 className={styles.title}>{t('pricing.title')}</h1>
          <p className={styles.subtitle}>{t('pricing.subtitle')}</p>
        </div>

        <div className={styles.pricingGrid}>
          {Array.isArray(plans) && plans.map((plan, index) => {
            const isPopular = index === 1;
            const isExpanded = !!expandedCards[index];
            const hasExtras = plan.extraFeatures?.length > 0;
            return (
              <div
                key={`plan-${index}`}
                className={`${styles.pricingCard} ${isPopular ? styles.pricingPopular : ''}`}
              >
                {isPopular && (
                  <span className={styles.popularBadge}>{t('pricing.popular')}</span>
                )}
                <h3 className={styles.planName}>{plan.name}</h3>
                <div className={styles.planPrice}>{plan.price}</div>
                <p className={styles.planDescription}>{plan.description}</p>
                <ul className={styles.planFeatures}>
                  {plan.features?.map((feature, fIndex) => (
                    <li key={`feature-${fIndex}`} className={styles.planFeatureItem}>
                      <FiCheck />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {hasExtras && (
                  <>
                    <button
                      type="button"
                      className={styles.showMoreBtn}
                      onClick={() => toggleExpand(index)}
                      aria-expanded={isExpanded}
                    >
                      <span>{isExpanded ? t('pricing.showLess') : t('pricing.showMore')}</span>
                      {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                    {isExpanded && (
                      <ul className={`${styles.planFeatures} ${styles.extraFeatures}`}>
                        {plan.extraFeatures.map((extra, eIndex) => (
                          <li key={`extra-${eIndex}`} className={styles.planFeatureItem}>
                            <FiCheck />
                            <span>{extra}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
                <Link
                  to={isPopular ? '/register' : '/dashboard'}
                  className={`${styles.planCta} ${!isPopular ? styles.planCtaOutline : ''}`}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>

        <MiniFooter />
      </div>
    </div>
  );
}
