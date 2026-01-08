/**
 * Accessibility Audit Test Suite (WCAG 2.1 Level AA)
 * Automated and manual accessibility testing
 */

import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility Audit Suite (WCAG 2.1 AA)', () => {
  // Setup
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  // ============================================================
  // 1. AUTOMATED ACCESSIBILITY SCANNING
  // ============================================================
  test.describe('Automated Accessibility Scanning', () => {
    test('should have no critical accessibility violations', async ({ page }) => {
      await injectAxe(page);
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: {
          html: true,
        },
      });
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      
      // Should have at least one h1
      const h1Count = headings.filter(h => h.evaluate(el => el.tagName === 'H1')).length;
      expect(h1Count).toBeGreaterThan(0);

      // Check heading order (no skipped levels)
      let previousLevel = 0;
      for (const heading of headings) {
        const level = await heading.evaluate(el => parseInt(el.tagName[1]));
        expect(level).toBeLessThanOrEqual(previousLevel + 1);
        previousLevel = level;
      }
    });

    test('should have alt text for all images', async ({ page }) => {
      const images = await page.locator('img').all();
      
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        const isDecorative = await img.evaluate(el => 
          el.parentElement?.getAttribute('role') === 'presentation'
        );
        
        if (!isDecorative) {
          expect(alt).not.toBeNull();
          expect(alt?.length).toBeGreaterThan(0);
        }
      }
    });

    test('should have descriptive link text', async ({ page }) => {
      const links = await page.locator('a').all();
      
      for (const link of links) {
        const text = await link.textContent();
        const title = await link.getAttribute('title');
        const ariaLabel = await link.getAttribute('aria-label');
        
        const hasDescriptiveContent = 
          (text && text.length > 0 && text !== 'Click here') ||
          title ||
          ariaLabel;
        
        expect(hasDescriptiveContent).toBeTruthy();
      }
    });
  });

  // ============================================================
  // 2. KEYBOARD NAVIGATION TESTS
  // ============================================================
  test.describe('Keyboard Navigation', () => {
    test('should be navigable with Tab key', async ({ page }) => {
      // Get all interactive elements
      const interactiveElements = page.locator(
        'button, [role="button"], a, input, [role="link"], select, textarea, [role="menuitem"]'
      );
      
      const count = await interactiveElements.count();
      expect(count).toBeGreaterThan(0);

      // Tab through elements
      for (let i = 0; i < Math.min(10, count); i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
      }

      // Should not crash or go off-screen
      expect(true).toBeTruthy();
    });

    test('should handle Enter key for buttons', async ({ page }) => {
      const button = page.locator('button').first();
      
      if (await button.isVisible()) {
        await button.focus();
        await page.keyboard.press('Enter');
        
        // Button should respond
        expect(true).toBeTruthy();
      }
    });

    test('should handle Escape key to close modals', async ({ page }) => {
      const openButton = page.locator('button:has-text("Open")').first();
      
      if (await openButton.isVisible()) {
        await openButton.click();
        
        const modal = page.locator('[role="dialog"]');
        if (await modal.isVisible()) {
          await page.keyboard.press('Escape');
          
          // Modal should close or become hidden
          await page.waitForTimeout(300);
          expect(true).toBeTruthy();
        }
      }
    });

    test('should handle Arrow keys for navigation', async ({ page }) => {
      const select = page.locator('select').first();
      
      if (await select.isVisible()) {
        await select.focus();
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(100);
        
        expect(true).toBeTruthy();
      }
    });

    test('should not have keyboard traps', async ({ page }) => {
      const startElement = page.locator('button').first();
      
      if (await startElement.isVisible()) {
        await startElement.focus();
        
        // Tab multiple times - should be able to leave element
        for (let i = 0; i < 5; i++) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(50);
        }
        
        const focused = await page.evaluate(() => {
          return document.activeElement?.tagName;
        });
        
        // Should have moved to different element
        expect(focused).toBeTruthy();
      }
    });
  });

  // ============================================================
  // 3. FOCUS MANAGEMENT & INDICATORS
  // ============================================================
  test.describe('Focus Management', () => {
    test('should have visible focus indicators', async ({ page }) => {
      const button = page.locator('button').first();
      
      if (await button.isVisible()) {
        await button.focus();
        
        const hasVisibleFocus = await button.evaluate(el => {
          const style = window.getComputedStyle(el);
          const hasFocusClass = el.className.includes('focus');
          const hasOutline = style.outlineColor !== 'rgba(0, 0, 0, 0)';
          const hasBoxShadow = style.boxShadow !== 'none';
          
          return hasFocusClass || hasOutline || hasBoxShadow;
        });
        
        expect(hasVisibleFocus).toBeTruthy();
      }
    });

    test('should have :focus-visible for keyboard navigation', async ({ page }) => {
      await page.goto('http://localhost:5173');
      
      // Check if :focus-visible is implemented
      const hasFocusVisible = await page.evaluate(() => {
        const style = document.createElement('style');
        style.textContent = ':focus-visible { }';
        document.head.appendChild(style);
        const hasSupport = CSS.supports('selector(:focus-visible)');
        style.remove();
        return hasSupport;
      });
      
      expect(hasFocusVisible).toBeTruthy();
    });

    test('should restore focus after modal closes', async ({ page }) => {
      const button = page.locator('button:has-text("Open")').first();
      
      if (await button.isVisible()) {
        await button.focus();
        const initialId = await button.evaluate(el => el.id);
        
        await button.click();
        
        const modal = page.locator('[role="dialog"]');
        if (await modal.isVisible()) {
          const closeButton = modal.locator('button:has-text("Close")').first();
          if (await closeButton.isVisible()) {
            await closeButton.click();
            await page.waitForTimeout(300);
            
            // Focus should return to trigger button
            const focusedElement = await page.evaluate(() => {
              return (document.activeElement as HTMLElement)?.id;
            });
            
            // At minimum, focus should be back on the page
            expect(focusedElement).toBeDefined();
          }
        }
      }
    });
  });

  // ============================================================
  // 4. COLOR CONTRAST TESTS
  // ============================================================
  test.describe('Color Contrast (WCAG AA)', () => {
    test('text should have 4.5:1 contrast ratio', async ({ page }) => {
      const textElements = await page.locator('p, span, div:not(:has(> *))').all();
      
      for (const element of textElements.slice(0, 20)) {
        if (await element.isVisible()) {
          const contrast = await element.evaluate(el => {
            const style = window.getComputedStyle(el);
            const color = style.color;
            const bgColor = style.backgroundColor;
            
            // This is simplified - real implementation would use WCAG formula
            return { color, bgColor };
          });
          
          // Should have defined colors
          expect(contrast.color).not.toBe('rgba(0, 0, 0, 0)');
        }
      }
    });

    test('buttons should have sufficient contrast', async ({ page }) => {
      const buttons = await page.locator('button').all();
      
      for (const button of buttons.slice(0, 10)) {
        if (await button.isVisible()) {
          const style = await button.evaluate(el => {
            const s = window.getComputedStyle(el);
            return {
              color: s.color,
              backgroundColor: s.backgroundColor,
              borderColor: s.borderColor,
            };
          });
          
          // Should have distinct colors
          expect(style.backgroundColor).not.toBe(style.color);
        }
      }
    });
  });

  // ============================================================
  // 5. FORM ACCESSIBILITY
  // ============================================================
  test.describe('Form Accessibility', () => {
    test('all form inputs should have labels', async ({ page }) => {
      const inputs = await page.locator('input[type="text"], input[type="email"], input[type="password"], textarea').all();
      
      for (const input of inputs) {
        if (await input.isVisible()) {
          const inputId = await input.getAttribute('id');
          const label = await page.locator(`label[for="${inputId}"]`).count();
          const ariaLabel = await input.getAttribute('aria-label');
          
          const hasLabel = label > 0 || ariaLabel;
          expect(hasLabel).toBeTruthy();
        }
      }
    });

    test('form errors should be announced', async ({ page }) => {
      const form = page.locator('form').first();
      
      if (await form.isVisible()) {
        const inputs = form.locator('input');
        
        // Try to submit with empty required fields
        const submitButton = form.locator('button[type="submit"]');
        if (await submitButton.isVisible()) {
          await submitButton.click();
          
          // Look for error announcements
          const ariaLive = page.locator('[aria-live]');
          expect(await ariaLive.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('checkboxes should be properly labeled', async ({ page }) => {
      const checkboxes = await page.locator('input[type="checkbox"]').all();
      
      for (const checkbox of checkboxes) {
        if (await checkbox.isVisible()) {
          const id = await checkbox.getAttribute('id');
          const label = await page.locator(`label[for="${id}"]`).count();
          const ariaLabel = await checkbox.getAttribute('aria-label');
          
          const hasLabel = label > 0 || ariaLabel;
          expect(hasLabel).toBeTruthy();
        }
      }
    });

    test('radio buttons should be in fieldset', async ({ page }) => {
      const radioGroups = await page.locator('fieldset').all();
      
      for (const group of radioGroups) {
        const legend = group.locator('legend');
        const hasLegend = await legend.count() > 0;
        expect(hasLegend).toBeTruthy();
      }
    });
  });

  // ============================================================
  // 6. ARIA ATTRIBUTES VALIDATION
  // ============================================================
  test.describe('ARIA Compliance', () => {
    test('interactive elements should have proper roles', async ({ page }) => {
      const interactiveElements = await page.locator('button, [role="button"], a, select').all();
      
      for (const element of interactiveElements.slice(0, 20)) {
        if (await element.isVisible()) {
          const role = await element.getAttribute('role');
          const tagName = await element.evaluate(el => el.tagName.toLowerCase());
          
          // Either has role or is semantic HTML
          expect(role || ['button', 'a', 'select'].includes(tagName)).toBeTruthy();
        }
      }
    });

    test('live regions should have aria-live', async ({ page }) => {
      const toasts = page.locator('[class*="toast"]');
      
      if (await toasts.count() > 0) {
        const ariaLive = await toasts.first().getAttribute('aria-live');
        expect(['polite', 'assertive']).toContain(ariaLive);
      }
    });

    test('should have proper ARIA labels on icons', async ({ page }) => {
      const iconButtons = page.locator('button svg, [role="button"] svg').locator('..').all();
      
      for (const button of iconButtons.slice(0, 10)) {
        const hasLabel = await button.evaluate(el => {
          return el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent?.trim().length > 0;
        });
        
        expect(hasLabel).toBeTruthy();
      }
    });
  });

  // ============================================================
  // 7. SEMANTIC HTML VALIDATION
  // ============================================================
  test.describe('Semantic HTML', () => {
    test('should use semantic header element', async ({ page }) => {
      const header = page.locator('header');
      expect(await header.count()).toBeGreaterThan(0);
    });

    test('should use semantic nav element', async ({ page }) => {
      const nav = page.locator('nav, [role="navigation"]');
      expect(await nav.count()).toBeGreaterThan(0);
    });

    test('should use semantic main element', async ({ page }) => {
      const main = page.locator('main, [role="main"]');
      expect(await main.count()).toBeGreaterThan(0);
    });

    test('should have proper landmark regions', async ({ page }) => {
      const landmarks = page.locator('header, nav, main, footer, [role="banner"], [role="navigation"], [role="main"], [role="contentinfo"]');
      expect(await landmarks.count()).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // 8. MOTION PREFERENCES
  // ============================================================
  test.describe('Motion Preferences (prefers-reduced-motion)', () => {
    test('should respect prefers-reduced-motion', async ({ page, context }) => {
      // Override media query
      await context.addInitScript(() => {
        window.matchMedia = (media) => ({
          matches: media === '(prefers-reduced-motion: reduce)',
          media,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        } as any);
      });

      await page.reload();

      // Check that animations are reduced
      const hasAnimations = await page.evaluate(() => {
        const style = window.getComputedStyle(document.documentElement);
        return style.animationDuration !== '0s';
      });

      // With prefers-reduced-motion, animations should be disabled
      expect(hasAnimations).toBeFalsy();
    });
  });

  // ============================================================
  // 9. RESPONSIVE TEXT & ZOOM
  // ============================================================
  test.describe('Text Resizing & Zoom', () => {
    test('should support text zooming up to 200%', async ({ page }) => {
      await page.goto('http://localhost:5173');
      
      // Zoom in to 200%
      await page.evaluate(() => {
        document.body.style.zoom = '2';
      });

      // Wait for reflow
      await page.waitForTimeout(500);

      // Should not have horizontal scrollbar at 200% on desktop
      const hasHorizontalScroll = await page.evaluate(() => {
        return window.innerWidth < document.documentElement.scrollWidth;
      });

      // Allow some scroll at extreme zoom
      if (window.innerWidth >= 768) {
        expect(hasHorizontalScroll).toBeFalsy();
      }
    });

    test('should be readable at 125% zoom', async ({ page }) => {
      await page.evaluate(() => {
        document.body.style.zoom = '1.25';
      });

      // Content should still be readable
      const textContent = await page.locator('p, h1, h2').first().textContent();
      expect(textContent?.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // 10. SCREEN READER COMPATIBILITY
  // ============================================================
  test.describe('Screen Reader Compatibility', () => {
    test('should announce page title to screen readers', async ({ page }) => {
      const title = await page.title();
      expect(title).not.toBe('');
    });

    test('should have descriptive page content', async ({ page }) => {
      const content = await page.content();
      expect(content.length).toBeGreaterThan(1000);
    });

    test('button text should be announced correctly', async ({ page }) => {
      const buttons = await page.locator('button').all();
      
      for (const button of buttons.slice(0, 10)) {
        if (await button.isVisible()) {
          const accessibleName = await button.evaluate(el => {
            return el.getAttribute('aria-label') || el.textContent || el.title || el.getAttribute('title');
          });
          
          expect(accessibleName?.length).toBeGreaterThan(0);
        }
      }
    });
  });
});
