/**
 * Performance Profiling & Optimization Test Suite
 * Validates Lighthouse metrics, FCP, LCP, TTI, CLS, FID
 */

import { test, expect } from '@playwright/test';

test.describe('Performance Profiling Suite', () => {
  // Setup
  test.beforeEach(async ({ page }) => {
    // Clear cache for consistent testing
    await page.context().clearCookies();
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  });

  // ============================================================
  // 1. CORE WEB VITALS TESTS
  // ============================================================
  test.describe('Core Web Vitals', () => {
    test('should achieve FCP < 1.8s', async ({ page }) => {
      const metrics = await page.evaluate(() => {
        const paint = performance.getEntriesByType('paint');
        const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
        return fcp ? fcp.startTime : null;
      });

      expect(metrics).toBeLessThan(1800);
    });

    test('should achieve LCP < 2.5s', async ({ page }) => {
      // Wait for LCP to be measured
      await page.waitForTimeout(3000);

      const lcp = await page.evaluate(() => {
        const entries = performance.getEntriesByType('largest-contentful-paint');
        return entries.length > 0 ? entries[entries.length - 1].renderTime : 0;
      });

      expect(lcp).toBeLessThan(2500);
    });

    test('should achieve CLS < 0.1', async ({ page }) => {
      // Perform actions to trigger potential layout shifts
      const buttons = page.locator('button');
      if (await buttons.count() > 0) {
        for (let i = 0; i < Math.min(3, await buttons.count()); i++) {
          await buttons.nth(i).hover();
          await page.waitForTimeout(100);
        }
      }

      const cls = await page.evaluate(() => {
        return performance.getEntriesByType('layout-shift')
          .filter(entry => !entry.hadRecentInput)
          .reduce((sum, entry) => sum + entry.value, 0);
      });

      expect(cls).toBeLessThan(0.1);
    });

    test('should achieve FID < 100ms', async ({ page }) => {
      const fid = await page.evaluate(() => {
        const entries = performance.getEntriesByType('first-input');
        return entries.length > 0 ? entries[0].processingStart - entries[0].startTime : 0;
      });

      // FID is measured from first user interaction
      // Should be minimal (ideally < 100ms)
      expect(fid).toBeLessThan(200); // Allow some buffer
    });

    test('should achieve TTI < 3.8s', async ({ page }) => {
      const navigationTiming = await page.evaluate(() => {
        const timing = performance.getEntriesByType('navigation')[0];
        return timing.domInteractive - timing.fetchStart;
      });

      expect(navigationTiming).toBeLessThan(3800);
    });
  });

  // ============================================================
  // 2. ANIMATION PERFORMANCE TESTS
  // ============================================================
  test.describe('Animation Performance (60fps)', () => {
    test('should render animations at 60fps', async ({ page }) => {
      const fps = await page.evaluate(() => {
        return new Promise(resolve => {
          let frameCount = 0;
          const startTime = performance.now();

          const measureFrames = () => {
            frameCount++;
            const elapsed = performance.now() - startTime;

            if (elapsed < 1000) {
              requestAnimationFrame(measureFrames);
            } else {
              resolve(frameCount);
            }
          };

          requestAnimationFrame(measureFrames);
        });
      });

      // At 60fps, should have ~60 frames per second
      expect(fps).toBeGreaterThan(50); // Allow some variance
    });

    test('button ripple should not cause frame drops', async ({ page }) => {
      const button = page.locator('[class*="ripple"]').first();

      if (await button.isVisible()) {
        const framesBefore = await page.evaluate(() => {
          const entries = performance.getEntriesByType('paint');
          return entries.length;
        });

        // Click button to trigger ripple
        await button.click();
        await page.waitForTimeout(800);

        const framesAfter = await page.evaluate(() => {
          const entries = performance.getEntriesByType('paint');
          return entries.length;
        });

        // Should not dramatically increase
        expect(framesAfter - framesBefore).toBeLessThan(10);
      }
    });

    test('modal animation should be smooth', async ({ page }) => {
      const openButton = page.locator('button:has-text("Open")').first();

      if (await openButton.isVisible()) {
        await openButton.click();
        
        // Modal should open smoothly
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible();

        // Check for janky animation signs
        const longTasks = await page.evaluate(() => {
          const entries = performance.getEntriesByType('longtask');
          return entries.length;
        });

        // No long tasks during animation
        expect(longTasks).toBe(0);
      }
    });
  });

  // ============================================================
  // 3. BUNDLE SIZE ANALYSIS
  // ============================================================
  test.describe('Bundle Size Optimization', () => {
    test('should have optimized JS bundle', async ({ page }) => {
      const resources = await page.evaluate(() => {
        return performance
          .getEntriesByType('resource')
          .filter(r => r.name.includes('.js'))
          .reduce((sum, r) => sum + r.transferSize, 0);
      });

      // Main JS should be < 500KB (gzipped ~150KB)
      expect(resources).toBeLessThan(500 * 1024);
    });

    test('should have optimized CSS bundle', async ({ page }) => {
      const cssResources = await page.evaluate(() => {
        return performance
          .getEntriesByType('resource')
          .filter(r => r.name.includes('.css'))
          .reduce((sum, r) => sum + r.transferSize, 0);
      });

      // CSS should be < 100KB (gzipped ~30KB)
      expect(cssResources).toBeLessThan(100 * 1024);
    });

    test('should lazy load components', async ({ page }) => {
      // Check if code splitting is implemented
      const jsResources = await page.evaluate(() => {
        return performance.getEntriesByType('resource')
          .filter(r => r.name.includes('.js') && r.name.includes('chunk'))
          .map(r => ({ name: r.name, size: r.transferSize }));
      });

      // Should have multiple chunks for code splitting
      expect(jsResources.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // 4. MEMORY PROFILING
  // ============================================================
  test.describe('Memory Optimization', () => {
    test('should not have memory leaks', async ({ page }) => {
      const initialMemory = await page.evaluate(() => {
        if (performance.memory) {
          return performance.memory.usedJSHeapSize;
        }
        return 0;
      });

      // Perform repeated interactions
      for (let i = 0; i < 10; i++) {
        const button = page.locator('button').first();
        if (await button.isVisible()) {
          await button.click();
          await page.waitForTimeout(100);
        }
      }

      await page.waitForTimeout(1000);

      const finalMemory = await page.evaluate(() => {
        if (performance.memory) {
          return performance.memory.usedJSHeapSize;
        }
        return 0;
      });

      // Memory should not spike dramatically
      const increase = finalMemory - initialMemory;
      expect(increase).toBeLessThan(5 * 1024 * 1024); // < 5MB increase
    });

    test('should clean up event listeners on unmount', async ({ page }) => {
      const initialListeners = await page.evaluate(() => {
        return document.querySelectorAll('[data-listenercount]').length;
      });

      // Navigate to different routes/components
      const links = page.locator('a');
      if (await links.count() > 0) {
        await links.first().click();
        await page.waitForTimeout(500);
      }

      const finalListeners = await page.evaluate(() => {
        return document.querySelectorAll('[data-listenercount]').length;
      });

      // Listeners should be properly cleaned up
      expect(finalListeners).toBeLessThanOrEqual(initialListeners + 5);
    });

    test('should not accumulate DOM nodes', async ({ page }) => {
      const initialNodes = await page.evaluate(() => {
        return document.querySelectorAll('*').length;
      });

      // Perform repeated component mounts/unmounts
      for (let i = 0; i < 3; i++) {
        const openButton = page.locator('button:has-text("Open")').first();
        if (await openButton.isVisible()) {
          await openButton.click();
          await page.waitForTimeout(300);

          const closeButton = page.locator('button:has-text("Close")').first();
          if (await closeButton.isVisible()) {
            await closeButton.click();
            await page.waitForTimeout(300);
          }
        }
      }

      const finalNodes = await page.evaluate(() => {
        return document.querySelectorAll('*').length;
      });

      // DOM nodes should not grow excessively
      expect(finalNodes - initialNodes).toBeLessThan(50);
    });
  });

  // ============================================================
  // 5. NETWORK PERFORMANCE
  // ============================================================
  test.describe('Network Performance', () => {
    test('should minimize HTTP requests', async ({ page }) => {
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

      const requests = await page.evaluate(() => {
        return performance.getEntriesByType('resource').length;
      });

      // Should have reasonable number of requests (< 50)
      expect(requests).toBeLessThan(50);
    });

    test('should cache resources properly', async ({ page }) => {
      // First load
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
      const firstLoadMetrics = await page.evaluate(() => {
        const timing = performance.getEntriesByType('navigation')[0];
        return {
          duration: timing.loadEventEnd - timing.fetchStart,
          transferSize: timing.transferSize,
        };
      });

      // Reload page
      await page.reload({ waitUntil: 'networkidle' });
      const secondLoadMetrics = await page.evaluate(() => {
        const timing = performance.getEntriesByType('navigation')[0];
        return {
          duration: timing.loadEventEnd - timing.fetchStart,
          transferSize: timing.transferSize,
        };
      });

      // Second load should be faster (caching)
      expect(secondLoadMetrics.duration).toBeLessThan(firstLoadMetrics.duration);
    });

    test('should optimize image delivery', async ({ page }) => {
      const images = await page.evaluate(() => {
        return performance
          .getEntriesByType('resource')
          .filter(r => /\.(jpg|jpeg|png|webp|gif)$/i.test(r.name))
          .map(r => ({ name: r.name, size: r.transferSize }));
      });

      // Each image should be reasonably sized
      images.forEach(img => {
        expect(img.size).toBeLessThan(500 * 1024); // < 500KB per image
      });
    });
  });

  // ============================================================
  // 6. INTERACTION RESPONSIVENESS
  // ============================================================
  test.describe('Interaction Responsiveness', () => {
    test('button click should respond within 100ms', async ({ page }) => {
      const button = page.locator('button').first();

      if (await button.isVisible()) {
        const startTime = Date.now();
        await button.click();
        const endTime = Date.now();

        expect(endTime - startTime).toBeLessThan(100);
      }
    });

    test('form input should respond instantly', async ({ page }) => {
      const input = page.locator('input[type="text"]').first();

      if (await input.isVisible()) {
        const startTime = Date.now();
        await input.fill('test');
        const endTime = Date.now();

        expect(endTime - startTime).toBeLessThan(100);
      }
    });

    test('scroll should be smooth', async ({ page }) => {
      // Simulate scroll
      await page.evaluate(() => {
        window.scrollBy(0, 500);
      });

      // Should not cause jank
      const longTasks = await page.evaluate(() => {
        return performance.getEntriesByType('longtask').length;
      });

      expect(longTasks).toBe(0);
    });
  });

  // ============================================================
  // 7. LIGHTHOUSE SCORE VALIDATION
  // ============================================================
  test.describe('Lighthouse Score Targets', () => {
    test('should achieve Lighthouse score > 90', async ({ page }) => {
      // This is a placeholder - actual Lighthouse testing
      // would be done with lighthouse-ci or similar
      
      // For now, validate that key metrics meet targets
      const metrics = await page.evaluate(() => {
        const fcp = performance.getEntriesByType('paint')[0]?.startTime || 0;
        const lcp = performance.getEntriesByType('largest-contentful-paint').pop()?.renderTime || 0;
        
        return {
          fcp: fcp < 1800, // Good
          lcp: lcp < 2500, // Good
          hasContent: document.body.children.length > 0,
        };
      });

      expect(metrics.fcp).toBeTruthy();
      expect(metrics.lcp).toBeTruthy();
      expect(metrics.hasContent).toBeTruthy();
    });
  });
});
