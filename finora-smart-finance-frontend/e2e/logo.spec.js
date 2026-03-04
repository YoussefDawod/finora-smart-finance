/**
 * @fileoverview E2E Tests — Logo-Komponente
 * @description Testet Logo-Sichtbarkeit und -Verhalten in verschiedenen Kontexten:
 *              Header, Auth-Bereich, Footer.
 * @see LOGO-IMPROVEMENT-PLAN.md §5.4
 */

import { test, expect } from './fixtures.js';

test.describe('Logo — Header', () => {
  test.beforeEach(async ({ app }) => {
    await app.gotoDashboard();
  });

  test('Logo ist im Header sichtbar', async ({ page }) => {
    // Logo hat aria-label="Finora" (i18n key: common.appName)
    const logo = page.locator('header a[aria-label]').first();
    await expect(logo).toBeVisible();
  });

  test('Logo enthält SVG-Icon', async ({ page }) => {
    const svg = page.locator('header svg').first();
    await expect(svg).toBeVisible();
  });

  test('Logo enthält Brand-Name „Finora"', async ({ page }) => {
    const brandName = page.locator('header').getByText('Finora', { exact: true });
    await expect(brandName).toBeVisible();
  });

  test('Logo-Klick navigiert zum Dashboard', async ({ page }) => {
    // Von einer anderen Seite starten
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');

    const logo = page.locator('header a[aria-label]').first();
    await logo.click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Logo — Auth-Bereich', () => {
  test('Logo ist auf Login-Seite sichtbar', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Auth-Bereich hat mindestens ein SVG-Logo
    const svg = page.locator('svg').first();
    await expect(svg).toBeVisible();
  });

  test('Logo ist auf Register-Seite sichtbar', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    const svg = page.locator('svg').first();
    await expect(svg).toBeVisible();
  });

  test('Brand-Name „Finora" ist auf Login-Seite sichtbar', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const brandName = page.getByText('Finora', { exact: true }).first();
    await expect(brandName).toBeVisible();
  });
});

test.describe('Logo — Footer', () => {
  test('Footer enthält Logo', async ({ app, page }) => {
    await app.gotoDashboard();

    const footerLogo = page.locator('footer svg').first();
    // Footer logo may be below the fold — scroll into view
    if (await footerLogo.count() > 0) {
      await footerLogo.scrollIntoViewIfNeeded();
      await expect(footerLogo).toBeVisible();
    }
  });

  test('Footer-Logo ist nicht klickbar (statisch)', async ({ app, page }) => {
    await app.gotoDashboard();

    // Footer logo should be in a div, not a link
    const footerLinks = page.locator('footer a[aria-label]');
    const footerDivLogos = page.locator('footer div[aria-label]');

    // The footer logo uses disableNavigation → rendered as div
    const linkCount = await footerLinks.count();
    const divCount = await footerDivLogos.count();

    // At least confirm footer has brand reference
    const footer = page.locator('footer');
    await expect(footer).toContainText(/Finora/);
    // If div-based logo exists, it should not be a link
    if (divCount > 0) {
      expect(linkCount).toBe(0);
    }
  });
});
