import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useMotion } from '@/hooks/useMotion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MEDIA_QUERIES } from '@/constants/breakpoints';
import { feedbackService } from '@/api/feedbackService';
import TestimonialCard from '../components/TestimonialCard';
import styles from './TestimonialsSection.module.scss';

export default function TestimonialsSection({ onLoaded }) {
  const { t } = useTranslation();
  const { shouldAnimate } = useMotion();
  const isMobile = useMediaQuery(MEDIA_QUERIES.mobile);
  const [testimonials, setTestimonials] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchPublicFeedback() {
      try {
        const res = await feedbackService.getPublic({ signal: controller.signal });
        const items = res.data?.data;
        if (Array.isArray(items)) {
          setTestimonials(items);
          onLoaded?.(items.length);
        }
      } catch {
        // Silently fail — section just won't render
      }
    }

    fetchPublicFeedback();
    return () => {
      controller.abort();
    };
  }, [onLoaded]);

  // Keine Feedbacks → Sektion nicht rendern
  if (testimonials.length === 0) return null;

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div className={styles.testimonials}>
      <motion.div
        className={styles.header}
        variants={shouldAnimate ? fadeUp : undefined}
        initial={shouldAnimate ? 'hidden' : false}
        whileInView={shouldAnimate ? 'show' : undefined}
        viewport={{ once: true, amount: 0.5 }}
      >
        <h2 className={styles.title}>{t('landing.testimonials.title')}</h2>
        <p className={styles.subtitle}>{t('landing.testimonials.subtitle')}</p>
      </motion.div>

      {isMobile ? (
        <div className={styles.carousel} ref={scrollRef}>
          {testimonials.map((item, i) => (
            <div key={item._id || i} className={styles.carouselItem}>
              <TestimonialCard
                rating={item.rating}
                text={item.text}
                username={item.displayName}
                index={i}
              />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          className={styles.grid}
          variants={shouldAnimate ? container : undefined}
          initial={shouldAnimate ? 'hidden' : false}
          whileInView={shouldAnimate ? 'show' : undefined}
          viewport={{ once: true, amount: 0.2 }}
        >
          {testimonials.map((item, i) => (
            <TestimonialCard
              key={item._id || i}
              rating={item.rating}
              text={item.text}
              username={item.displayName}
              index={i}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
