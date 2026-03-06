const { validateEmail, validatePassword } = require('./authValidation');

// IANA-Zeitzonen-Set für Timezone-Validierung (L-2)
const VALID_TIMEZONES = new Set(Intl.supportedValuesOf('timeZone'));
VALID_TIMEZONES.add('UTC'); // UTC wird von Intl nicht gelistet, ist aber gültig

/**
 * Wrapper um die zentrale validatePassword aus authValidation.
 * Gibt ein Array von Fehlern zurück (leer = valide) für Kompatibilität
 * mit der Error-Aggregation in validatePasswordChangeInput.
 * @param {string} password
 * @returns {string[]} Array von Fehlerstrings
 */
function validatePasswordStrength(password) {
  if (password === undefined || password === null) {
    return [];
  }
  const result = validatePassword(password);
  return result.valid ? [] : [result.error];
}

function validatePasswordChangeInput({ currentPassword, newPassword, confirmPassword }) {
  const errors = [];

  if (!currentPassword) errors.push('Aktuelles Passwort erforderlich');
  if (!newPassword) errors.push('Neues Passwort erforderlich');
  if (!confirmPassword) errors.push('Passwort-Bestätigung erforderlich');

  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    errors.push('Passwörter stimmen nicht überein');
  }

  if (newPassword) {
    errors.push(...validatePasswordStrength(newPassword));
  }

  return { errors };
}

function validateEmailChangeInput({ newEmail, password }) {
  const errors = [];
  let normalizedEmail = undefined;

  if (!newEmail) {
    errors.push('Neue Email erforderlich');
  } else {
    const emailValidation = validateEmail(newEmail);
    if (!emailValidation.valid) {
      errors.push(emailValidation.error || 'Email-Format ungültig');
    } else {
      normalizedEmail = emailValidation.email;
    }
  }

  if (!password) {
    errors.push('Passwort erforderlich zur Bestätigung');
  }

  return { errors, email: normalizedEmail };
}

function validateProfileUpdate(body = {}) {
  const { name, lastName, phone, avatar } = body;
  const errors = [];
  const updates = {};

  if (name !== undefined) {
    if (typeof name !== 'string') {
      errors.push('Name muss ein String sein');
    } else {
      const trimmed = name.trim();
      if (trimmed.length < 3) errors.push('Name muss mind. 3 Zeichen haben');
      else if (trimmed.length > 50) errors.push('Name darf max. 50 Zeichen haben');
      else updates.name = trimmed;
    }
  }

  if (lastName !== undefined) {
    if (typeof lastName !== 'string') {
      errors.push('LastName muss ein String sein');
    } else if (lastName.trim().length > 50) {
      errors.push('LastName darf max. 50 Zeichen haben');
    } else {
      updates.lastName = lastName.trim();
    }
  }

  if (phone !== undefined) {
    if (typeof phone !== 'string') {
      errors.push('Phone muss ein String sein');
    } else if (phone.trim().length > 20) {
      errors.push('Phone darf max. 20 Zeichen haben');
    } else {
      updates.phone = phone.trim() || null;
    }
  }

  if (avatar !== undefined) {
    if (typeof avatar !== 'string' && avatar !== null) {
      errors.push('Avatar muss ein String sein');
    } else if (avatar && avatar.length > 2048) {
      errors.push('Avatar-URL darf max. 2048 Zeichen haben');
    } else {
      updates.avatar = avatar || null;
    }
  }

  return { errors, updates };
}

function validateNotificationCategories(notificationCategories, errors) {
  if (notificationCategories === undefined) return undefined;

  if (typeof notificationCategories !== 'object') {
    errors.push('notificationCategories muss ein Objekt sein');
    return undefined;
  }

  const validCategories = ['security', 'transactions', 'reports', 'alerts'];
  const sanitized = {};

  for (const [key, value] of Object.entries(notificationCategories)) {
    if (!validCategories.includes(key)) {
      errors.push(`Ungültige Kategorie: ${key}`);
      continue;
    }
    if (typeof value !== 'boolean') {
      errors.push(`notificationCategories.${key} muss ein Boolean sein`);
      continue;
    }
    sanitized[key] = value;
  }

  return sanitized;
}

function validateBudget(budget, errors) {
  if (budget === undefined) return undefined;

  if (typeof budget !== 'object') {
    errors.push('budget muss ein Objekt sein');
    return undefined;
  }

  const sanitized = {};

  if (budget.monthlyLimit !== undefined) {
    if (typeof budget.monthlyLimit !== 'number' || budget.monthlyLimit < 0) {
      errors.push('budget.monthlyLimit muss eine positive Zahl sein');
    } else {
      sanitized.monthlyLimit = budget.monthlyLimit;
    }
  }

  if (budget.alertThreshold !== undefined) {
    if (
      typeof budget.alertThreshold !== 'number' ||
      budget.alertThreshold < 0 ||
      budget.alertThreshold > 100
    ) {
      errors.push('budget.alertThreshold muss zwischen 0 und 100 liegen');
    } else {
      sanitized.alertThreshold = budget.alertThreshold;
    }
  }

  if (budget.categoryLimits !== undefined) {
    if (
      typeof budget.categoryLimits !== 'object' ||
      budget.categoryLimits === null ||
      Array.isArray(budget.categoryLimits)
    ) {
      errors.push('budget.categoryLimits muss ein Objekt sein');
    } else {
      const entries = Object.entries(budget.categoryLimits);
      if (entries.length > 30) {
        errors.push('budget.categoryLimits darf maximal 30 Einträge haben');
      } else {
        const validLimits = {};
        for (const [key, value] of entries) {
          if (typeof key !== 'string' || key.length === 0 || key.length > 50) {
            errors.push(
              `budget.categoryLimits: Ungültiger Schlüssel "${String(key).slice(0, 50)}"`
            );
            continue;
          }
          if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
            errors.push(`budget.categoryLimits.${key} muss eine positive Zahl sein`);
            continue;
          }
          if (value > 1000000) {
            errors.push(`budget.categoryLimits.${key} darf maximal 1.000.000 betragen`);
            continue;
          }
          validLimits[key] = value;
        }
        sanitized.categoryLimits = validLimits;
      }
    }
  }

  return sanitized;
}

function validatePreferencesInput(body = {}) {
  const {
    theme,
    currency,
    timezone,
    language,
    dateFormat,
    emailNotifications,
    notificationCategories,
    budget,
  } = body;

  const errors = [];
  const updates = {};

  const validThemes = ['light', 'dark', 'system'];
  const validCurrencies = ['USD', 'EUR', 'GBP', 'CHF', 'JPY'];
  const validLanguages = ['en', 'de', 'fr', 'ar', 'ka'];
  const validDateFormats = ['iso', 'dmy'];

  if (theme !== undefined) {
    if (!validThemes.includes(theme)) {
      errors.push(`Theme muss einer dieser Werte sein: ${validThemes.join(', ')}`);
    } else {
      updates.theme = theme;
    }
  }

  if (currency !== undefined) {
    if (!validCurrencies.includes(currency)) {
      errors.push(`Währung muss einer dieser Werte sein: ${validCurrencies.join(', ')}`);
    } else {
      updates.currency = currency;
    }
  }

  if (timezone !== undefined) {
    if (typeof timezone !== 'string') {
      errors.push('Timezone muss ein String sein');
    } else if (!VALID_TIMEZONES.has(timezone)) {
      errors.push(
        'Ungültige Timezone. Bitte eine gültige IANA-Timezone verwenden (z.B. Europe/Berlin)'
      );
    } else {
      updates.timezone = timezone;
    }
  }

  if (language !== undefined) {
    if (!validLanguages.includes(language)) {
      errors.push(`Sprache muss einer dieser Werte sein: ${validLanguages.join(', ')}`);
    } else {
      updates.language = language;
    }
  }

  if (dateFormat !== undefined) {
    if (!validDateFormats.includes(dateFormat)) {
      errors.push(`Datumsformat muss einer dieser Werte sein: ${validDateFormats.join(', ')}`);
    } else {
      updates.dateFormat = dateFormat;
    }
  }

  if (emailNotifications !== undefined) {
    if (typeof emailNotifications !== 'boolean') {
      errors.push('emailNotifications muss ein Boolean sein');
    } else {
      updates.emailNotifications = emailNotifications;
    }
  }

  const sanitizedNotificationCategories = validateNotificationCategories(
    notificationCategories,
    errors
  );
  if (sanitizedNotificationCategories !== undefined) {
    updates.notificationCategories = sanitizedNotificationCategories;
  }

  const sanitizedBudget = validateBudget(budget, errors);
  if (sanitizedBudget !== undefined) {
    updates.budget = sanitizedBudget;
  }

  return { errors, updates };
}

module.exports = {
  validatePasswordStrength,
  validatePasswordChangeInput,
  validateEmailChangeInput,
  validateProfileUpdate,
  validatePreferencesInput,
};
