import { FiStar } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useMotion } from '@/hooks';
import styles from '../sections/TestimonialsSection.module.scss';

export default function TestimonialCard({ rating, text, username, index = 0 }) {
  const { shouldAnimate } = useMotion();

  const variant = {
    hidden: { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, delay: index * 0.1, ease: 'easeOut' },
    },
  };

  return (
    <motion.div className={styles.card} variants={shouldAnimate ? variant : undefined}>
      <span className={styles.quoteIcon} aria-hidden="true">
        &ldquo;
      </span>

      <div className={styles.stars}>
        {Array.from({ length: 5 }).map((_, i) => (
          <FiStar key={i} size={16} className={i < rating ? styles.starFilled : styles.starEmpty} />
        ))}
      </div>

      <p className={styles.text}>{text}</p>
      <span className={styles.username}>{username}</span>
    </motion.div>
  );
}
