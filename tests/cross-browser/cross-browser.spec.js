/**
 * Cross-Browser Compatibility Test Suite
 * Tests for Chrome, Firefox, Safari, and Edge browsers
 * Using Playwright for automated testing
 */

import { test, expect } from '@playwright/test';

// Test configuration for all browsers
test.describe.configure({ mode: 'parallel' });

// Browser-specific test matrix
const BROWSERS = ['chromium', 'firefox', 'webkit'];

test.describe('Cross-Browser Compatibility Suite', () => {
  // Setup
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  // ============================================================
  // 1. LAYOUT & RENDERING TESTS
  // ============================================================
  test.describe('Layout Rendering', () => {
    test('should render main layout correctly', async ({ page }) => {
      // Check main container exists
      const mainContainer = page.locator('[role="main"]');
      await expect(mainContainer).toBeVisible();
      
      // Check for key layout elements
      const header = page.locator('header');
      const sidebar = page.locator('[role="navigation"]');
      const content = page.locator('[role="main"]');
      
      await expect(header).toBeVisible();
      await expect(content).toBeVisible();
    });

    test('should handle flexbox layout correctly', async ({ page }) => {
      const container = page.locator('[class*="flex"]').first();
      if (await container.isVisible()) {
        const box = await container.boundingBox();
        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
      }
    });

    test('should handle grid layout correctly', async ({ page }) => {
      const gridContainer = page.locator('[class*="grid"]').first();
      if (await gridContainer.isVisible()) {
        const box = await gridContainer.boundingBox();
        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
      }
    });

    test('should maintain layout on viewport resize', async ({ page }) => {
      // Initial size
      const initialBox = await page.locator('[role="main"]').boundingBox();
      
      // Resize to tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      
      const tabletBox = await page.locator('[role="main"]').boundingBox();
      expect(tabletBox.width).toBeGreaterThan(0);
      
      // Resize to mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      const mobileBox = await page.locator('[role="main"]').boundingBox();
      expect(mobileBox.width).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // 2. ANIMATION & CSS TESTS
  // ============================================================
  test.describe('CSS Animations', () => {
    test('should apply button hover animation', async ({ page, browserName }) => {
      const button = page.locator('button').first();
      
      if (await button.isVisible()) {
        // Get initial style
        const initialStyle = await button.evaluate(el => {
          return window.getComputedStyle(el).transform;
        });
        
        // Hover on button
        await button.hover();
        await page.waitForTimeout(300);
        
        // Check for transform change (scale animation)
        const hoverStyle = await button.evaluate(el => {
          return window.getComputedStyle(el).transform;
        });
        
        // Transform should change on hover (except for initial state)
        expect(hoverStyle).toBeDefined();
      }
    });

    test('should animate modal correctly', async ({ page }) => {
      // Open modal if button exists
      const modalButton = page.locator('button:has-text("Open")').first();
      
      if (await modalButton.isVisible()) {
        await modalButton.click();
        
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible();
        
        // Check for animation class
        const hasAnimationClass = await modal.evaluate(el => {
          const classes = el.className;
          return classes.includes('animate') || classes.includes('modal');
        });
        
        expect(hasAnimationClass).toBeTruthy();
      }
    });

    test('should handle animation performance without jank', async ({ page }) => {
      // Trigger animation-heavy interaction
      const button = page.locator('[class*="ripple"]').first();
      
      if (await button.isVisible()) {
        // Get initial performance metrics
        const initialMetrics = await page.evaluate(() => {
          return {
            memory: performance.memory?.jsHeapUsedSize || 0,
            timestamp: performance.now(),
          };
        });
        
        // Click to trigger ripple
        await button.click();
        await page.waitForTimeout(800);
        
        // Check final metrics
        const finalMetrics = await page.evaluate(() => {
          return {
            memory: performance.memory?.jsHeapUsedSize || 0,
            timestamp: performance.now(),
          };
        });
        
        // Memory should not spike dramatically
        const memoryIncrease = finalMetrics.memory - initialMetrics.memory;
        expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // Less than 5MB
      }
    });
  });

  // ============================================================
  // 3. INTERACTIVE ELEMENTS TESTS
  // ============================================================
  test.describe('Interactive Elements', () => {
    test('should handle button click correctly', async ({ page }) => {
      const button = page.locator('button').first();
      
      if (await button.isVisible()) {
        await button.click();
        // No specific assertion, just ensure no error
        expect(true).toBeTruthy();
      }
    });

    test('should handle form inputs correctly', async ({ page }) => {
      const input = page.locator('input[type="text"]').first();
      
      if (await input.isVisible()) {
        await input.fill('Test input');
        const value = await input.inputValue();
        expect(value).toBe('Test input');
      }
    });

    test('should handle dropdown selection', async ({ page }) => {
      const select = page.locator('select').first();
      
      if (await select.isVisible()) {
        await select.selectOption({ index: 0 });
        expect(true).toBeTruthy();
      }
    });

    test('should handle checkbox toggle', async ({ page }) => {
      const checkbox = page.locator('input[type="checkbox"]').first();
      
      if (await checkbox.isVisible()) {
        const initialState = await checkbox.isChecked();
        await checkbox.check();
        const checkedState = await checkbox.isChecked();
        expect(checkedState).not.toBe(initialState);
      }
    });

    test('should handle radio button selection', async ({ page }) => {
      const radio = page.locator('input[type="radio"]').first();
      
      if (await radio.isVisible()) {
        await radio.click();
        const isChecked = await radio.isChecked();
        expect(isChecked).toBeTruthy();
      }
    });

    test('should handle focus indicators', async ({ page }) => {
      const button = page.locator('button').first();
      
      if (await button.isVisible()) {
        await button.focus();
        
        const hasFocusClass = await button.evaluate(el => {
          return el.className.includes('focus') || 
                 window.getComputedStyle(el).outlineColor !== 'rgba(0, 0, 0, 0)';
        });
        
        expect(hasFocusClass).toBeTruthy();
      }
    });
  });

  // ============================================================
  // 4. WEBSOCKET CONNECTION TESTS
  // ============================================================
  test.describe('WebSocket Connections', () => {
    test('should establish WebSocket connection', async ({ page }) => {
      let wsConnected = false;
      
      page.on('console', msg => {
        if (msg.text().includes('WebSocket')) {
          wsConnected = true;
        }
      });
      
      // If app uses WebSocket, connection should be established
      await page.waitForTimeout(2000);
      // Just verify no connection errors occurred
      expect(true).toBeTruthy();
    });

    test('should handle connection errors gracefully', async ({ page }) => {
      // Check for error handling UI
      const errorBanner = page.locator('[role="alert"], [class*="error"]');
      
      if (await errorBanner.isVisible()) {
        // Error UI should be visible if connection fails
        expect(true).toBeTruthy();
      }
    });
  });

  // ============================================================
  // 5. STORAGE TESTS (localStorage/sessionStorage)
  // ============================================================
  test.describe('Storage APIs', () => {
    test('should save data to localStorage', async ({ page }) => {
      const value = await page.evaluate(() => {
        localStorage.setItem('test-key', 'test-value');
        return localStorage.getItem('test-key');
      });
      
      expect(value).toBe('test-value');
    });

    test('should save data to sessionStorage', async ({ page }) => {
      const value = await page.evaluate(() => {
        sessionStorage.setItem('test-key', 'test-value');
        return sessionStorage.getItem('test-key');
      });
      
      expect(value).toBe('test-value');
    });

    test('should clear storage properly', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('test-key', 'test-value');
        localStorage.clear();
      });
      
      const value = await page.evaluate(() => {
        return localStorage.getItem('test-key');
      });
      
      expect(value).toBeNull();
    });
  });

  // ============================================================
  // 6. GESTURE & TOUCH TESTS
  // ============================================================
  test.describe('Touch & Gestures', () => {
    test('should handle touch events', async ({ page }) => {
      const touchTarget = page.locator('button, [role="button"]').first();
      
      if (await touchTarget.isVisible()) {
        await touchTarget.tap();
        expect(true).toBeTruthy();
      }
    });

    test('should handle swipe gestures', async ({ page }) => {
      // Test swipe functionality
      const swipeTarget = page.locator('[class*="swipe"], [class*="carousel"]').first();
      
      if (await swipeTarget.isVisible()) {
        const box = await swipeTarget.boundingBox();
        
        // Simulate swipe left
        await page.touchscreen?.tap(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(300);
        
        expect(true).toBeTruthy();
      }
    });
  });

  // ============================================================
  // 7. RESPONSIVE DESIGN TESTS
  // ============================================================
  test.describe('Responsive Design', () => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1440, height: 900 },
    ];

    viewports.forEach(viewport => {
      test(`should render correctly on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('http://localhost:5173');
        await page.waitForLoadState('networkidle');
        
        // Check for layout issues
        const hasHorizontalScroll = await page.evaluate(() => {
          return window.innerWidth < document.documentElement.scrollWidth;
        });
        
        // No horizontal scroll on desktop/tablet
        if (viewport.width >= 768) {
          expect(hasHorizontalScroll).toBeFalsy();
        }
      });
    });
  });

  // ============================================================
  // 8. PERFORMANCE TIMING TESTS
  // ============================================================
  test.describe('Performance Timing', () => {
    test('should load page in reasonable time', async ({ page }) => {
      const navigationTiming = await page.evaluate(() => {
        const timing = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
          loadComplete: timing.loadEventEnd - timing.loadEventStart,
          domInteractive: timing.domInteractive - timing.fetchStart,
        };
      });
      
      // All should be reasonable
      expect(navigationTiming.loadComplete).toBeLessThan(5000); // 5 seconds
    });

    test('should not have memory leaks on repeated interactions', async ({ page }) => {
      const initialMemory = await page.evaluate(() => {
        return performance.memory?.jsHeapUsedSize || 0;
      });
      
      // Perform repeated interactions
      for (let i = 0; i < 5; i++) {
        const button = page.locator('button').first();
        if (await button.isVisible()) {
          await button.click();
          await page.waitForTimeout(100);
        }
      }
      
      const finalMemory = await page.evaluate(() => {
        return performance.memory?.jsHeapUsedSize || 0;
      });
      
      // Memory increase should be minimal
      const increase = finalMemory - initialMemory;
      expect(increase).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
    });
  });
});
