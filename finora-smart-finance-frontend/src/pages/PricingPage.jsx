import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';
import styles from './InfoPage.module.scss';

export default function PricingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const plans = t('pricing.plans', { returnObjects: true });

  return (
    <div className={styles.pageContainer}>
      <div className={`${styles.pageContent} ${styles.wideContent}`}>
        <button type="button" onClick={() => navigate(-1)} className={styles.backLink}>
          <FiArrowLeft />
          {t('pricing.backLink')}
        </button>

        <div className={styles.pageHeader}>
          <h1 className={styles.title}>{t('pricing.title')}</h1>
          <p className={styles.subtitle}>{t('pricing.subtitle')}</p>
        </div>

        <div className={styles.pricingGrid}>
          {Array.isArray(plans) && plans.map((plan, index) => {
            const isPopular = index === 1;
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
