/**
 * Animation performance helper utilities.
 * Focuses on transform/opacity-only animations to stay on the compositor thread.
 */

const GPU_ACCELERATED_PROPERTIES = new Set(['opacity', 'transform']);
const LAYOUT_THROTTLING_PROPERTIES = ['width', 'height', 'top', 'left', 'right', 'bottom', 'margin', 'padding', 'border', 'background'];

/**
 * Checks if provided properties are GPU-safe.
 * @param {string[]} properties
 * @returns {{ unsafe: string[], safe: string[] }}
 */
export const validateAnimationProperties = (properties = []) => {
  const normalized = properties.map((prop) => prop.toLowerCase());
  const safe = normalized.filter((prop) => GPU_ACCELERATED_PROPERTIES.has(prop));
  const unsafe = normalized.filter((prop) => !GPU_ACCELERATED_PROPERTIES.has(prop));
  return { safe, unsafe };
};

/**
 * Audits running animations in the document and logs warnings for non-GPU properties.
 * Requires a browser environment with the Web Animations API.
 * @returns {Array<{ name: string, duration: number | null, properties: string[], nonGpuProperties: string[] }>}
 */
export const auditActiveAnimations = () => {
  if (typeof document === 'undefined' || typeof document.getAnimations !== 'function') {
    console.warn('Animation audit skipped: document.getAnimations() not available');
    return [];
  }

  const animations = document.getAnimations();
  const report = animations.map((animation) => {
    const effect = animation.effect;
    const keyframes = effect?.getKeyframes?.() || [];
    const properties = new Set();

    keyframes.forEach((frame) => {
      Object.keys(frame)
        .filter((key) => key !== 'offset' && key !== 'composite')
        .forEach((key) => properties.add(key));
    });

    const nonGpuProperties = [...properties].filter((prop) => !GPU_ACCELERATED_PROPERTIES.has(prop));

    if (nonGpuProperties.length > 0) {
      console.warn(`⚠️ Non-GPU-safe properties found in animation`, {
        name: getAnimationName(animation),
        nonGpuProperties,
      });
    }

    return {
      name: getAnimationName(animation),
      duration: effect?.getTiming?.().duration ?? null,
      properties: [...properties],
      nonGpuProperties,
    };
  });

  if (report.length) {
    console.group('🎥 Animation Audit');
    console.table(report.map(({ name, duration, nonGpuProperties }) => ({ name, duration, nonGpuProperties })));
    console.groupEnd();
  }

  return report;
};

/**
 * Dev-oriented checklist for profiling and optimizing animations.
 * @returns {string[]}
 */
export const getPerformanceTips = () => [
  'Prefer transform and opacity animations to stay on the compositor thread.',
  'Avoid animating layout-affecting properties (width, height, top, left, margins).',
  'Use Chrome DevTools Performance panel: enable Screenshots and check FPS for 60fps budget.',
  'Limit simultaneous animations; stagger list items with small delays.',
  'Reduce animation duration or disable when prefers-reduced-motion is enabled.',
];

/**
 * Logs actionable tips and integrates with DevTools via console grouping.
 */
export const logPerformanceTips = () => {
  console.group('⚡ Animation Performance Tips');
  getPerformanceTips().forEach((tip, index) => {
    console.log(`${index + 1}. ${tip}`);
  });
  console.groupEnd();
};

/**
 * Helper to warn when potentially layout-thrashing properties are present.
 * @param {string[]} properties
 */
export const warnOnLayoutThrash = (properties = []) => {
  const offenders = properties.filter((prop) => LAYOUT_THROTTLING_PROPERTIES.includes(prop.toLowerCase()));
  if (offenders.length) {
    console.warn('⚠️ Layout-affecting properties found in animation:', offenders);
  }
};

/**
 * Creates a simple diagnostic snapshot for a planned animation definition.
 * @param {{ name: string, properties: string[] }} config
 * @returns {{ name: string, safe: string[], unsafe: string[] }}
 */
export const auditPlannedAnimation = ({ name, properties = [] }) => {
  const { safe, unsafe } = validateAnimationProperties(properties);
  warnOnLayoutThrash(properties);
  return { name, safe, unsafe };
};

const getAnimationName = (animation) => {
  const effect = animation.effect;
  const target = effect?.target;
  if (target?.id) return target.id;
  if (target?.classList?.length) return target.classList.value;
  return effect?.getKeyframes?.()?.[0]?.composite || 'anonymous-animation';
};
