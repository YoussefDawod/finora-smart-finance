# Loading States & Skeleton Screens Documentation

## Übersicht

Das Loading States & Skeleton System bietet:
- ✅ 8 Reusable Skeleton Components
- ✅ Shimmer, Pulse & Glow Animations
- ✅ Progressive Loading mit Staggered Reveal
- ✅ Smart Loading State Management (200ms-3s skeleton window)
- ✅ Skeleton Presets & Factory Pattern
- ✅ Responsive Sizing & Memoization
- ✅ Accessibility & Motion Preferences

## Skeleton Components

### SkeletonBox

Generic skeleton für beliebige Größen:

```javascript
import { SkeletonBox } from './components/Skeleton';

<SkeletonBox 
  width="100%" 
  height="200px" 
  borderRadius="12px"
  shimmer={true}
  pulse={false}
/>
```

### SkeletonText

Text paragraph skeleton mit mehreren Zeilen:

```javascript
import { SkeletonText } from './components/Skeleton';

<SkeletonText 
  lines={3} 
  lineHeight="16px"
  lastLineWidth={60}
  shimmer={true}
/>
```

### SkeletonCircle

Kreisförmiges Skeleton für Avatare/Icons:

```javascript
import { SkeletonCircle } from './components/Skeleton';

<SkeletonCircle 
  size="48px"
  shimmer={true}
/>
```

### SkeletonButton

Button skeleton:

```javascript
import { SkeletonButton } from './components/Skeleton';

<SkeletonButton 
  width="120px" 
  height="40px"
  borderRadius="8px"
/>
```

### SkeletonCard

Card skeleton mit Image + Text:

```javascript
import { SkeletonCard } from './components/Skeleton';

// Standard card
<SkeletonCard 
  hasImage={true}
  imageHeight="200px"
  textLines={3}
  hasButton={true}
/>

// Transaction variant
<SkeletonCard variant="transaction" count={5} />

// Stat variant
<SkeletonCard variant="stat" />
```

### SkeletonTable

Table skeleton mit Rows & Columns:

```javascript
import { SkeletonTable } from './components/Skeleton';

<SkeletonTable 
  rows={8} 
  columns={5}
  hasHeader={true}
/>
```

### SkeletonList

List skeleton mit Avatar + Text:

```javascript
import { SkeletonList } from './components/Skeleton';

<SkeletonList 
  count={5}
  hasAvatar={true}
  avatarSize="40px"
  textLines={2}
/>
```

### SkeletonForm

Form fields skeleton:

```javascript
import { SkeletonForm } from './components/Skeleton';

<SkeletonForm 
  fields={4}
  hasLabels={true}
  hasButton={true}
/>
```

## Loading State Management

### useLoadingState Hook

Automatisches State Management mit Skeleton-Support:

```javascript
import { useLoadingState } from './hooks/useLoadingState';

function ExpenseList() {
  const {
    state,
    data,
    error,
    isLoading,
    isSkeleton,
    isError,
    fetch,
    retry,
  } = useLoadingState({
    key: 'expenses-list',
    fetchFn: async () => {
      const response = await fetch('/api/expenses');
      return response.json();
    },
    autoFetch: true,
    skeletonDelay: 200, // Show skeleton after 200ms
    skeletonThreshold: 3000, // Error after 3s
  });

  if (isSkeleton) return <SkeletonList count={5} />;
  if (isError) return <ErrorFallback error={error} onRetry={retry} />;
  if (!data) return null;

  return <ExpenseList expenses={data} />;
}
```

### Loading State Manager

Zentrale State-Verwaltung:

```javascript
import { loadingStateManager, LOADING_STATES } from './utils/loadingStateManager';

// Set state
loadingStateManager.setState('my-key', LOADING_STATES.LOADING);

// Get state
const state = loadingStateManager.getState('my-key');

// Subscribe to changes
const unsubscribe = loadingStateManager.subscribe('my-key', (newState) => {
  console.log('State changed:', newState);
});

// Clear state
loadingStateManager.clearState('my-key');
```

### Loading States

```javascript
export const LOADING_STATES = {
  IDLE: 'idle',           // Not loaded
  LOADING: 'loading',     // Currently loading
  SUCCESS: 'success',     // Data loaded
  ERROR: 'error',         // Error occurred
  SKELETON: 'skeleton',   // Show skeleton (after delay)
};
```

## Progressive Loading

### LoadingContainer

Container mit automatischen State-Transitions:

```javascript
import { LoadingContainer } from './components/Loading';
import { SkeletonList } from './components/Skeleton';

<LoadingContainer
  state={loadingState}
  skeleton={<SkeletonList count={5} />}
  error={<ErrorFallback error={error} onRetry={retry} />}
  onRetry={retry}
>
  <ExpenseList expenses={data} />
</LoadingContainer>
```

### ProgressiveLoad

Sequential/Parallel Section Loading:

```javascript
import { ProgressiveLoad } from './components/Loading';

const sections = [
  {
    key: 'stats',
    priority: 1,
    skeleton: <SkeletonCard variant="stat" count={4} />,
    component: ({ data }) => <StatsCards stats={data} />,
    fetchFn: async () => fetchStats(),
  },
  {
    key: 'chart',
    priority: 2,
    skeleton: <SkeletonBox width="100%" height="300px" />,
    component: ({ data }) => <Chart data={data} />,
    fetchFn: async () => fetchChartData(),
  },
  {
    key: 'expenses',
    priority: 3,
    skeleton: <SkeletonList count={8} />,
    component: ({ data }) => <ExpenseList expenses={data} />,
    fetchFn: async () => fetchExpenses(),
  },
];

<ProgressiveLoad 
  sections={sections}
  loadInParallel={false}
  staggerDelay={100}
/>
```

### LoadingFallback & ErrorFallback

Generic Fallback Components:

```javascript
import { LoadingFallback, ErrorFallback } from './components/Loading';

// Loading fallback
<LoadingFallback variant="card" count={5} />
<LoadingFallback variant="list" count={3} />
<LoadingFallback variant="table" count={8} />
<LoadingFallback variant="form" count={4} />

// Error fallback
<ErrorFallback 
  error={error}
  onRetry={retry}
  showSupportLink={true}
  supportUrl="/support"
/>
```

## Skeleton Presets

### Vordefinierte Presets

```javascript
import { createSkeleton, useSkeleton } from './config/skeletonPresets';

// Factory pattern
const skeleton = createSkeleton('expenseList', { count: 8 });

// Hook pattern (memoized)
const skeleton = useSkeleton('dashboard');

// Available presets:
// - expenseList
// - expenseDetail
// - categoryGrid
// - dashboard
// - form
// - table
// - compactList
// - transactionCard
```

### Responsive Skeletons

```javascript
import { 
  getResponsivePreset,
  getResponsiveSkeletonProps,
  calculateSkeletonCount,
} from './config/skeletonPresets';

// Get responsive preset for current breakpoint
const props = getResponsivePreset('expenseList');
// Mobile: { count: 3, hasAvatar: false }
// Tablet: { count: 5, hasAvatar: true }
// Desktop: { count: 8, hasAvatar: true }

// Calculate count based on container height
const containerHeight = 600;
const count = calculateSkeletonCount(containerHeight, 80, 16);
// Returns: 7 (600px / (80px + 16px gap))

// Get responsive props with viewport-based height
const props = getResponsiveSkeletonProps('expenseList', {
  minHeight: 100,
  maxHeight: 500,
  mobileCount: 3,
  desktopCount: 8,
});
```

### Memoized Skeletons

```javascript
import { 
  getMemoizedSkeleton,
  clearSkeletonCache,
} from './config/skeletonPresets';

// Cache identical skeletons
const skeleton1 = getMemoizedSkeleton('expenseList', { count: 5 });
const skeleton2 = getMemoizedSkeleton('expenseList', { count: 5 });
// skeleton1 === skeleton2 (same reference)

// Clear cache when needed
clearSkeletonCache();
```

### Dynamic Skeleton Generation

```javascript
import { generateSkeletonConfig } from './config/skeletonPresets';

// Auto-generate from data structure
const dataStructure = {
  name: '',
  email: '',
  age: 0,
  address: '',
};

const config = generateSkeletonConfig(dataStructure);
// Returns: { component: SkeletonForm, props: { fields: 4 } }

// Array detection
const arrayData = [{}, {}, {}];
const config = generateSkeletonConfig(arrayData);
// Returns: { component: SkeletonList, props: { count: 3 } }
```

## Animations

### Shimmer Animation

Wave effect (1.5s):

```css
@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
```

### Pulse Animation

Opacity pulse (1.5s):

```css
@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

### Glow Animation

Subtle glow for important sections (2s):

```css
@keyframes skeleton-glow {
  0%, 100% {
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
  }
}
```

### Animation Control

```javascript
// Shimmer (default)
<SkeletonBox shimmer={true} />

// Pulse
<SkeletonBox pulse={true} />

// Glow
<SkeletonBox className="skeleton--glow" />

// Motion preferences respected automatically
// If prefers-reduced-motion: static skeleton (no animation)
```

## Best Practices

### 1. Skeleton Timing

```javascript
// ✅ Don't show skeleton for fast loads (< 200ms)
const { isSkeleton } = useLoadingState({
  skeletonDelay: 200, // Wait 200ms before showing skeleton
});

// ✅ Show skeleton for 200ms - 3s loads
// ✅ After 3s, show error state
```

### 2. Progressive Loading Order

```javascript
// ✅ Load critical data first
const sections = [
  { key: 'expenses', priority: 1 },    // Critical
  { key: 'categories', priority: 2 },  // Secondary
  { key: 'stats', priority: 3 },       // Nice-to-have
];

// ✅ Load secondary data in parallel
<ProgressiveLoad sections={sections} loadInParallel={true} />
```

### 3. Prevent Skeleton Flashing

```javascript
// ✅ Use skeletonDelay to prevent flashing
useLoadingState({
  skeletonDelay: 200, // Only show if > 200ms
});

// ❌ Don't show skeleton immediately
useLoadingState({
  skeletonDelay: 0, // Causes flashing for fast loads
});
```

### 4. Responsive Skeletons

```javascript
// ✅ Adjust count for mobile
const props = getResponsivePreset('expenseList');
// Mobile: 3 items, Desktop: 8 items

// ✅ Calculate based on viewport
const count = calculateSkeletonCount(containerHeight);
```

### 5. Memoization

```javascript
// ✅ Use useSkeleton for memoization
const skeleton = useSkeleton('expenseList', { count: 5 });

// ✅ Use getMemoizedSkeleton for factory pattern
const skeleton = getMemoizedSkeleton('expenseList', { count: 5 });

// ❌ Don't recreate on every render
const skeleton = createSkeleton('expenseList', { count: 5 }); // Not memoized
```

## Performance

### GPU Acceleration

```css
/* ✅ Only animate transform & opacity */
.skeleton--shimmer {
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  will-change: background-position;
}

/* ✅ Cleanup will-change after animation */
.skeleton--loaded {
  will-change: auto;
}
```

### Reduced Motion

```css
/* ✅ Static skeleton when motion disabled */
@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none !important;
    opacity: 0.7;
  }
}
```

### Memoization

```javascript
// ✅ Cache identical skeletons
const skeleton = getMemoizedSkeleton('expenseList', { count: 5 });

// ✅ Clear cache when needed
clearSkeletonCache();
```

## Accessibility

```javascript
// ✅ All skeletons have proper ARIA
<SkeletonBox 
  role="status"
  aria-label="Loading..."
  aria-busy="true"
/>

// ✅ Motion preferences respected
const { prefersReducedMotion } = useMotion();
const shimmer = !prefersReducedMotion;

// ✅ Screen reader announcements
<div role="status" aria-live="polite">
  Loading expenses...
</div>
```

## Troubleshooting

### Skeleton Not Showing

```javascript
// ✅ Check skeletonDelay
useLoadingState({
  skeletonDelay: 200, // Must wait 200ms
});

// ✅ Check state
const { isSkeleton } = useLoadingState(...);
console.log(isSkeleton); // Should be true
```

### Skeleton Flashing

```javascript
// ✅ Increase skeletonDelay
useLoadingState({
  skeletonDelay: 300, // Wait longer
});

// ✅ Check if load is too fast
const duration = Date.now() - startTime;
if (duration < 200) {
  // Don't show skeleton
}
```

### Animations Not Working

```javascript
// ✅ Import skeleton-animations.css
import '../styles/skeleton-animations.css';

// ✅ Check motion preferences
const { prefersReducedMotion } = useMotion();
// Animations disabled if true

// ✅ Check animation class
<SkeletonBox shimmer={true} /> // Should have 'skeleton--shimmer' class
```

### Preset Not Found

```javascript
// ✅ Check preset name
createSkeleton('expenseList'); // ✅ Correct
createSkeleton('expense-list'); // ❌ Wrong

// ✅ Check SKELETON_PRESETS
import { SKELETON_PRESETS } from './config/skeletonPresets';
console.log(Object.keys(SKELETON_PRESETS));
```
