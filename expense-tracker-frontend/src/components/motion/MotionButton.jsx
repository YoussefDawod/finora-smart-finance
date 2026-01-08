/**
 * Motion-enabled button with hover/tap animations.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useHoverAnimation, useTapAnimation } from '../../hooks/useGestureAnimation';
import { useMotion } from '../../context/MotionContext';
import { tweenPresets, resolveTransition } from '../../config/framerMotionConfig';

export const MotionButton = ({ children, transition = tweenPresets.fast, ...rest }) => {
  const hover = useHoverAnimation();
  const tap = useTapAnimation();
  const { prefersReducedMotion, animationsEnabled } = useMotion();
  const disabled = prefersReducedMotion || !animationsEnabled;

  return (
    <motion.button
      {...hover}
      {...tap}
      whileHover={disabled ? undefined : hover.whileHover}
      whileTap={disabled ? undefined : tap.whileTap}
      transition={resolveTransition(transition, disabled)}
      {...rest}
    >
      {children}
    </motion.button>
  );
};

MotionButton.propTypes = {
  children: PropTypes.node,
  transition: PropTypes.object,
};

export default MotionButton;
