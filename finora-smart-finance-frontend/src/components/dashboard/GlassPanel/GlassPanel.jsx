/**
 * @fileoverview GlassPanel Component
 * @description Frosted glass panel — base building block for all Aurora Flow panels.
 * Supports three variants and an elevated (hover-lift) mode.
 */

import { forwardRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMotion } from '@/hooks/useMotion';
import styles from './GlassPanel.module.scss';

const panelSpring = { stiffness: 260, damping: 25, mass: 1 };

const panelVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', ...panelSpring },
  },
};

const GlassPanel = forwardRef(function GlassPanel(
  { variant = 'standard', elevated = false, children, className = '', as: Tag = 'div', ...rest },
  ref
) {
  const { shouldAnimate } = useMotion();
  const MotionTag = useMemo(() => motion.create(Tag), [Tag]);

  const classes = [styles[variant] || styles.standard, elevated && styles.elevated, className]
    .filter(Boolean)
    .join(' ');

  /* eslint-disable react-hooks/static-components */
  return (
    <MotionTag
      ref={ref}
      className={classes}
      variants={panelVariants}
      initial={shouldAnimate ? 'hidden' : false}
      animate={shouldAnimate ? 'visible' : false}
      {...rest}
    >
      {children}
    </MotionTag>
  );
  /* eslint-enable react-hooks/static-components */
});

export default GlassPanel;
