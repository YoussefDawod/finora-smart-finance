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

  // i18n: Derive skip text from document language
  const skipTexts = {
    de: 'Zum Hauptinhalt springen',
    en: 'Skip to main content',
    ar: '\u062a\u062e\u0637\u064a \u0625\u0644\u0649 \u0627\u0644\u0645\u062d\u062a\u0648\u0649 \u0627\u0644\u0631\u0626\u064a\u0633\u064a',
    ka: '\u10d2\u10d0\u10d3\u10d0\u10e1\u10d5\u10da\u10d0 \u10db\u10d7\u10d0\u10d5\u10d0\u10e0 \u10e8\u10d8\u10d2\u10d7\u10d0\u10d5\u10e1\u10d6\u10d4',
  };
  const lang = document.documentElement.lang || 'de';
  const skipText = skipTexts[lang] || skipTexts.en;
  skipLink.textContent = skipText;
  skipLink.setAttribute('aria-label', skipText);
  
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
 * Initialize all accessibility features
 */
export function initAccessibility() {
  const cleanupKeyboard = initKeyboardNavigation();
  const skipLink = createSkipLink();

  // Return cleanup function
  return () => {
    cleanupKeyboard();
    skipLink?.remove();
  };
}

export default initAccessibility;
