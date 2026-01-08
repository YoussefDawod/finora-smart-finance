/**
 * Skeleton preset configurations and factory functions.
 */
import React, { useMemo } from 'react';
import {
  SkeletonBox,
  SkeletonText,
  SkeletonCircle,
  SkeletonButton,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  SkeletonForm,
} from '../components/Skeleton';

/**
 * Preset configurations for common skeleton patterns.
 */
export const SKELETON_PRESETS = {
  // Expense list skeleton
  expenseList: {
    component: SkeletonList,
    props: {
      count: 5,
      hasAvatar: true,
      avatarSize: '48px',
      textLines: 2,
    },
  },

  // Expense detail skeleton
  expenseDetail: {
    component: SkeletonCard,
    props: {
      hasImage: false,
      textLines: 6,
      hasButton: true,
    },
  },

  // Category grid skeleton
  categoryGrid: {
    component: SkeletonCard,
    props: {
      variant: 'stat',
      count: 6,
    },
  },

  // Dashboard skeleton
  dashboard: {
    component: 'custom',
    render: () => (
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <SkeletonCard variant="stat" />
          <SkeletonCard variant="stat" />
          <SkeletonCard variant="stat" />
          <SkeletonCard variant="stat" />
        </div>
        
        {/* Chart */}
        <SkeletonBox width="100%" height="300px" borderRadius="12px" />
        
        {/* Recent transactions */}
        <SkeletonList count={5} hasAvatar={true} textLines={2} />
      </div>
    ),
  },

  // Form skeleton
  form: {
    component: SkeletonForm,
    props: {
      fields: 5,
      hasLabels: true,
      hasButton: true,
    },
  },

  // Table skeleton
  table: {
    component: SkeletonTable,
    props: {
      rows: 8,
      columns: 5,
      hasHeader: true,
    },
  },

  // Compact list skeleton (for mobile)
  compactList: {
    component: SkeletonList,
    props: {
      count: 3,
      hasAvatar: false,
      textLines: 1,
    },
  },

  // Transaction card skeleton
  transactionCard: {
    component: SkeletonCard,
    props: {
      variant: 'transaction',
      count: 5,
    },
  },
};

/**
 * Factory function to create skeleton components.
 * @param {string} presetName - Name of the preset
 * @param {Object} overrides - Props to override preset defaults
 * @returns {JSX.Element}
 */
export function createSkeleton(presetName, overrides = {}) {
  const preset = SKELETON_PRESETS[presetName];

  if (!preset) {
    console.warn(`Skeleton preset "${presetName}" not found`);
    return <SkeletonBox width="100%" height="100px" />;
  }

  if (preset.component === 'custom') {
    return preset.render(overrides);
  }

  const Component = preset.component;
  const props = { ...preset.props, ...overrides };

  return <Component {...props} />;
}

/**
 * Hook for memoized skeleton creation.
 * @param {string} presetName
 * @param {Object} overrides
 * @returns {JSX.Element}
 */
export function useSkeleton(presetName, overrides = {}) {
  return useMemo(
    () => createSkeleton(presetName, overrides),
    [presetName, JSON.stringify(overrides)]
  );
}

/**
 * Dynamic skeleton sizing based on viewport.
 * @param {string} presetName
 * @param {Object} options
 * @param {number} options.minHeight - Minimum height in pixels
 * @param {number} options.maxHeight - Maximum height in pixels
 * @param {number} options.mobileCount - Items on mobile
 * @param {number} options.desktopCount - Items on desktop
 * @returns {Object} Adjusted props
 */
export function getResponsiveSkeletonProps(
  presetName,
  { minHeight = 100, maxHeight = 500, mobileCount = 3, desktopCount = 5 } = {}
) {
  const preset = SKELETON_PRESETS[presetName];
  if (!preset) return {};

  const isMobile = window.innerWidth < 768;
  const viewportHeight = window.innerHeight;

  const calculatedHeight = Math.min(
    Math.max(viewportHeight * 0.6, minHeight),
    maxHeight
  );

  return {
    ...preset.props,
    count: isMobile ? mobileCount : desktopCount,
    height: `${calculatedHeight}px`,
  };
}

/**
 * Calculates optimal skeleton count based on container height.
 * @param {number} containerHeight - Container height in pixels
 * @param {number} itemHeight - Single item height in pixels (default: 80)
 * @param {number} gap - Gap between items in pixels (default: 16)
 * @returns {number}
 */
export function calculateSkeletonCount(containerHeight, itemHeight = 80, gap = 16) {
  if (!containerHeight || containerHeight <= 0) return 5;

  const count = Math.floor(containerHeight / (itemHeight + gap));
  return Math.max(1, Math.min(count, 20)); // Cap between 1-20
}

/**
 * Preset variations for different breakpoints.
 */
export const RESPONSIVE_PRESETS = {
  expenseList: {
    mobile: { count: 3, hasAvatar: false, textLines: 1 },
    tablet: { count: 5, hasAvatar: true, textLines: 2 },
    desktop: { count: 8, hasAvatar: true, textLines: 2 },
  },
  categoryGrid: {
    mobile: { count: 2 },
    tablet: { count: 4 },
    desktop: { count: 6 },
  },
  dashboard: {
    mobile: { statsCount: 2, listCount: 3 },
    tablet: { statsCount: 3, listCount: 5 },
    desktop: { statsCount: 4, listCount: 8 },
  },
};

/**
 * Gets responsive preset based on current breakpoint.
 * @param {string} presetName
 * @returns {Object}
 */
export function getResponsivePreset(presetName) {
  const width = window.innerWidth;
  const responsive = RESPONSIVE_PRESETS[presetName];

  if (!responsive) {
    return SKELETON_PRESETS[presetName]?.props || {};
  }

  if (width < 768) return responsive.mobile;
  if (width < 1024) return responsive.tablet;
  return responsive.desktop;
}

/**
 * Memoized skeleton presets cache.
 */
const skeletonCache = new Map();

/**
 * Gets or creates memoized skeleton.
 * @param {string} presetName
 * @param {Object} props
 * @returns {JSX.Element}
 */
export function getMemoizedSkeleton(presetName, props = {}) {
  const cacheKey = `${presetName}_${JSON.stringify(props)}`;

  if (skeletonCache.has(cacheKey)) {
    return skeletonCache.get(cacheKey);
  }

  const skeleton = createSkeleton(presetName, props);
  skeletonCache.set(cacheKey, skeleton);

  return skeleton;
}

/**
 * Clears skeleton cache.
 */
export function clearSkeletonCache() {
  skeletonCache.clear();
}

/**
 * Generates skeleton configuration based on data structure.
 * @param {Object} dataStructure - Sample data object
 * @returns {Object} Skeleton configuration
 */
export function generateSkeletonConfig(dataStructure) {
  if (!dataStructure) {
    return { component: SkeletonBox, props: { width: '100%', height: '100px' } };
  }

  if (Array.isArray(dataStructure)) {
    return {
      component: SkeletonList,
      props: { count: dataStructure.length || 5 },
    };
  }

  if (typeof dataStructure === 'object') {
    const fields = Object.keys(dataStructure).length;
    return {
      component: SkeletonForm,
      props: { fields: Math.min(fields, 8) },
    };
  }

  return { component: SkeletonBox, props: { width: '100%', height: '20px' } };
}

export default {
  SKELETON_PRESETS,
  createSkeleton,
  useSkeleton,
  getResponsiveSkeletonProps,
  calculateSkeletonCount,
  getResponsivePreset,
  getMemoizedSkeleton,
  clearSkeletonCache,
  generateSkeletonConfig,
};
