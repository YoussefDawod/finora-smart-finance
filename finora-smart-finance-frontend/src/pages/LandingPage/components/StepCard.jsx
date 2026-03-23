import { motion } from 'framer-motion';
import { useMotion } from '@/hooks';
import styles from '../sections/HowItWorksSection.module.scss';

export default function StepCard({ icon: Icon, number, title, description, index = 0 }) {
  const { shouldAnimate } = useMotion();

  const variant = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: index * 0.15, ease: 'easeOut' },
    },
  };

  return (
    <motion.div className={styles.stepCard} variants={shouldAnimate ? variant : undefined}>
      <span className={styles.stepNumber}>{number}</span>
      <div className={styles.stepIcon}>
        <Icon size={24} />
      </div>
      <h3 className={styles.stepTitle}>{title}</h3>
      <p className={styles.stepDesc}>{description}</p>
    </motion.div>
  );
}
