/**
 * Long-press context menu component.
 */
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { useLongPress } from '../../hooks/useGestureDetection';
import { useMotion } from '../../context/MotionContext';
import { hapticOnGesture, announceToScreenReader } from '../../utils/hapticFeedback';

export const LongPressMenu = ({ children, menuItems, onSelect }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const { prefersReducedMotion } = useMotion();
  
  const handleLongPress = useCallback((coordinates) => {
    setMenuPosition({ x: coordinates.clientX, y: coordinates.clientY });
    setShowMenu(true);
    if (!prefersReducedMotion) hapticOnGesture('longPress');
    announceToScreenReader('Context menu opened');
  }, [prefersReducedMotion]);
  
  const handleMenuSelect = useCallback((item) => {
    setShowMenu(false);
    if (onSelect) onSelect(item);
    if (!prefersReducedMotion) hapticOnGesture('tap');
    announceToScreenReader(`${item.label} selected`);
  }, [onSelect, prefersReducedMotion]);
  
  const longPressHandlers = useLongPress({
    onLongPress: handleLongPress,
    duration: 500,
  });
  
  return (
    <>
      <div className="long-press-menu__trigger" {...longPressHandlers}>
        {children}
      </div>
      
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              className="long-press-menu__backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              className="long-press-menu__content"
              style={{ left: menuPosition.x, top: menuPosition.y }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              role="menu"
              aria-label="Context menu"
            >
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  className="long-press-menu__item"
                  onClick={() => handleMenuSelect(item)}
                  role="menuitem"
                  aria-label={item.label}
                >
                  {item.icon && <span className="long-press-menu__icon">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

LongPressMenu.propTypes = {
  children: PropTypes.node.isRequired,
  menuItems: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      action: PropTypes.func,
    })
  ).isRequired,
  onSelect: PropTypes.func,
};

export default LongPressMenu;
