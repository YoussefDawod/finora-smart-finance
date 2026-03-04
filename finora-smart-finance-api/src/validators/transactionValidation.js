/**
 * Transaction Validation Module
 * Zentrale Validierungslogik für alle Transaction-bezogenen Eingaben
 */

// WICHTIG: Diese müssen mit Frontend src/config/categoryConstants.js synchron sein!
const ALLOWED_CATEGORIES = [
  // Ausgaben (Expenses)
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
  // Einnahmen (Income)
  'Gehalt',
  'Freelance',
  'Investitionen',
  'Geschenk',
  'Bonus',
  'Nebenjob',
  'Cashback',
  'Vermietung',
];

/**
 * Validiert eine MongoDB ObjectId
 * @param {string} id - Die zu validierende ID
 * @returns {{valid: boolean, error?: string}}
 */
function validateObjectId(id) {
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return { valid: false, error: 'Ungültige Transaktion ID' };
  }
  return { valid: true };
}

/**
 * Validiert einen Betrag
 * @param {number|string} amount - Der zu validierende Betrag
 * @param {boolean} required - Ob der Betrag erforderlich ist
 * @returns {{valid: boolean, error?: string, amount?: number}}
 */
function validateAmount(amount, required = true) {
  if (amount === undefined || amount === null) {
    if (required) {
      return { valid: false, error: 'Betrag ist erforderlich' };
    }
    return { valid: true };
  }

  const parsed = parseFloat(amount);
  if (isNaN(parsed) || parsed <= 0) {
    return { valid: false, error: 'Betrag muss größer als 0 sein' };
  }

  return { valid: true, amount: parsed };
}

/**
 * Validiert eine Kategorie
 * @param {string} category - Die zu validierende Kategorie
 * @param {boolean} required - Ob die Kategorie erforderlich ist
 * @returns {{valid: boolean, error?: string, category?: string}}
 */
function validateCategory(category, required = true) {
  if (!category) {
    if (required) {
      return { valid: false, error: 'Kategorie ist erforderlich' };
    }
    return { valid: true };
  }

  if (!ALLOWED_CATEGORIES.includes(category)) {
    return { valid: false, error: 'Ungültige Kategorie' };
  }

  return { valid: true, category };
}

/**
 * Validiert eine Beschreibung
 * @param {string} description - Die zu validierende Beschreibung
 * @param {boolean} required - Ob die Beschreibung erforderlich ist
 * @returns {{valid: boolean, error?: string, description?: string}}
 */
function validateDescription(description, required = true) {
  if (!description || !description.trim()) {
    if (required) {
      return { valid: false, error: 'Beschreibung ist erforderlich' };
    }
    return { valid: true };
  }

  const trimmed = description.trim();
  if (trimmed.length < 3) {
    return { valid: false, error: 'Beschreibung muss mindestens 3 Zeichen lang sein' };
  }

  return { valid: true, description: trimmed };
}

/**
 * Validiert den Transaktionstyp
 * @param {string} type - Der zu validierende Typ
 * @param {boolean} required - Ob der Typ erforderlich ist
 * @returns {{valid: boolean, error?: string, type?: string}}
 */
function validateType(type, required = true) {
  if (!type) {
    if (required) {
      return { valid: false, error: 'Typ ist erforderlich' };
    }
    return { valid: true };
  }

  if (!['income', 'expense'].includes(type)) {
    return { valid: false, error: 'Typ muss "income" oder "expense" sein' };
  }

  return { valid: true, type };
}

/**
 * Validiert ein Datum
 * @param {string|Date} date - Das zu validierende Datum
 * @param {boolean} required - Ob das Datum erforderlich ist
 * @returns {{valid: boolean, error?: string, date?: Date}}
 */
function validateDate(date, required = true) {
  if (!date) {
    if (required) {
      return { valid: false, error: 'Datum ist erforderlich (Format: YYYY-MM-DD)' };
    }
    return { valid: true };
  }

  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    return { valid: false, error: 'Ungültiges Datum-Format. Nutze YYYY-MM-DD' };
  }

  return { valid: true, date: parsed };
}

/**
 * Validiert Pagination-Parameter
 * @param {Object} params - Die Query-Parameter
 * @returns {{page: number, limit: number, skip: number}}
 */
function validatePagination(params) {
  const { page = 1, limit = 20 } = params;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  return { page: pageNum, limit: limitNum, skip };
}

/**
 * Validiert und sanitiert Tags (max. 10 Tags, max. 30 Zeichen pro Tag)
 * @param {*} tags - Die zu validierenden Tags
 * @returns {string[]} Sanitisiertes Array
 */
function validateTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
    .map(tag => tag.trim().slice(0, 30))
    .slice(0, 10);
}

/**
 * Validiert Notes (max. 500 Zeichen)
 * @param {*} notes - Die Notes
 * @param {string[]} errors - Error-Array für Fehlermeldungen
 * @returns {string|null} Sanitisierter Wert
 */
function validateNotes(notes, errors) {
  if (notes === undefined || notes === null || notes === '') return null;
  if (typeof notes !== 'string') {
    errors.push('Notes muss ein String sein');
    return null;
  }
  return notes.trim().slice(0, 500) || null;
}

/**
 * Validiert eine vollständige Transaktion für Create
 * @param {Object} data - Die Transaktionsdaten
 * @returns {{valid: boolean, errors?: string[], data?: Object}}
 */
function validateCreateTransaction(data) {
  const errors = [];
  const validated = {};

  const amountResult = validateAmount(data.amount);
  if (!amountResult.valid) errors.push(amountResult.error);
  else validated.amount = amountResult.amount;

  const categoryResult = validateCategory(data.category);
  if (!categoryResult.valid) errors.push(categoryResult.error);
  else validated.category = categoryResult.category;

  const descriptionResult = validateDescription(data.description);
  if (!descriptionResult.valid) errors.push(descriptionResult.error);
  else validated.description = descriptionResult.description;

  const typeResult = validateType(data.type);
  if (!typeResult.valid) errors.push(typeResult.error);
  else validated.type = typeResult.type;

  const dateResult = validateDate(data.date);
  if (!dateResult.valid) errors.push(dateResult.error);
  else validated.date = dateResult.date;

  // Optional fields
  validated.tags = validateTags(data.tags);
  validated.notes = validateNotes(data.notes, errors);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: validated };
}

/**
 * Validiert Update-Daten für eine Transaktion
 * @param {Object} data - Die Update-Daten
 * @returns {{valid: boolean, errors?: string[], data?: Object}}
 */
function validateUpdateTransaction(data) {
  const errors = [];
  const validated = {};

  if (data.amount !== undefined) {
    const amountResult = validateAmount(data.amount);
    if (!amountResult.valid) errors.push(amountResult.error);
    else validated.amount = amountResult.amount;
  }

  if (data.category !== undefined) {
    const categoryResult = validateCategory(data.category);
    if (!categoryResult.valid) errors.push(categoryResult.error);
    else validated.category = categoryResult.category;
  }

  if (data.description !== undefined) {
    const descriptionResult = validateDescription(data.description);
    if (!descriptionResult.valid) errors.push(descriptionResult.error);
    else validated.description = descriptionResult.description;
  }

  if (data.type !== undefined) {
    const typeResult = validateType(data.type);
    if (!typeResult.valid) errors.push(typeResult.error);
    else validated.type = typeResult.type;
  }

  if (data.date !== undefined) {
    const dateResult = validateDate(data.date);
    if (!dateResult.valid) errors.push(dateResult.error);
    else validated.date = dateResult.date;
  }

  if (data.tags !== undefined) {
    validated.tags = validateTags(data.tags);
  }

  if (data.notes !== undefined) {
    validated.notes = validateNotes(data.notes, errors);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: validated };
}

module.exports = {
  ALLOWED_CATEGORIES,
  validateObjectId,
  validateAmount,
  validateCategory,
  validateDescription,
  validateType,
  validateDate,
  validatePagination,
  validateTags,
  validateNotes,
  validateCreateTransaction,
  validateUpdateTransaction,
};
