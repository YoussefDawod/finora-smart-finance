import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowUp } from 'react-icons/fi';
import { useMotion } from '@/hooks/useMotion';
import styles from './Footer.module.scss';

const BTT_INITIAL = { opacity: 0, scale: 0.8 };
const BTT_ANIMATE = { opacity: 1, scale: 1 };
const BTT_EXIT = { opacity: 0, scale: 0.8 };
const BTT_HOVER = { scale: 1.05 };
const BTT_TAP = { scale: 0.95 };
const BTT_TRANSITION = { type: 'spring', stiffness: 400, damping: 25 };

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
          initial={shouldAnimate ? BTT_INITIAL : false}
          animate={shouldAnimate ? BTT_ANIMATE : false}
          exit={shouldAnimate ? BTT_EXIT : undefined}
          whileHover={shouldAnimate ? BTT_HOVER : undefined}
          whileTap={shouldAnimate ? BTT_TAP : undefined}
          transition={BTT_TRANSITION}
          aria-label={t('footer.backToTop')}
          title={t('footer.backToTop')}
        >
          <FiArrowUp size={20} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default memo(BackToTop);
