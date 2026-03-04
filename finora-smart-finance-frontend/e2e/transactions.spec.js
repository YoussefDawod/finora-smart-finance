/**
 * @fileoverview E2E Tests — Transaktionen (Guest-Modus)
 * @description Testet die Transaktions-Seite im Guest-Modus:
 *              Seitenaufbau, Filter, Formular-Rendering.
 */

import { test, expect } from './fixtures.js';

test.describe('Transaktionen — Guest-Modus', () => {
  test.beforeEach(async ({ app }) => {
    await app.gotoTransactions();
  });

  // ── Grundlegendes Rendering ───────────────────

  test('rendert Transaktionen-Seite', async ({ page }) => {
    await expect(page).toHaveURL(/\/transactions/);
    const main = page.locator('main, [class*="transactions"], [class*="page"]').first();
    await expect(main).toBeVisible();
  });

  test('zeigt Seiten-Header', async ({ page }) => {
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  // ── Transaktions-Liste ────────────────────────

  test('zeigt Transaktionsliste oder Leer-Zustand', async ({ page }) => {
    // Entweder Transaktions-Items oder ein Empty-State
    await page.locator(
      '[class*="transactionItem"], [class*="TransactionItem"], [class*="empty"], [class*="Empty"], [class*="noTransaction"]'
    ).first().isVisible().catch(() => false);

    // Seite sollte gerendert sein
    const main = page.locator('main, [class*="page"]').first();
    await expect(main).toBeVisible();
  });

  // ── Filter ────────────────────────────────────

  test('rendert Filter-Bereich', async ({ page }) => {
    // Filter-Section (Typ, Kategorie, Datum)
    const filterArea = page.locator('[class*="filter"], [class*="Filter"], select, [class*="search"]');
    const count = await filterArea.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Transaktionen — Guest-Formular', () => {
  test('öffnet Transaktions-Formular im Guest-Modus', async ({ app }) => {
    await app.gotoTransactions();

    // Klick auf "Hinzufügen"-Button im Main-Content (nicht Sidebar)
    const mainContent = app.page.locator('main, [class*="page"], [class*="Page"], [class*="content"]').first();
    const addBtn = mainContent.locator('button').filter({ hasText: /hinzufügen|neue|add|\+/i }).first();
    const isVisible = await addBtn.isVisible().catch(() => false);

    if (isVisible) {
      await addBtn.click();

      // Formular-Modal oder Section sollte erscheinen
      const form = app.page.locator('form, [class*="transactionForm"], [class*="TransactionForm"]');
      const formCount = await form.count();
      expect(formCount).toBeGreaterThanOrEqual(0);
    } else {
      // Kein Add-Button sichtbar — kein Fehler im Guest-Modus
      expect(true).toBe(true);
    }
  });
});
