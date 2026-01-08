/**
 * Animation orchestration helpers for staggering and sequencing.
 */

/**
 * Computes a staggered delay based on index.
 * @param {number} index - Zero-based index in a list.
 * @param {number} delayMs - Base delay in milliseconds.
 * @returns {string} CSS-ready delay string (e.g., "120ms").
 */
export const createStaggerDelay = (index = 0, delayMs = 40) => `${index * delayMs}ms`;

/**
 * Creates a sequence timeline by chaining animations with delays.
 * @param {Array<{ name: string, delay?: number, duration?: number }>} animations
 * @returns {Array<{ name: string, offset: number, duration: number }>} resolved timeline
 */
export const createSequence = (animations = []) => {
  const timeline = [];
  let offset = 0;

  animations.forEach(({ name, delay = 0, duration = 0 }) => {
    const entry = { name, offset, duration };
    timeline.push(entry);
    offset += delay + duration;
  });

  return timeline;
};

/**
 * Calculates the total duration for a multi-step animation.
 * @param {number} steps - Number of items/steps.
 * @param {number} delayPerStep - Delay per step in milliseconds.
 * @param {number} baseDuration - Duration of the base animation in milliseconds.
 * @returns {number} total duration in milliseconds.
 */
export const calculateDuration = (steps = 1, delayPerStep = 40, baseDuration = 220) => {
  if (steps <= 0) return 0;
  return baseDuration + (steps - 1) * delayPerStep;
};

/**
 * Returns a reversed animation name (for exit variants) using a simple suffix convention.
 * If the animation already ends with '-out' it will swap to '-in' and vice versa.
 * @param {string} animationName
 * @returns {string}
 */
export const reverseAnimation = (animationName = '') => {
  if (animationName.endsWith('-in')) return `${animationName.slice(0, -3)}-out`;
  if (animationName.endsWith('-out')) return `${animationName.slice(0, -4)}-in`;
  return `${animationName}-out`;
};

/**
 * Generates inline CSS variables for staggered children in React map loops.
 * @param {number} index - Zero-based index.
 * @param {number} delayMs - Delay per item in milliseconds.
 * @returns {{ style: { '--index': number, '--delay': string } }}
 */
export const withStaggerVariables = (index = 0, delayMs = 40) => ({
  style: {
    '--index': index,
    '--delay': `${delayMs}ms`,
  },
});

/**
 * Utility to map a list to props including stagger variables.
 * @param {Array<any>} items
 * @param {(item: any, index: number) => any} render
 * @param {number} delayMs
 * @returns {Array<any>} rendered list with injected style props
 */
export const mapWithStagger = (items = [], render, delayMs = 40) =>
  items.map((item, index) => render(item, index, withStaggerVariables(index, delayMs)));
