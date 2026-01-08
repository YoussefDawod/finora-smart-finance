/**
 * Ripple effect utility for buttons and interactive elements.
 * Creates a CSS ripple animation on click at the click point.
 */

/**
 * Adds ripple effect to an element on click.
 * @param {HTMLElement} element - Element to add ripple to
 * @param {string} color - Ripple color (default: currentColor)
 */
export function addRippleEffect(element, color = 'currentColor') {
  if (!element) return;

  element.addEventListener('click', (event) => {
    // Skip if reduced motion is enabled
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.style.color = color;

    element.appendChild(ripple);

    // Remove ripple after animation completes
    setTimeout(() => ripple.remove(), 600);
  });
}

/**
 * Setup ripple effect for multiple elements.
 * @param {string} selector - CSS selector for elements
 * @param {string} color - Ripple color
 */
export function setupRippleEffects(selector = '.btn', color = 'currentColor') {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => addRippleEffect(el, color));
}

export default { addRippleEffect, setupRippleEffects };
