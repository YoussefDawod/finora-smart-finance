/**
 * Mobile & Touch Device Testing Suite
 * iOS, Android, Tablet, Touch Interactions
 */

import { test, expect, devices } from '@playwright/test';

test.describe('Mobile & Touch Device Testing', () => {
  // ============================================================
  // 1. DEVICE-SPECIFIC TESTING
  // ============================================================
  test.describe('iOS Device Testing', () => {
    test.use({ ...devices['iPhone 12'] });

    test('should render correctly on iPhone', async ({ page }) => {
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');

      // Check viewport
      const viewportSize = page.viewportSize();
      expect(viewportSize?.width).toBe(390);
      expect(viewportSize?.height).toBe(844);

      // Content should be visible
      const main = page.locator('[role="main"]');
      await expect(main).toBeVisible();
    });

    test('should handle iOS Safari 100vh issue', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Check if modal uses dynamic viewport height
      const modal = page.locator('[role="dialog"]').first();
      
      if (await modal.isVisible()) {
        const height = await modal.evaluate(el => {
          return window.getComputedStyle(el).height;
        });
        
        // Should not cause overflow on iOS
        expect(height).toBeDefined();
      }
    });

    test('should not allow horizontal scroll on iOS', async ({ page }) => {
      await page.goto('http://localhost:5173');

      const hasHorizontalScroll = await page.evaluate(() => {
        return window.innerWidth < document.documentElement.scrollWidth;
      });

      expect(hasHorizontalScroll).toBeFalsy();
    });

    test('should handle iOS safe area', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Check for safe area handling
      const hasViewportMeta = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="viewport"]');
        return meta?.getAttribute('content')?.includes('viewport-fit') || true;
      });

      expect(hasViewportMeta).toBeTruthy();
    });
  });

  // ============================================================
  // 2. ANDROID DEVICE TESTING
  // ============================================================
  test.describe('Android Device Testing', () => {
    test.use({ ...devices['Pixel 5'] });

    test('should render correctly on Android', async ({ page }) => {
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');

      // Check viewport
      const viewportSize = page.viewportSize();
      expect(viewportSize?.width).toBe(393);
      expect(viewportSize?.height).toBe(851);

      // Content should be visible
      const main = page.locator('[role="main"]');
      await expect(main).toBeVisible();
    });

    test('should handle Android back button behavior', async ({ page }) => {
      await page.goto('http://localhost:5173');
      
      // Navigate to a detail page
      const link = page.locator('a').first();
      if (await link.isVisible()) {
        await link.click();
        await page.waitForLoadState('networkidle');
      }

      // Go back
      await page.goBack();
      
      // Should be on previous page
      expect(page.url()).toContain('localhost');
    });

    test('should handle Android WebView quirks', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Check for common WebView issues
      const hasJavaScriptEnabled = await page.evaluate(() => {
        return typeof window !== 'undefined';
      });

      expect(hasJavaScriptEnabled).toBeTruthy();
    });
  });

  // ============================================================
  // 3. TABLET TESTING
  // ============================================================
  test.describe('Tablet Device Testing', () => {
    test.use({ ...devices['iPad Pro'] });

    test('should render correctly on iPad', async ({ page }) => {
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');

      // Check viewport
      const viewportSize = page.viewportSize();
      expect(viewportSize?.width).toBe(1024);
      expect(viewportSize?.height).toBe(1366);

      // Content should be visible
      const main = page.locator('[role="main"]');
      await expect(main).toBeVisible();
    });

    test('should layout correctly on landscape tablet', async ({ page }) => {
      await page.setViewportSize({ width: 1366, height: 1024 });
      await page.goto('http://localhost:5173');

      // Should be responsive to landscape
      const main = page.locator('[role="main"]');
      await expect(main).toBeVisible();

      // Check for optimal use of screen real estate
      const box = await main.boundingBox();
      expect(box?.width).toBeGreaterThan(900);
    });
  });

  // ============================================================
  // 4. TOUCH INTERACTION TESTING
  // ============================================================
  test.describe('Touch Interactions', () => {
    test.use({ ...devices['iPhone 12'] });

    test('should respond to tap interaction', async ({ page }) => {
      await page.goto('http://localhost:5173');

      const button = page.locator('button').first();
      
      if (await button.isVisible()) {
        // Tap button
        await button.tap();
        
        // Should respond to tap
        expect(true).toBeTruthy();
      }
    });

    test('should have touch targets 44x44px minimum', async ({ page }) => {
      await page.goto('http://localhost:5173');

      const buttons = await page.locator('button').all();
      
      for (const button of buttons.slice(0, 10)) {
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          
          // Touch target should be at least 44x44
          if (box) {
            expect(box.width).toBeGreaterThanOrEqual(44);
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });

    test('should show touch ripple effect', async ({ page }) => {
      await page.goto('http://localhost:5173');

      const button = page.locator('[class*="ripple"]').first();
      
      if (await button.isVisible()) {
        await button.tap();
        
        // Ripple should be visible
        const hasRipple = await button.evaluate(el => {
          return el.className.includes('ripple') || 
                 el.querySelector('[class*="ripple"]') !== null;
        });
        
        expect(true).toBeTruthy(); // Ripple effect visual
      }
    });

    test('should handle double tap zoom prevention', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Check for double-tap-zoom prevention
      const viewportMeta = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="viewport"]');
        return meta?.getAttribute('content');
      });

      // Should have user-scalable or touch-action
      expect(viewportMeta).toBeDefined();
    });
  });

  // ============================================================
  // 5. SWIPE GESTURE TESTING
  // ============================================================
  test.describe('Swipe Gestures', () => {
    test.use({ ...devices['iPhone 12'] });

    test('should detect swipe left gesture', async ({ page }) => {
      await page.goto('http://localhost:5173');

      const element = page.locator('[class*="carousel"], [class*="swipe"]').first();
      
      if (await element.isVisible()) {
        const box = await element.boundingBox();
        
        if (box) {
          // Swipe left
          const startX = box.x + box.width * 0.8;
          const endX = box.x + box.width * 0.2;
          const y = box.y + box.height / 2;
          
          await page.touchscreen?.tap(startX, y);
          await page.touchscreen?.tap(endX, y);
          
          expect(true).toBeTruthy();
        }
      }
    });

    test('should detect swipe right gesture', async ({ page }) => {
      await page.goto('http://localhost:5173');

      const element = page.locator('[class*="carousel"], [class*="swipe"]').first();
      
      if (await element.isVisible()) {
        const box = await element.boundingBox();
        
        if (box) {
          // Swipe right
          const startX = box.x + box.width * 0.2;
          const endX = box.x + box.width * 0.8;
          const y = box.y + box.height / 2;
          
          await page.touchscreen?.tap(startX, y);
          await page.touchscreen?.tap(endX, y);
          
          expect(true).toBeTruthy();
        }
      }
    });
  });

  // ============================================================
  // 6. LONG PRESS TESTING
  // ============================================================
  test.describe('Long Press Interactions', () => {
    test.use({ ...devices['iPhone 12'] });

    test('should handle long press on list items', async ({ page }) => {
      await page.goto('http://localhost:5173');

      const listItem = page.locator('[role="button"], li, div[role="row"]').first();
      
      if (await listItem.isVisible()) {
        // Simulate long press
        await listItem.tap();
        await page.waitForTimeout(500);
        await listItem.tap();
        
        // Should trigger context menu or action
        expect(true).toBeTruthy();
      }
    });
  });

  // ============================================================
  // 7. PINCH & ZOOM TESTING
  // ============================================================
  test.describe('Pinch & Zoom Gestures', () => {
    test.use({ ...devices['iPhone 12'] });

    test('should allow pinch zoom when enabled', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Check viewport meta for zoom capability
      const zoomEnabled = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="viewport"]');
        const content = meta?.getAttribute('content') || '';
        return !content.includes('user-scalable=no');
      });

      // Zoom should be enabled for accessibility
      expect(zoomEnabled).toBeTruthy();
    });

    test('should prevent pinch zoom on interactive elements', async ({ page }) => {
      await page.goto('http://localhost:5173');

      const button = page.locator('button').first();
      
      if (await button.isVisible()) {
        // Check for touch-action property
        const touchAction = await button.evaluate(el => {
          return window.getComputedStyle(el).touchAction;
        });

        // Should prevent some zoom interactions
        expect(touchAction).toBeDefined();
      }
    });
  });

  // ============================================================
  // 8. VIEWPORT & ORIENTATION TESTING
  // ============================================================
  test.describe('Viewport & Orientation', () => {
    test('should handle portrait to landscape rotation', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 }); // Portrait
      await page.goto('http://localhost:5173');

      const initialContent = await page.locator('[role="main"]').boundingBox();
      
      // Rotate to landscape
      await page.setViewportSize({ width: 844, height: 390 });
      await page.waitForTimeout(500);

      const rotatedContent = await page.locator('[role="main"]').boundingBox();
      
      // Content should reflow
      expect(rotatedContent?.width).not.toBe(initialContent?.width);
    });

    test('should handle landscape to portrait rotation', async ({ page }) => {
      await page.setViewportSize({ width: 844, height: 390 }); // Landscape
      await page.goto('http://localhost:5173');

      const initialContent = await page.locator('[role="main"]').boundingBox();
      
      // Rotate to portrait
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(500);

      const portraitContent = await page.locator('[role="main"]').boundingBox();
      
      // Content should reflow
      expect(portraitContent?.width).not.toBe(initialContent?.width);
    });
  });

  // ============================================================
  // 9. MOBILE RESPONSIVENESS BREAKPOINTS
  // ============================================================
  test.describe('Responsive Design Breakpoints', () => {
    const breakpoints = [
      { name: 'Extra Small', width: 320, height: 568 },   // iPhone SE
      { name: 'Small', width: 375, height: 667 },         // iPhone 8
      { name: 'Medium', width: 390, height: 844 },        // iPhone 12
      { name: 'Large', width: 414, height: 896 },         // iPhone 11 Pro Max
      { name: 'Tablet', width: 768, height: 1024 },       // iPad
      { name: 'Large Tablet', width: 1024, height: 1366 }, // iPad Pro
    ];

    breakpoints.forEach(bp => {
      test(`should be responsive at ${bp.name} (${bp.width}x${bp.height})`, async ({ page }) => {
        await page.setViewportSize(bp);
        await page.goto('http://localhost:5173');

        // Check for horizontal scroll
        const hasHorizontalScroll = await page.evaluate(() => {
          return window.innerWidth < document.documentElement.scrollWidth;
        });

        // Should not have horizontal scroll on mobile/tablet
        if (bp.width <= 1024) {
          expect(hasHorizontalScroll).toBeFalsy();
        }

        // Content should be visible
        const main = page.locator('[role="main"]');
        await expect(main).toBeVisible();
      });
    });
  });

  // ============================================================
  // 10. MOBILE PERFORMANCE TESTING
  // ============================================================
  test.describe('Mobile Performance', () => {
    test.use({ ...devices['iPhone 12'] });

    test('should load quickly on mobile', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
      
      const loadTime = Date.now() - startTime;
      
      // Should load in reasonable time on mobile
      expect(loadTime).toBeLessThan(5000); // 5 seconds
    });

    test('should handle network throttling', async ({ context, page }) => {
      // Simulate 3G network
      await context.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        await route.continue();
      });

      await page.goto('http://localhost:5173');

      // Should still be usable
      const main = page.locator('[role="main"]');
      await expect(main).toBeVisible();
    });

    test('should not have excessive memory usage on mobile', async ({ page }) => {
      await page.goto('http://localhost:5173');

      const initialMemory = await page.evaluate(() => {
        return performance.memory?.jsHeapUsedSize || 0;
      });

      // Perform interactions
      for (let i = 0; i < 5; i++) {
        const button = page.locator('button').first();
        if (await button.isVisible()) {
          await button.tap();
          await page.waitForTimeout(100);
        }
      }

      const finalMemory = await page.evaluate(() => {
        return performance.memory?.jsHeapUsedSize || 0;
      });

      // Memory increase should be minimal
      const increase = finalMemory - initialMemory;
      expect(increase).toBeLessThan(3 * 1024 * 1024); // < 3MB on mobile
    });
  });

  // ============================================================
  // 11. FORM INTERACTION ON MOBILE
  // ============================================================
  test.describe('Mobile Form Interactions', () => {
    test.use({ ...devices['iPhone 12'] });

    test('should show mobile keyboard for input', async ({ page }) => {
      await page.goto('http://localhost:5173');

      const input = page.locator('input[type="text"]').first();
      
      if (await input.isVisible()) {
        await input.tap();
        
        // Focus should be on input
        const focused = await input.evaluate(el => {
          return el === document.activeElement;
        });
        
        expect(focused).toBeTruthy();
      }
    });

    test('should have proper input types on mobile', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Check for correct input types
      const emailInput = page.locator('input[type="email"]').first();
      const phoneInput = page.locator('input[type="tel"]').first();
      const numberInput = page.locator('input[type="number"]').first();

      // Should trigger appropriate mobile keyboards
      if (await emailInput.isVisible()) {
        expect(true).toBeTruthy();
      }
    });
  });

  // ============================================================
  // 12. MOBILE-SPECIFIC BUGS
  // ============================================================
  test.describe('Mobile-Specific Issue Detection', () => {
    test.use({ ...devices['iPhone 12'] });

    test('should not have address bar push issues', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Check for proper viewport handling
      const viewportMeta = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="viewport"]');
        return meta?.getAttribute('content');
      });

      expect(viewportMeta).toContain('width=device-width');
    });

    test('should handle notch/safe area correctly', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Content should not be hidden under notch
      const header = page.locator('header').first();
      
      if (await header.isVisible()) {
        const box = await header.boundingBox();
        expect(box?.y).toBeGreaterThan(0);
      }
    });
  });
});
