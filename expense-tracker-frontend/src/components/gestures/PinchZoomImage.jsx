/**
 * Pinch-to-zoom image component.
 */
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { usePinch } from '../../hooks/useGestureDetection';
import { useMotion } from '../../context/MotionContext';
import { hapticOnGesture } from '../../utils/hapticFeedback';

export const PinchZoomImage = ({ src, alt, minScale = 1, maxScale = 4 }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { prefersReducedMotion } = useMotion();
  
  const handlePinch = useCallback(({ scale: newScale, center }) => {
    setScale(newScale);
    setPosition({ x: center.x, y: center.y });
  }, []);
  
  const handlePinchStart = useCallback(() => {
    if (!prefersReducedMotion) hapticOnGesture('pinch');
  }, [prefersReducedMotion]);
  
  const handleDoubleTap = useCallback(() => {
    setScale((prev) => (prev > 1 ? 1 : 2));
    setPosition({ x: 0, y: 0 });
    if (!prefersReducedMotion) hapticOnGesture('doubleTap');
  }, [prefersReducedMotion]);
  
  const pinchHandlers = usePinch({
    onPinch: handlePinch,
    onPinchStart: handlePinchStart,
    minScale,
    maxScale,
  });
  
  return (
    <div className="pinch-zoom-image" {...pinchHandlers}>
      <motion.img
        src={src}
        alt={alt}
        animate={{ scale }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onDoubleClick={handleDoubleTap}
        draggable={false}
      />
    </div>
  );
};

PinchZoomImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  minScale: PropTypes.number,
  maxScale: PropTypes.number,
};

export default PinchZoomImage;
