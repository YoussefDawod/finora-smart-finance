import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FiCheck, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import styles from './pricing/PricingPage.module.scss';

export default function PricingPage() {
  const { t } = useTranslation();
  const plans = t('pricing.plans', { returnObjects: true });
  const [expandedCards, setExpandedCards] = useState({});

  const toggleExpand = index => {
    setExpandedCards(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>{t('pricing.title')}</h1>
          <p className={styles.subtitle}>{t('pricing.subtitle')}</p>
        </div>

        <div className={styles.pricingGrid}>
          {Array.isArray(plans) &&
            plans.map((plan, index) => {
              const isPopular = index === 1;
              const isExpanded = !!expandedCards[index];
              const hasExtras = plan.extraFeatures?.length > 0;
              return (
                <div
                  key={`plan-${index}`}
                  className={`${styles.pricingCard} ${isPopular ? styles.pricingPopular : ''}`}
                >
                  {isPopular && <span className={styles.popularBadge}>{t('pricing.popular')}</span>}
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
      </div>
    </div>
  );
}
