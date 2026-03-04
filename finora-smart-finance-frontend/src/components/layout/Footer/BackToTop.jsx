/**
 * @fileoverview BackToTop — Animierter Scroll-to-Top-Button
 *
 * Wird vom Footer gesteuert über `visible`-Prop (IntersectionObserver bleibt in Footer.jsx).
 */

import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowUp } from 'react-icons/fi';
import PropTypes from 'prop-types';
import { useMotion } from '@/hooks/useMotion';
import styles from './Footer.module.scss';

function BackToTop({ visible }) {
  const { t } = useTranslation();
  const { shouldAnimate } = useMotion();

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          className={styles.backToTop}
          onClick={scrollToTop}
          initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : false}
          animate={shouldAnimate ? { opacity: 1, scale: 1 } : false}
          exit={shouldAnimate ? { opacity: 0, scale: 0.8 } : undefined}
          whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
          whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
          aria-label={t('footer.backToTop')}
          title={t('footer.backToTop')}
        >
          <FiArrowUp size={20} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

BackToTop.propTypes = {
  visible: PropTypes.bool.isRequired,
};

export default memo(BackToTop);
