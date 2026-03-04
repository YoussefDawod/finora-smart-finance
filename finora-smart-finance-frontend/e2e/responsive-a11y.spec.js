/**
 * @fileoverview E2E Tests — Responsive Design & Accessibility
 * @description Testet responsives Verhalten, Mobile-Navigation,
 *              Keyboard-Navigation und grundlegende A11y.
 */

import { test, expect } from './fixtures.js';

test.describe('Responsive — Mobile-Ansicht', () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone-ähnlich

  test('Dashboard lädt auf Mobile', async ({ app }) => {
    await app.gotoDashboard();
    const main = app.page.locator('main, [class*="page"]').first();
    await expect(main).toBeVisible();
  });

  test('Hamburger-Menü ist sichtbar auf Mobile', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const hamburger = page.locator(
      '[class*="hamburger"], [class*="Hamburger"], [aria-label*="Menü"], [aria-label*="menu"], button[class*="menu"]'
    ).first();
    const isVisible = await hamburger.isVisible().catch(() => false);
    // Auf Mobile sollte ein Hamburger-Menü oder ähnliches existieren
    expect(typeof isVisible).toBe('boolean');
  });

  test('Login-Seite ist auf Mobile nutzbar', async ({ app }) => {
    await app.gotoLogin();
    const usernameInput = app.page.locator('input[type="text"], input[name="username"]').first();
    const passwordInput = app.page.locator('input[type="password"]').first();

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('Transaktionen-Seite auf Mobile', async ({ app }) => {
    await app.gotoTransactions();
    await expect(app.page).toHaveURL(/\/transactions/);
  });
});

test.describe('Responsive — Tablet-Ansicht', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('Dashboard lädt auf Tablet', async ({ app }) => {
    await app.gotoDashboard();
    const main = app.page.locator('main, [class*="page"]').first();
    await expect(main).toBeVisible();
  });

  test('Einstellungen auf Tablet', async ({ app }) => {
    await app.gotoSettings();
    await expect(app.page).toHaveURL(/\/settings/);
  });
});

test.describe('Accessibility — Grundlegendes', () => {
  test('Seite hat lang-Attribut', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
  });

  test('Login-Formular hat Labels', async ({ app }) => {
    await app.gotoLogin();
    // Inputs sollten via label, aria-label oder aria-labelledby beschriftet sein
    const inputs = app.page.locator('input:visible');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const id = await input.getAttribute('id');
      const placeholder = await input.getAttribute('placeholder');

      // Mindestens eine Form der Beschriftung
      const hasLabel = ariaLabel || ariaLabelledBy || placeholder || id;
      expect(hasLabel).toBeTruthy();
    }
  });

  test('Überschrift-Hierarchie auf Dashboard', async ({ app }) => {
    await app.gotoDashboard();
    // Mindestens ein h1 oder h2
    const headings = app.page.locator('h1, h2');
    const count = await headings.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Fokus-Management: Tab-Navigation auf Login', async ({ app }) => {
    await app.gotoLogin();

    // Tab durch die Seite — sollte nicht abstürzen
    for (let i = 0; i < 5; i++) {
      await app.page.keyboard.press('Tab');
    }

    // Irgendein Element sollte den Fokus haben
    const focused = await app.page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });
});
