// src/hooks/useKeyboardNavigation.js
import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook für Keyboard Navigation & Focus Management
 * Features:
 *   - Escape Key Handler
 *   - Enter Key Handler
 *   - Tab Trapping (für Modals)
 *   - Arrow Key Navigation
 *   - Focus Restoration
 */
function useKeyboardNavigation(containerRef, options = {}) {
  const {
    onEscape,
    onEnter,
    trapFocus = false,
    restoreFocus = false,
    autoFocus = true,
    onArrowUp,
    onArrowDown,
  } = options;

  const previousActiveElement = useRef(null);

  // Focus Management
  useEffect(() => {
    if (restoreFocus) {
      previousActiveElement.current = document.activeElement;

      return () => {
        if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [restoreFocus]);

  // Auto Focus
  useEffect(() => {
    if (autoFocus && containerRef.current) {
      const firstFocusable = containerRef.current.querySelector(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (firstFocusable) {
        setTimeout(() => firstFocusable.focus(), 100);
      } else {
        // Focus container selbst wenn kein fokusierbares Element
        containerRef.current.focus();
      }
    }
  }, [autoFocus, containerRef]);

  // Keyboard Event Handler
  const handleKeyDown = useCallback(
    (e) => {
      // Escape Key
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
      }

      // Enter Key
      if (e.key === 'Enter' && onEnter) {
        const target = e.target;
        // Nicht bei Textarea oder Submit-Buttons
        if (target.tagName !== 'TEXTAREA' && target.type !== 'submit') {
          e.preventDefault();
          onEnter();
        }
      }

      // Arrow Up
      if (e.key === 'ArrowUp' && onArrowUp) {
        e.preventDefault();
        onArrowUp();
      }

      // Arrow Down
      if (e.key === 'ArrowDown' && onArrowDown) {
        e.preventDefault();
        onArrowDown();
      }

      // Tab Trapping (für Modals)
      if (trapFocus && e.key === 'Tab' && containerRef.current) {
        const focusableElements = containerRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements.length) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab (rückwärts)
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab (vorwärts)
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [onEscape, onEnter, onArrowUp, onArrowDown, trapFocus, containerRef]
  );

  // Event Listener
  useEffect(() => {
    const container = containerRef.current;

    if (container) {
      container.addEventListener('keydown', handleKeyDown);

      return () => {
        container.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [containerRef, handleKeyDown]);

  // Nicht während Render zugreifen - nur in Effects/Event Handlers nutzen
  return {};
}

export default useKeyboardNavigation;
