/**
 * Swipe-to-delete component with undo capability.
 */
import React, { useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useSwipe } from '../../hooks/useGestureDetection';
import { useMotion } from '../../context/MotionContext';
import { hapticOnAction, announceToScreenReader } from '../../utils/hapticFeedback';

export const SwipeToDelete = ({ children, onDelete, deleteThreshold = 120, undoDuration = 3000 }) => {
  const [offset, setOffset] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const { prefersReducedMotion } = useMotion();
  const undoTimerRef = useRef(null);
  
  const handleSwipe = useCallback((result) => {
    if (result.direction === 'left' && Math.abs(result.distance) > deleteThreshold) {
      setIsDeleting(true);
      setShowUndo(true);
      if (!prefersReducedMotion) hapticOnAction('warning');
      announceToScreenReader('Item marked for deletion. Tap undo to restore.');
      
      undoTimerRef.current = setTimeout(() => {
        if (onDelete) onDelete();
        setShowUndo(false);
        if (!prefersReducedMotion) hapticOnAction('success');
        announceToScreenReader('Item deleted');
      }, undoDuration);
    }
  }, [deleteThreshold, onDelete, undoDuration, prefersReducedMotion]);
  
  const handleUndo = useCallback(() => {
    clearTimeout(undoTimerRef.current);
    setIsDeleting(false);
    setShowUndo(false);
    setOffset(0);
    if (!prefersReducedMotion) hapticOnAction('success');
    announceToScreenReader('Deletion cancelled');
  }, [prefersReducedMotion]);
  
  const swipeHandlers = useSwipe({
    onSwipe: handleSwipe,
    minDistance: 50,
  });
  
  return (
    <div className="swipe-to-delete" {...swipeHandlers}>
      <motion.div
        className={`swipe-to-delete__content ${isDeleting ? 'swipe-to-delete__content--deleting' : ''}`}
        animate={{ x: isDeleting ? -300 : 0, opacity: isDeleting ? 0.5 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
      
      {showUndo && (
        <motion.div
          className="swipe-to-delete__undo"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <button onClick={handleUndo} className="btn btn--secondary btn--sm">
            Undo
          </button>
        </motion.div>
      )}
      
      <div className="swipe-to-delete__background" aria-hidden="true">
        Delete
      </div>
    </div>
  );
};

SwipeToDelete.propTypes = {
  children: PropTypes.node.isRequired,
  onDelete: PropTypes.func.isRequired,
  deleteThreshold: PropTypes.number,
  undoDuration: PropTypes.number,
};

export default SwipeToDelete;
