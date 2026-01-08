/**
 * Motion-enabled list item with fade + slide and optional stagger.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useMotion } from '../../context/MotionContext';
import { tweenPresets, resolveTransition } from '../../config/framerMotionConfig';

const baseVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};

const normalizeMs = (val) => {
  if (typeof val === 'string') {
    const numeric = parseFloat(val.replace('ms', ''));
    return Number.isNaN(numeric) ? 0 : numeric;
  }
  return Number(val || 0);
};

export const MotionListItem = ({ index = 0, delay = 40, variants = baseVariants, transition = tweenPresets.normal, children, ...rest }) => {
  const { prefersReducedMotion, animationsEnabled } = useMotion();
  const disabled = prefersReducedMotion || !animationsEnabled;
  const delaySeconds = disabled ? 0 : (normalizeMs(delay) * index) / 1000;

  return (
    <motion.li
      variants={disabled ? undefined : variants}
      initial={disabled ? false : 'initial'}
      animate={disabled ? undefined : 'animate'}
      exit={disabled ? undefined : 'exit'}
      transition={{ ...resolveTransition(transition, disabled), delay: delaySeconds }}
      {...rest}
    >
      {children}
    </motion.li>
  );
};

MotionListItem.propTypes = {
  index: PropTypes.number,
  delay: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  variants: PropTypes.object,
  transition: PropTypes.object,
  children: PropTypes.node,
};

export default MotionListItem;
