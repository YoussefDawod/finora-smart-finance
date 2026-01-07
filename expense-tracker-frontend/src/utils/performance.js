/**
 * Performance Monitoring Utilities
 * Überwacht Core Web Vitals und React Component Performance
 */

// ============================================
// CORE WEB VITALS MONITORING
// ============================================

/**
 * Initialisiert Performance Monitoring für Core Web Vitals
 * Sollte in main.jsx aufgerufen werden
 */
export const initPerformanceMonitoring = () => {
  if (!window.PerformanceObserver) {
    console.warn('PerformanceObserver not supported');
    return;
  }

  // Largest Contentful Paint (LCP)
  // Ziel: < 2.5s
  observeLCP();

  // First Input Delay (FID)
  // Ziel: < 100ms
  observeFID();

  // Cumulative Layout Shift (CLS)
  // Ziel: < 0.1
  observeCLS();

  // First Contentful Paint (FCP)
  // Ziel: < 1.8s
  observeFCP();
};

/**
 * Largest Contentful Paint - größtes Element im Viewport
 */
const observeLCP = () => {
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      const lcp = lastEntry.renderTime || lastEntry.loadTime;

      logMetric('LCP', lcp, lcp < 2500 ? 'good' : lcp < 4000 ? 'needs-improvement' : 'poor');
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (error) {
    console.warn('LCP observation failed:', error);
  }
};

/**
 * First Input Delay - Zeit bis zur ersten Interaktion
 */
const observeFID = () => {
  try {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const fid = entry.processingStart - entry.startTime;
        logMetric('FID', fid, fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor');
      });
    });

    observer.observe({ entryTypes: ['first-input'] });
  } catch (error) {
    console.warn('FID observation failed:', error);
  }
};

/**
 * Cumulative Layout Shift - Visuelle Stabilität
 */
const observeCLS = () => {
  try {
    let clsScore = 0;
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
          logMetric('CLS', clsScore, clsScore < 0.1 ? 'good' : clsScore < 0.25 ? 'needs-improvement' : 'poor');
        }
      });
    });

    observer.observe({ entryTypes: ['layout-shift'] });
  } catch (error) {
    console.warn('CLS observation failed:', error);
  }
};

/**
 * First Contentful Paint - erstes gerendertes Element
 */
const observeFCP = () => {
  try {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        logMetric('FCP', entry.startTime, entry.startTime < 1800 ? 'good' : entry.startTime < 3000 ? 'needs-improvement' : 'poor');
      });
    });

    observer.observe({ entryTypes: ['paint'] });
  } catch (error) {
    console.warn('FCP observation failed:', error);
  }
};

/**
 * Loggt Metrik mit Kategorisierung
 */
const logMetric = (name, value, rating) => {
  const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';

  console.log(`${emoji} ${name}: ${value.toFixed(2)}ms [${rating}]`);

  // In Production: an Analytics senden
  if (import.meta.env.PROD) {
    // Google Analytics, Sentry, etc.
    // gtag('event', name, { value, rating });
  }
};

// ============================================
// REACT COMPONENT PERFORMANCE
// ============================================

/**
 * Misst Render-Zeit einer Komponente
 * @param {string} componentName - Name der Komponente
 * @param {function} callback - Render-Funktion
 * @returns {*} Ergebnis der Callback-Funktion
 */
export const measureComponentRender = (componentName, callback) => {
  const start = performance.now();
  const result = callback();
  const duration = performance.now() - start;

  // Warnung bei langsamen Renders (> 16.67ms = 1 Frame bei 60fps)
  if (duration > 16.67) {
    console.warn(`⚠️ ${componentName} render took ${duration.toFixed(2)}ms (> 16.67ms)`);
  } else if (import.meta.env.DEV) {
    console.log(`✅ ${componentName} render: ${duration.toFixed(2)}ms`);
  }

  return result;
};

/**
 * Hook-freundliche Variante mit useEffect
 */
export const logRenderTime = (componentName) => {
  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;
    if (duration > 16.67) {
      console.warn(`⚠️ ${componentName} render: ${duration.toFixed(2)}ms`);
    }
  };
};

// ============================================
// RESOURCE TIMING
// ============================================

/**
 * Analysiert Ladezeiten von Ressourcen (CSS, JS, Images)
 */
export const analyzeResourceTiming = () => {
  if (!window.performance || !window.performance.getEntriesByType) return;

  const resources = performance.getEntriesByType('resource');

  const stats = {
    scripts: [],
    stylesheets: [],
    images: [],
    other: [],
  };

  resources.forEach((resource) => {
    const item = {
      name: resource.name.split('/').pop(),
      duration: resource.duration,
      size: resource.transferSize || 0,
    };

    if (resource.name.endsWith('.js')) {
      stats.scripts.push(item);
    } else if (resource.name.endsWith('.css')) {
      stats.stylesheets.push(item);
    } else if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(resource.name)) {
      stats.images.push(item);
    } else {
      stats.other.push(item);
    }
  });

  // Sortiere nach Dauer
  Object.keys(stats).forEach((key) => {
    stats[key].sort((a, b) => b.duration - a.duration);
  });

  console.group('📊 Resource Timing Analysis');
  console.table(stats.scripts.slice(0, 5));
  console.table(stats.stylesheets);
  console.table(stats.images.slice(0, 5));
  console.groupEnd();

  return stats;
};

// ============================================
// MEMORY USAGE (Chrome only)
// ============================================

/**
 * Überwacht Speicherverbrauch (nur Chrome)
 */
export const monitorMemoryUsage = () => {
  if (!performance.memory) {
    console.warn('Memory API not supported');
    return;
  }

  const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;

  const usedMB = (usedJSHeapSize / 1024 / 1024).toFixed(2);
  const totalMB = (totalJSHeapSize / 1024 / 1024).toFixed(2);
  const limitMB = (jsHeapSizeLimit / 1024 / 1024).toFixed(2);
  const percentage = ((usedJSHeapSize / jsHeapSizeLimit) * 100).toFixed(2);

  console.log(`💾 Memory: ${usedMB}MB / ${totalMB}MB (Limit: ${limitMB}MB) - ${percentage}% used`);

  return {
    usedMB: parseFloat(usedMB),
    totalMB: parseFloat(totalMB),
    limitMB: parseFloat(limitMB),
    percentage: parseFloat(percentage),
  };
};

// ============================================
// BUNDLE SIZE WARNING
// ============================================

/**
 * Warnt bei großen Bundles (> 500KB)
 */
export const checkBundleSize = () => {
  const scripts = performance.getEntriesByType('resource').filter((r) => r.name.endsWith('.js'));

  let totalSize = 0;
  scripts.forEach((script) => {
    totalSize += script.transferSize || 0;
  });

  const totalKB = (totalSize / 1024).toFixed(2);

  if (totalSize > 500 * 1024) {
    console.warn(`⚠️ Large bundle size: ${totalKB}KB (> 500KB)`);
  } else {
    console.log(`✅ Bundle size: ${totalKB}KB`);
  }

  return totalKB;
};

// ============================================
// PERFORMANCE REPORT
// ============================================

/**
 * Generiert kompletten Performance-Report
 */
export const generatePerformanceReport = () => {
  console.group('📈 Performance Report');

  console.log('🎯 Core Web Vitals - siehe oben');
  analyzeResourceTiming();
  monitorMemoryUsage();
  checkBundleSize();

  console.groupEnd();
};
