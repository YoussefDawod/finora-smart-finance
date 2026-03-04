/**
 * @fileoverview E2E Test Fixtures & Helpers
 * @description Gemeinsame Test-Fixtures für alle E2E-Tests.
 *              Stellt Hilfsfunktionen für Navigation, Locale-Wechsel,
 *              Guest-Modus und Auth-Flows bereit.
 */

import { test as base, expect } from '@playwright/test';

/**
 * Erweiterte Test-Fixture mit App-spezifischen Helfern
 */
export const test = base.extend({
  /**
   * App-Helper: Navigation, Locale, Auth-Shortcuts
   */
  app: async ({ page }, use) => {
    // Cookie-Consent vorab akzeptieren, damit der Banner keine Klicks blockiert
    await page.addInitScript(() => {
      localStorage.setItem(
        'cookie-consent-preferences',
        JSON.stringify({ essential: true, newsletter: false })
      );
    });

    const app = {
      page,

      /** Navigiert zum Dashboard (Startseite) */
      async gotoDashboard() {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
      },

      /** Navigiert zur Transaktions-Seite */
      async gotoTransactions() {
        await page.goto('/transactions');
        await page.waitForLoadState('networkidle');
      },

      /** Navigiert zur Einstellungen-Seite */
      async gotoSettings() {
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');
      },

      /** Navigiert zur Login-Seite */
      async gotoLogin() {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
      },

      /** Navigiert zur Register-Seite */
      async gotoRegister() {
        await page.goto('/register');
        await page.waitForLoadState('networkidle');
      },

      /** Navigiert zur Kontakt-Seite */
      async gotoContact() {
        await page.goto('/contact');
        await page.waitForLoadState('networkidle');
      },

      /** Navigiert zur Profil-Seite */
      async gotoProfile() {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');
      },

      /**
       * Setzt die Sprache via localStorage (Deutsch als Standard)
       * @param {'de'|'en'|'ar'|'ka'} lang
       */
      async setLocale(lang = 'de') {
        await page.addInitScript((locale) => {
          localStorage.setItem('i18nextLng', locale);
        }, lang);
      },

      /** Wartet auf i18n-Initialisierung (kein i18n-Key als Textinhalt) */
      async waitForI18n() {
        // Warte bis mindestens ein übersetzter Text sichtbar ist
        await page.waitForFunction(() => {
          const body = document.body?.textContent || '';
          // i18n-Keys enthalten Punkte — übersetzte Texte meist nicht
          return body.length > 50 && !body.includes('dashboard.greeting.');
        }, { timeout: 10_000 });
      },

      /** Prüft ob ein Toast sichtbar ist */
      async expectToast(text) {
        const toast = page.locator('[class*="toast"]', { hasText: text });
        await expect(toast).toBeVisible({ timeout: 5000 });
      },

      /** Wartet auf Seitenübergang (Animation) */
      async waitForPageTransition() {
        await page.waitForTimeout(300);
      },
    };

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(app);
  },
});

export { expect };
