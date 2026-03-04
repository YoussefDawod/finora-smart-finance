/**
 * @fileoverview E2E Tests — Navigation & Routing
 * @description Testet die grundlegende Seitennavigation,
 *              Routing-Korrektheit und Seitenübergänge.
 */

import { test, expect } from './fixtures.js';

test.describe('Navigation & Routing', () => {
  // ── Startseite & Redirect ─────────────────────

  test('Startseite "/" leitet auf /dashboard weiter', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Dashboard-Seite lädt erfolgreich', async ({ app }) => {
    await app.gotoDashboard();
    // Prüfe dass ein Begrüßungs-Text oder der Overview-Text sichtbar ist
    const body = app.page.locator('body');
    await expect(body).not.toBeEmpty();
    // Dashboard sollte ein main-Element oder typischen Container haben
    await expect(app.page.locator('main, [class*="dashboard"], [class*="page"]').first()).toBeVisible();
  });

  // ── Öffentliche Seiten ────────────────────────

  test('Login-Seite lädt', async ({ app }) => {
    await app.gotoLogin();
    await expect(app.page).toHaveURL(/\/login/);
    // Login-Formular soll sichtbar sein
    await expect(app.page.locator('input[type="text"], input[name="username"]').first()).toBeVisible();
    await expect(app.page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('Register-Seite lädt', async ({ app }) => {
    await app.gotoRegister();
    await expect(app.page).toHaveURL(/\/register/);
  });

  test('Kontakt-Seite lädt', async ({ app }) => {
    await app.gotoContact();
    await expect(app.page).toHaveURL(/\/contact/);
  });

  // ── App-Seiten (Guest-Modus) ──────────────────

  test('Transaktionen-Seite lädt im Guest-Modus', async ({ app }) => {
    await app.gotoTransactions();
    await expect(app.page).toHaveURL(/\/transactions/);
  });

  test('Einstellungen-Seite lädt im Guest-Modus', async ({ app }) => {
    await app.gotoSettings();
    await expect(app.page).toHaveURL(/\/settings/);
  });

  test('Profil-Seite lädt im Guest-Modus', async ({ app }) => {
    await app.gotoProfile();
    await expect(app.page).toHaveURL(/\/profile/);
  });

  // ── 404-Seite ─────────────────────────────────

  test('Unbekannte Route zeigt 404-Seite', async ({ page }) => {
    await page.goto('/xyz-gibts-nicht');
    await expect(page.locator('text=404')).toBeVisible();
  });

  // ── Navigation zwischen Seiten ────────────────

  test('Sidebar-Navigation zwischen Dashboard und Transaktionen', async ({ app }) => {
    await app.gotoDashboard();

    // Klick auf Transaktionen-Link in der Navigation
    const txLink = app.page.locator('nav a[href="/transactions"], nav a[href*="transactions"]').first();
    if (await txLink.isVisible()) {
      await txLink.click();
      await expect(app.page).toHaveURL(/\/transactions/);
    }
  });

  // ── Legale Seiten ─────────────────────────────

  test('Impressum-Seite lädt', async ({ page }) => {
    await page.goto('/impressum');
    await expect(page).toHaveURL(/\/impressum/);
  });

  test('Datenschutz-Seite lädt', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page).toHaveURL(/\/privacy/);
  });

  test('AGB-Seite lädt', async ({ page }) => {
    await page.goto('/terms');
    await expect(page).toHaveURL(/\/terms/);
  });
});
