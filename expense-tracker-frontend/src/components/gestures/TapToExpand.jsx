/**
 * Tap-to-expand component for collapsible content.
 */
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { useTap, useDoubleTap } from '../../hooks/useGestureDetection';
import { useMotion } from '../../context/MotionContext';
import { hapticOnGesture, announceToScreenReader } from '../../utils/hapticFeedback';

export const TapToExpand = ({ header, children, expandOnDoubleTap = false, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { prefersReducedMotion } = useMotion();
  
  const handleToggle = useCallback(() => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (!prefersReducedMotion) hapticOnGesture('tap');
    announceToScreenReader(newState ? 'Content expanded' : 'Content collapsed');
  }, [isExpanded, prefersReducedMotion]);
  
  const tapHandlers = expandOnDoubleTap
    ? useDoubleTap({ onDoubleTap: handleToggle })
    : useTap({ onTap: handleToggle });
  
  return (
    <div className="tap-to-expand">
      <div
        className="tap-to-expand__header"
        onClick={expandOnDoubleTap ? undefined : handleToggle}
        {...tapHandlers}
        role="button"
        aria-expanded={isExpanded}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
      >
        {header}
        <motion.span
          className="tap-to-expand__icon"
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          aria-hidden="true"
        >
          ▼
        </motion.span>
      </div>
      
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            className="tap-to-expand__content"
            initial={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="tap-to-expand__inner">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

TapToExpand.propTypes = {
  header: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  expandOnDoubleTap: PropTypes.bool,
  defaultExpanded: PropTypes.bool,
};

export default TapToExpand;
