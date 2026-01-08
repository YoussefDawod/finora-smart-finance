/**
 * Motion-enabled input with focus animation.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useMotion } from '../../context/MotionContext';
import { tweenPresets, resolveTransition } from '../../config/framerMotionConfig';

export const MotionInput = ({ transition = tweenPresets.fast, ...rest }) => {
  const { prefersReducedMotion, animationsEnabled } = useMotion();
  const disabled = prefersReducedMotion || !animationsEnabled;

  const focusProps = disabled
    ? {}
    : {
        whileFocus: {
          boxShadow: '0 0 0 3px rgba(32, 128, 144, 0.25)',
          scale: 1.01,
          transition: resolveTransition(transition, disabled),
        },
      };

  return <motion.input {...focusProps} {...rest} />;
};

MotionInput.propTypes = {
  transition: PropTypes.object,
};

export default MotionInput;
