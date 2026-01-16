/**
 * @fileoverview Keyboard Navigation Detection
 * @description Detects when user is navigating with keyboard (Tab key)
 * and adds visual focus indicators accordingly.
 * 
 * Improves accessibility by showing focus rings only when using keyboard,
 * not when clicking with mouse.
 * 
 * @module utils/keyboardNavigation
 */

/**
 * Initialize keyboard navigation detection
 * Adds 'keyboard-user' class to body when Tab is pressed
 * Removes it when mouse is used
 */
export function initKeyboardNavigation() {
  let isKeyboardUser = false;

  // Detect Tab key usage
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      if (!isKeyboardUser) {
        isKeyboardUser = true;
        document.body.classList.add('keyboard-user');
      }
    }
  };

  // Detect mouse usage
  const handleMouseDown = () => {
    if (isKeyboardUser) {
      isKeyboardUser = false;
      document.body.classList.remove('keyboard-user');
    }
  };

  // Add event listeners
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('mousedown', handleMouseDown);

  // Cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('mousedown', handleMouseDown);
  };
}

/**
 * Create and insert skip-to-content link
 * Improves accessibility for keyboard users
 */
export function createSkipLink() {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-to-content';
  skipLink.textContent = 'Zum Hauptinhalt springen';
  skipLink.setAttribute('aria-label', 'Zum Hauptinhalt springen');
  
  document.body.insertBefore(skipLink, document.body.firstChild);

  // Ensure main content has the ID
  const mainContent = document.querySelector('main');
  if (mainContent && !mainContent.id) {
    mainContent.id = 'main-content';
    mainContent.setAttribute('tabindex', '-1'); // Allow programmatic focus
  }

  return skipLink;
}

/**
 * Enhanced focus management for SPAs
 * Moves focus to main content when route changes
 */
export function manageFocusOnRouteChange() {
  const observer = new globalThis.MutationObserver(() => {
    const mainContent = globalThis.document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // Observe changes in the app container
  const appContainer = globalThis.document.getElementById('root');
  if (appContainer) {
    observer.observe(appContainer, {
      childList: true,
      subtree: true,
    });
  }

  return () => observer.disconnect();
}

/**
 * Initialize all accessibility features
 */
export function initAccessibility() {
  const cleanupKeyboard = initKeyboardNavigation();
  const skipLink = createSkipLink();
  
  // Optional: Focus management for route changes
  // const cleanupFocus = manageFocusOnRouteChange();

  // Return cleanup function
  return () => {
    cleanupKeyboard();
    skipLink?.remove();
    // cleanupFocus?.();
  };
}

export default initAccessibility;
