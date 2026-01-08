/**
 * Motion modal wrapper with backdrop and content animations.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, motion } from 'framer-motion';
import { useMotion } from '../../context/MotionContext';
import { tweenPresets, resolveTransition } from '../../config/framerMotionConfig';

const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const contentVariants = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 8 },
};

export const MotionModal = ({ isOpen, onClose, children, backdropProps = {}, contentProps = {}, onExitComplete }) => {
  const { prefersReducedMotion, animationsEnabled } = useMotion();
  const disabled = prefersReducedMotion || !animationsEnabled;
  const transition = resolveTransition(tweenPresets.normal, disabled);

  return (
    <AnimatePresence onExitComplete={onExitComplete} mode="wait">
      {isOpen ? (
        <motion.div
          className="modal-backdrop"
          variants={disabled ? undefined : backdropVariants}
          initial={disabled ? false : 'initial'}
          animate={disabled ? undefined : 'animate'}
          exit={disabled ? undefined : 'exit'}
          transition={transition}
          onClick={onClose}
          {...backdropProps}
        >
          <motion.div
            className="modal-content"
            variants={disabled ? undefined : contentVariants}
            initial={disabled ? false : 'initial'}
            animate={disabled ? undefined : 'animate'}
            exit={disabled ? undefined : 'exit'}
            transition={transition}
            onClick={(e) => e.stopPropagation()}
            {...contentProps}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

MotionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  onExitComplete: PropTypes.func,
  children: PropTypes.node,
  backdropProps: PropTypes.object,
  contentProps: PropTypes.object,
};

export default MotionModal;
