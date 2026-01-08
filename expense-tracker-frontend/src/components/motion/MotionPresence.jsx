/**
 * AnimatePresence wrapper aware of motion preferences.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence } from 'framer-motion';
import { useMotion } from '../../context/MotionContext';

export const MotionPresence = ({ children, mode = 'sync', onExitComplete, initial = true }) => {
  const { prefersReducedMotion, animationsEnabled } = useMotion();
  const disabled = prefersReducedMotion || !animationsEnabled;

  return (
    <AnimatePresence
      initial={!disabled && initial}
      mode={mode}
      onExitComplete={onExitComplete}
    >
      {children}
    </AnimatePresence>
  );
};

MotionPresence.propTypes = {
  children: PropTypes.node,
  mode: PropTypes.oneOf(['sync', 'popLayout', 'wait']),
  onExitComplete: PropTypes.func,
  initial: PropTypes.bool,
};

export default MotionPresence;
