import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FiEdit3, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';
import { useMotion } from '@/hooks';
import StepCard from '../components/StepCard';
import styles from './HowItWorksSection.module.scss';

const STEPS = [
  { icon: FiEdit3, key: 'step1', number: '01' },
  { icon: FiTrendingUp, key: 'step2', number: '02' },
  { icon: FiCheckCircle, key: 'step3', number: '03' },
];

export default function HowItWorksSection() {
  const { t } = useTranslation();
  const { shouldAnimate } = useMotion();

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.15 } },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div className={styles.howItWorks}>
      <motion.div
        className={styles.header}
        variants={shouldAnimate ? fadeUp : undefined}
        initial={shouldAnimate ? 'hidden' : false}
        whileInView={shouldAnimate ? 'show' : undefined}
        viewport={{ once: true, amount: 0.5 }}
      >
        <h2 className={styles.title}>{t('landing.howItWorks.title')}</h2>
        <p className={styles.subtitle}>{t('landing.howItWorks.subtitle')}</p>
      </motion.div>

      <motion.div
        className={styles.steps}
        variants={shouldAnimate ? container : undefined}
        initial={shouldAnimate ? 'hidden' : false}
        whileInView={shouldAnimate ? 'show' : undefined}
        viewport={{ once: true, amount: 0.2 }}
      >
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isFirst = i === 0;
          const isLast = i === STEPS.length - 1;
          return (
            <div key={step.key} className={styles.stepWrapper}>
              <div className={styles.iconTrack} aria-hidden="true">
                <span
                  className={`${styles.trackLine}${isFirst ? ` ${styles.trackLineHidden}` : ''}`}
                />
                <div className={styles.stepIconDesktop}>
                  <Icon size={24} />
                </div>
                <span
                  className={`${styles.trackLine}${isLast ? ` ${styles.trackLineHidden}` : ''}`}
                />
              </div>
              <StepCard
                icon={step.icon}
                number={step.number}
                title={t(`landing.howItWorks.${step.key}.title`)}
                description={t(`landing.howItWorks.${step.key}.description`)}
                index={i}
              />
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
