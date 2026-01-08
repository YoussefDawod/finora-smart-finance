/**
 * Motion-enabled card with hover lift.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useMotion } from '../../context/MotionContext';
import { resolveTransition, tweenPresets } from '../../config/framerMotionConfig';
import { useHoverAnimation } from '../../hooks/useGestureAnimation';

export const MotionCard = ({ children, transition = tweenPresets.normal, ...rest }) => {
  const hover = useHoverAnimation({ scale: 1.01, shadow: '0 12px 26px rgba(0,0,0,0.12)', transition });
  const { prefersReducedMotion, animationsEnabled } = useMotion();
  const disabled = prefersReducedMotion || !animationsEnabled;

  return (
    <motion.div
      {...hover}
      whileHover={disabled ? undefined : hover.whileHover}
      transition={resolveTransition(transition, disabled)}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

MotionCard.propTypes = {
  children: PropTypes.node,
  transition: PropTypes.object,
};

export default MotionCard;
