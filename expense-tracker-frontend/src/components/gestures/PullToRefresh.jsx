/**
 * Pull-to-refresh component for mobile data refresh.
 */
import React, { useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useMotion } from '../../context/MotionContext';
import { hapticOnAction, announceToScreenReader } from '../../utils/hapticFeedback';
import { getEventCoordinates } from '../../utils/touchDetection';

export const PullToRefresh = ({ children, onRefresh, threshold = 80 }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { prefersReducedMotion } = useMotion();
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  
  const handleTouchStart = useCallback((event) => {
    if (window.scrollY === 0) {
      const coords = getEventCoordinates(event);
      startYRef.current = coords.clientY;
      isPullingRef.current = true;
    }
  }, []);
  
  const handleTouchMove = useCallback((event) => {
    if (!isPullingRef.current || isRefreshing) return;
    
    const coords = getEventCoordinates(event);
    const distance = coords.clientY - startYRef.current;
    
    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance, threshold * 1.5));
      event.preventDefault();
    }
  }, [threshold, isRefreshing]);
  
  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current) return;
    
    isPullingRef.current = false;
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      if (!prefersReducedMotion) hapticOnAction('success');
      announceToScreenReader('Refreshing content');
      
      try {
        if (onRefresh) await onRefresh();
        announceToScreenReader('Content refreshed');
      } catch (error) {
        if (!prefersReducedMotion) hapticOnAction('error');
        announceToScreenReader('Refresh failed');
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
  }, [pullDistance, threshold, onRefresh, prefersReducedMotion]);
  
  const progress = Math.min((pullDistance / threshold) * 100, 100);
  
  return (
    <div className="pull-to-refresh" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <motion.div
        className="pull-to-refresh__indicator"
        animate={{ y: pullDistance > 0 ? pullDistance : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        aria-live="polite"
        aria-busy={isRefreshing}
      >
        <div className="pull-to-refresh__spinner" style={{ opacity: progress / 100 }}>
          {isRefreshing ? (
            <div className="spinner" aria-label="Refreshing" />
          ) : (
            <div className="pull-to-refresh__arrow" style={{ transform: `rotate(${progress * 1.8}deg)` }}>
              ↓
            </div>
          )}
        </div>
      </motion.div>
      
      <div className="pull-to-refresh__content">{children}</div>
    </div>
  );
};

PullToRefresh.propTypes = {
  children: PropTypes.node.isRequired,
  onRefresh: PropTypes.func.isRequired,
  threshold: PropTypes.number,
};

export default PullToRefresh;
