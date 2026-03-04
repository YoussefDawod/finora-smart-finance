/**
 * @fileoverview E2E Tests — Auth-Flows
 * @description Testet Login-Formular, Registrierung, Validierung
 *              und Auth-bezogene Navigation.
 */

import { test, expect } from './fixtures.js';

test.describe('Auth — Login', () => {
  test.beforeEach(async ({ app }) => {
    await app.gotoLogin();
  });

  // ── Formular-Rendering ────────────────────────

  test('zeigt Login-Formular mit allen Feldern', async ({ page }) => {
    const usernameInput = page.locator('input[type="text"], input[name="username"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"]').first();

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();
  });

  test('zeigt Passwort-Vergessen-Link', async ({ page }) => {
    const forgotLink = page.locator('a[href*="forgot-password"]');
    await expect(forgotLink).toBeVisible();
  });

  test('zeigt Link zur Registrierung', async ({ page }) => {
    const registerLink = page.locator('a[href*="register"]');
    await expect(registerLink).toBeVisible();
  });

  // ── Client-Validierung ────────────────────────

  test('Submit-Button ist deaktiviert bei leerem Formular', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"]').first();
    await expect(submitBtn).toBeDisabled();
  });

  test('zeigt Fehler bei zu kurzem Benutzernamen', async ({ page }) => {
    const usernameInput = page.locator('input[type="text"], input[name="username"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await usernameInput.fill('ab');
    await passwordInput.fill('test1234');
    await page.waitForTimeout(300);

    // Button sollte jetzt klickbar sein oder Inline-Fehler sichtbar
    const error = page.locator('[class*="error"], [class*="Error"]');
    const submitBtn = page.locator('button[type="submit"]').first();

    const isDisabled = await submitBtn.isDisabled();
    const hasError = (await error.count()) > 0;
    // Entweder der Button bleibt deaktiviert oder ein Fehler ist sichtbar
    expect(isDisabled || hasError).toBe(true);
  });

  // ── Navigation ────────────────────────────────

  test('navigiert von Login zur Registrierung', async ({ page }) => {
    const registerLink = page.locator('a[href*="register"]').first();
    await registerLink.click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('navigiert von Login zu Passwort-Vergessen', async ({ page }) => {
    const forgotLink = page.locator('a[href*="forgot-password"]').first();
    await forgotLink.click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });
});

test.describe('Auth — Registrierung', () => {
  test.beforeEach(async ({ app }) => {
    await app.gotoRegister();
  });

  test('zeigt Registrierungs-Formular', async ({ page }) => {
    // Multi-Step: Step 1 hat Username + Email
    const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
    await expect(usernameInput).toBeVisible();
  });

  test('zeigt Link zur Anmeldung', async ({ page }) => {
    const loginLink = page.locator('a[href*="login"]');
    await expect(loginLink).toBeVisible();
  });

  test('navigiert von Registrierung zur Anmeldung', async ({ page }) => {
    const loginLink = page.locator('a[href*="login"]').first();
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Auth — Passwort vergessen', () => {
  test('zeigt Passwort-Vergessen-Formular', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');

    // Sollte ein Email/Username-Feld haben
    const input = page.locator('input[type="email"], input[type="text"]').first();
    await expect(input).toBeVisible();
  });
});
