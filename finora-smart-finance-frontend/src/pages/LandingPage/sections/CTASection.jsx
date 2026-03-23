import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import { useMotion } from '@/hooks';
import styles from './CTASection.module.scss';

export default function CTASection() {
  const { t } = useTranslation();
  const { shouldAnimate } = useMotion();

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div className={styles.cta}>
      <motion.div
        className={styles.inner}
        variants={shouldAnimate ? fadeUp : undefined}
        initial={shouldAnimate ? 'hidden' : false}
        whileInView={shouldAnimate ? 'show' : undefined}
        viewport={{ once: true, amount: 0.4 }}
      >
        <h2 className={styles.headline}>{t('landing.cta.headline')}</h2>
        <p className={styles.subheadline}>{t('landing.cta.subheadline')}</p>

        <div className={styles.actions}>
          <Link to="/dashboard" className={styles.ctaPrimary}>
            {t('landing.cta.ctaPrimary')}
            <FiArrowRight size={18} />
          </Link>
          <Link to="/register" className={styles.ctaSecondary}>
            {t('landing.cta.ctaSecondary')}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
