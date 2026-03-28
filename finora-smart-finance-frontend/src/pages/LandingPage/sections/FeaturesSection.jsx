import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FiCreditCard, FiBarChart2, FiGlobe, FiDownload, FiUnlock, FiMoon } from 'react-icons/fi';
import { useMotion } from '@/hooks/useMotion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MEDIA_QUERIES } from '@/constants/breakpoints';
import FeatureCard from '../components/FeatureCard';
import styles from './FeaturesSection.module.scss';

const FEATURES = [
  { icon: FiCreditCard, key: 'transactions' },
  { icon: FiBarChart2, key: 'dashboard' },
  { icon: FiGlobe, key: 'languages' },
  { icon: FiDownload, key: 'importExport' },
  { icon: FiUnlock, key: 'guestMode' },
  { icon: FiMoon, key: 'darkMode' },
];

export default function FeaturesSection() {
  const { t } = useTranslation();
  const { shouldAnimate } = useMotion();
  const isMobile = useMediaQuery(MEDIA_QUERIES.mobile);
  const scrollRef = useRef(null);

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div className={styles.features}>
      <motion.div
        className={styles.header}
        variants={shouldAnimate ? fadeUp : undefined}
        initial={shouldAnimate ? 'hidden' : false}
        whileInView={shouldAnimate ? 'show' : undefined}
        viewport={{ once: true, amount: 0.5 }}
      >
        <h2 className={styles.title}>{t('landing.features.title')}</h2>
        <p className={styles.subtitle}>{t('landing.features.subtitle')}</p>
      </motion.div>

      {isMobile ? (
        /* Mobile: horizontales Karussell */
        <div className={styles.carousel} ref={scrollRef}>
          {FEATURES.map((feat, i) => (
            <div key={feat.key} className={styles.carouselItem}>
              <FeatureCard
                icon={feat.icon}
                title={t(`landing.features.${feat.key}.title`)}
                description={t(`landing.features.${feat.key}.description`)}
                index={i}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Desktop / Tablet: Bento Grid */
        <motion.div
          className={styles.grid}
          variants={shouldAnimate ? container : undefined}
          initial={shouldAnimate ? 'hidden' : false}
          whileInView={shouldAnimate ? 'show' : undefined}
          viewport={{ once: true, amount: 0.2 }}
        >
          {FEATURES.map((feat, i) => (
            <FeatureCard
              key={feat.key}
              icon={feat.icon}
              title={t(`landing.features.${feat.key}.title`)}
              description={t(`landing.features.${feat.key}.description`)}
              index={i}
            />
          ))}
        </motion.div>
      )}

      <motion.div
        className={styles.moreLink}
        variants={shouldAnimate ? fadeUp : undefined}
        initial={shouldAnimate ? 'hidden' : false}
        whileInView={shouldAnimate ? 'show' : undefined}
        viewport={{ once: true }}
      >
        <Link to="/features" className={styles.allFeatures}>
          {t('landing.features.allFeatures')} →
        </Link>
      </motion.div>
    </div>
  );
}
