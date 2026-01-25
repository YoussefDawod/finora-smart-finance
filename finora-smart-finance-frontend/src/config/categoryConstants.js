/**
 * @fileoverview Zentrale Kategorie-Definitionen
 * @description Single Source of Truth für alle Transaktionskategorien
 * WICHTIG: Diese Kategorien MÜSSEN mit dem Backend synchron sein!
 * Backend: finora-smart-finance-api/src/models/Transaction.js & src/routes/transactions.js
 */

// ============================================================================
// EINNAHMEN-KATEGORIEN (Income Categories)
// ============================================================================
export const INCOME_CATEGORIES = [
  'Gehalt',
  'Freelance',
  'Investitionen',
  'Geschenk',
  'Bonus',
  'Nebenjob',
  'Cashback',
  'Vermietung',
  'Sonstiges',
];

// ============================================================================
// AUSGABEN-KATEGORIEN (Expense Categories)
// ============================================================================
export const EXPENSE_CATEGORIES = [
  'Lebensmittel',
  'Transport',
  'Unterhaltung',
  'Miete',
  'Versicherung',
  'Gesundheit',
  'Bildung',
  'Kleidung',
  'Reisen',
  'Elektronik',
  'Restaurant',
  'Sport',
  'Haushalt',
  'Sonstiges',
];

// ============================================================================
// ALLE KATEGORIEN (kombiniert, ohne Duplikate)
// ============================================================================
export const ALL_CATEGORIES = [
  // Einnahmen
  'Gehalt',
  'Freelance',
  'Investitionen',
  'Geschenk',
  'Bonus',
  'Nebenjob',
  'Cashback',
  'Vermietung',
  // Ausgaben
  'Lebensmittel',
  'Transport',
  'Unterhaltung',
  'Miete',
  'Versicherung',
  'Gesundheit',
  'Bildung',
  'Kleidung',
  'Reisen',
  'Elektronik',
  'Restaurant',
  'Sport',
  'Haushalt',
  // Sonstiges (für beide Typen)
  'Sonstiges',
];

// ============================================================================
// KATEGORIEN NACH TYP (für Zugriff über Type-String)
// ============================================================================
export const CATEGORIES_BY_TYPE = {
  income: INCOME_CATEGORIES,
  expense: EXPENSE_CATEGORIES,
};

/**
 * Hilfsfunktion: Kategorien für einen bestimmten Typ holen
 * @param {string} type - 'income' oder 'expense'
 * @returns {string[]} - Array der Kategorien
 */
export const getCategoriesForType = (type) => {
  return CATEGORIES_BY_TYPE[type] || ALL_CATEGORIES;
};

/**
 * Hilfsfunktion: Prüfen ob eine Kategorie zu einem Typ gehört
 * @param {string} category - Kategoriename
 * @param {string} type - 'income' oder 'expense'
 * @returns {boolean}
 */
export const isCategoryOfType = (category, type) => {
  const categories = CATEGORIES_BY_TYPE[type];
  return categories ? categories.includes(category) : false;
};

/**
 * Hilfsfunktion: Typ einer Kategorie ermitteln
 * @param {string} category - Kategoriename
 * @returns {string|null} - 'income', 'expense' oder null
 */
export const getTypeForCategory = (category) => {
  if (INCOME_CATEGORIES.includes(category)) return 'income';
  if (EXPENSE_CATEGORIES.includes(category)) return 'expense';
  return null;
};
