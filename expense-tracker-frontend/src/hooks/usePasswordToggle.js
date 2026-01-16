/**
 * @fileoverview usePasswordToggle Custom Hook
 * @description Manages show/hide password state for input fields
 * 
 * USAGE:
 * const { isVisible, toggleVisibility } = usePasswordToggle()
 * 
 * @module usePasswordToggle
 */

import { useState, useCallback } from 'react';

/**
 * Hook for managing password visibility toggle
 * @returns {Object} Password visibility state and toggle
 * @returns {boolean} isVisible - Password is visible
 * @returns {Function} toggle - Toggle visibility
 * @returns {string} type - Input type: 'password' or 'text'
 * 
 * @example
 * const { isVisible, toggleVisibility, type } = usePasswordToggle();
 * 
 * return (
 *   <div>
 *     <input type={type} placeholder="Password" />
 *     <button onClick={toggleVisibility}>
 *       {isVisible ? '👁️ Hide' : '👁️ Show'}
 *     </button>
 *   </div>
 * )
 */
export function usePasswordToggle() {
  const [isVisible, setIsVisible] = useState(false);

  /**
   * Toggle password visibility
   */
  const toggle = useCallback(() => {
    setIsVisible((prev) => !prev);
  }, []);

  return {
    isVisible,
    toggle,
    type: isVisible ? 'text' : 'password',
  };
}

export default usePasswordToggle;
