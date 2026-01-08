/**
 * Polished interactive components with motion and gesture support.
 * Includes smooth animations and touch feedback.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import './PolishedComponents.scss';

/**
 * Smooth page transition wrapper.
 */
export const PageTransition = ({ children, direction = 'in' }) => {
  const variants = {
    in: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
    },
    out: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
    },
  };

  return (
    <motion.div
      initial="out"
      animate={direction === 'in' ? 'in' : 'out'}
      variants={variants}
    >
      {children}
    </motion.div>
  );
};

PageTransition.propTypes = {
  children: PropTypes.node.isRequired,
  direction: PropTypes.oneOf(['in', 'out']),
};

/**
 * Smooth modal animation wrapper.
 */
export const ModalAnimation = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

ModalAnimation.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  children: PropTypes.node.isRequired,
};

/**
 * Smooth dropdown menu animation.
 */
export const DropdownAnimation = ({ isOpen, children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={isOpen ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="dropdown"
    >
      {children}
    </motion.div>
  );
};

DropdownAnimation.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
};

/**
 * Smooth toast notification animation.
 */
export const ToastAnimation = ({ isOpen, position = 'right', children }) => {
  const slideVariants = {
    right: {
      initial: { x: 400, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 400, opacity: 0 },
    },
    left: {
      initial: { x: -400, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -400, opacity: 0 },
    },
  };

  const variants = slideVariants[position] || slideVariants.right;

  return (
    <motion.div
      initial={variants.initial}
      animate={isOpen ? variants.animate : variants.exit}
      exit={variants.exit}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={`toast toast--${position}`}
    >
      {children}
    </motion.div>
  );
};

ToastAnimation.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  position: PropTypes.oneOf(['left', 'right']),
  children: PropTypes.node.isRequired,
};

export default {
  PageTransition,
  ModalAnimation,
  DropdownAnimation,
  ToastAnimation,
};
