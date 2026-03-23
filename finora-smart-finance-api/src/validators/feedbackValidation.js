/**
 * Feedback Validation Module
 * Validierungslogik für Feedback-bezogene Eingaben
 */

/**
 * Validiert Feedback-Erstellung
 * @param {Object} data - { rating, text }
 * @returns {{ valid: boolean, errors?: string[] }}
 */
function validateCreateFeedback(data) {
  const errors = [];

  if (data.rating === undefined || data.rating === null) {
    errors.push('Bewertung ist erforderlich');
  } else {
    const rating = Number(data.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      errors.push('Bewertung muss eine ganze Zahl zwischen 1 und 5 sein');
    }
  }

  if (data.text !== undefined && data.text !== null && typeof data.text !== 'string') {
    errors.push('Feedback-Text muss ein String sein');
  }

  if (typeof data.text === 'string' && data.text.length > 1000) {
    errors.push('Feedback-Text darf maximal 1000 Zeichen haben');
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

/**
 * Validiert Consent-Änderung
 * @param {Object} data - { consentGiven }
 * @returns {{ valid: boolean, errors?: string[] }}
 */
function validateConsentUpdate(data) {
  const errors = [];

  if (data.consentGiven === undefined || data.consentGiven === null) {
    errors.push('consentGiven ist erforderlich');
  } else if (typeof data.consentGiven !== 'boolean') {
    errors.push('consentGiven muss ein Boolean sein');
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

module.exports = {
  validateCreateFeedback,
  validateConsentUpdate,
};
