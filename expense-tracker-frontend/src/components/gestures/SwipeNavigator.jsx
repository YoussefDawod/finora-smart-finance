/**
 * Swipe navigator component for mobile-friendly navigation.
 */
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipe } from '../../hooks/useGestureDetection';
import { useMotion } from '../../context/MotionContext';
import { hapticOnGesture, announceToScreenReader } from '../../utils/hapticFeedback';

export const SwipeNavigator = ({ items, renderItem, onNavigate, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const { prefersReducedMotion } = useMotion();
  
  const handleSwipeLeft = useCallback(() => {
    const nextIndex = Math.min(currentIndex + 1, items.length - 1);
    if (nextIndex !== currentIndex) {
      setCurrentIndex(nextIndex);
      if (!prefersReducedMotion) hapticOnGesture('swipe');
      announceToScreenReader(`Navigated to item ${nextIndex + 1} of ${items.length}`);
      if (onNavigate) onNavigate(nextIndex, 'next');
    }
  }, [currentIndex, items.length, onNavigate, prefersReducedMotion]);
  
  const handleSwipeRight = useCallback(() => {
    const prevIndex = Math.max(currentIndex - 1, 0);
    if (prevIndex !== currentIndex) {
      setCurrentIndex(prevIndex);
      if (!prefersReducedMotion) hapticOnGesture('swipe');
      announceToScreenReader(`Navigated to item ${prevIndex + 1} of ${items.length}`);
      if (onNavigate) onNavigate(prevIndex, 'prev');
    }
  }, [currentIndex, onNavigate, prefersReducedMotion]);
  
  const swipeHandlers = useSwipe({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    minDistance: 50,
  });
  
  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };
  
  return (
    <div className="swipe-navigator" {...swipeHandlers}>
      <AnimatePresence initial={false} custom={1} mode="wait">
        <motion.div
          key={currentIndex}
          custom={1}
          variants={prefersReducedMotion ? undefined : variants}
          initial={prefersReducedMotion ? undefined : 'enter'}
          animate="center"
          exit={prefersReducedMotion ? undefined : 'exit'}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="swipe-navigator__content"
        >
          {renderItem(items[currentIndex], currentIndex)}
        </motion.div>
      </AnimatePresence>
      
      <div className="swipe-navigator__indicators">
        {items.map((_, index) => (
          <button
            key={index}
            className={`swipe-navigator__dot ${index === currentIndex ? 'swipe-navigator__dot--active' : ''}`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to item ${index + 1}`}
            aria-current={index === currentIndex ? 'true' : 'false'}
          />
        ))}
      </div>
    </div>
  );
};

SwipeNavigator.propTypes = {
  items: PropTypes.array.isRequired,
  renderItem: PropTypes.func.isRequired,
  onNavigate: PropTypes.func,
  initialIndex: PropTypes.number,
};

export default SwipeNavigator;
