/**
 * Generic motion-enabled box with sensible defaults.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useMotion } from '../../context/MotionContext';
import { tweenPresets, resolveTransition } from '../../config/framerMotionConfig';

const defaultVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
};

export const MotionBox = ({ variants = defaultVariants, transition = tweenPresets.normal, children, ...rest }) => {
  const { prefersReducedMotion, animationsEnabled } = useMotion();
  const disabled = prefersReducedMotion || !animationsEnabled;
  const resolvedTransition = resolveTransition(transition, disabled);

  return (
    <motion.div
      variants={disabled ? undefined : variants}
      initial={disabled ? false : 'initial'}
      animate={disabled ? undefined : 'animate'}
      exit={disabled ? undefined : 'exit'}
      transition={resolvedTransition}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

MotionBox.propTypes = {
  variants: PropTypes.object,
  transition: PropTypes.object,
  children: PropTypes.node,
};

export default MotionBox;
