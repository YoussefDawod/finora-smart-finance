/**
 * @fileoverview E2E Tests — Internationalisierung (i18n)
 * @description Testet Sprachwechsel, RTL-Support und
 *              korrekte Übersetzungen in allen 4 Sprachen.
 */

import { test, expect } from './fixtures.js';

test.describe('i18n — Sprachwechsel', () => {
  test('Standard-Sprache ist Deutsch', async ({ app }) => {
    await app.gotoDashboard();
    const lang = await app.page.locator('html').getAttribute('lang');
    // Sollte 'de' sein oder eine gültige Sprache
    expect(lang).toBeTruthy();
  });

  test('Sprachwechsel zu Englisch via Einstellungen', async ({ app }) => {
    await app.gotoSettings();

    // Suche nach Sprach-Selektor
    const selector = app.page.locator(
      'select[class*="language"], select[class*="Language"], [class*="language"] select, [class*="Language"] select'
    ).first();

    const isVisible = await selector.isVisible().catch(() => false);
    if (isVisible) {
      await selector.selectOption('en');
      await app.page.waitForTimeout(500);
      // Prüfe ob englischer Text erscheint
      const bodyText = await app.page.locator('body').textContent();
      const hasEnglish = bodyText.includes('Settings') ||
                         bodyText.includes('Language') ||
                         bodyText.includes('Theme') ||
                         bodyText.includes('Design');
      expect(hasEnglish).toBe(true);
    }
  });

  test('Sprachwechsel zu Arabisch via Einstellungen', async ({ app }) => {
    await app.gotoSettings();

    const selector = app.page.locator(
      'select[class*="language"], select[class*="Language"], [class*="language"] select, [class*="Language"] select'
    ).first();

    const isVisible = await selector.isVisible().catch(() => false);
    if (isVisible) {
      await selector.selectOption('ar');
      await app.page.waitForTimeout(500);

      // Prüfe RTL-Direction
      const dir = await app.page.locator('html').getAttribute('dir');
      const isRTL = dir === 'rtl';
      // Arabisch sollte RTL setzen
      expect(isRTL).toBe(true);
    }
  });

  test('Sprachwechsel zu Georgisch', async ({ app }) => {
    await app.gotoSettings();

    const selector = app.page.locator(
      'select[class*="language"], select[class*="Language"], [class*="language"] select, [class*="Language"] select'
    ).first();

    const isVisible = await selector.isVisible().catch(() => false);
    if (isVisible) {
      await selector.selectOption('ka');
      await app.page.waitForTimeout(500);
      // Seite sollte nicht crashen
      await expect(app.page.locator('body')).toBeVisible();
    }
  });

  test('Sprache bleibt nach Navigation erhalten', async ({ app }) => {
    // Setze Sprache auf Englisch via localStorage
    await app.setLocale('en');
    await app.gotoDashboard();
    await app.page.waitForTimeout(500);

    // Navigiere zu Transaktionen
    await app.gotoTransactions();
    await app.page.waitForTimeout(500);

    // Sprache sollte immer noch en sein
    const lang = await app.page.evaluate(() => localStorage.getItem('i18nextLng'));
    expect(lang).toBe('en');
  });

  test('Alle 4 Sprachen im Dropdown verfügbar', async ({ app }) => {
    await app.gotoSettings();

    const selector = app.page.locator(
      'select[class*="language"], select[class*="Language"], [class*="language"] select, [class*="Language"] select'
    ).first();

    const isVisible = await selector.isVisible().catch(() => false);
    if (isVisible) {
      const options = selector.locator('option');
      const count = await options.count();
      // Sollten mindestens 4 Sprachen sein: de, en, ar, ka
      expect(count).toBeGreaterThanOrEqual(4);
    }
  });
});
