import { motion } from 'framer-motion';
import { useMotion } from '@/hooks';
import styles from '../sections/FeaturesSection.module.scss';

export default function FeatureCard({ icon: Icon, title, description, index = 0 }) {
  const { shouldAnimate } = useMotion();

  const cardVariant = {
    hidden: { opacity: 0, y: 28 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, delay: index * 0.08, ease: 'easeOut' },
    },
  };

  return (
    <motion.div className={styles.featureCard} variants={shouldAnimate ? cardVariant : undefined}>
      <div className={styles.featureIcon}>
        <Icon size={22} />
      </div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDesc}>{description}</p>
    </motion.div>
  );
}
