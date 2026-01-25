/**
 * Auth Validation Module
 * Zentrale Validierungslogik für alle Auth-bezogenen Eingaben
 */

/**
 * Validiert einen Benutzernamen
 * @param {string} name - Der zu validierende Name
 * @returns {{valid: boolean, error?: string, name?: string}}
 */
function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name ist erforderlich' };
  }
  const trimmed = name.trim();
  if (trimmed.length < 3) {
    return { valid: false, error: 'Name muss mindestens 3 Zeichen haben' };
  }
  if (trimmed.length > 50) {
    return { valid: false, error: 'Name darf maximal 50 Zeichen haben' };
  }
  if (!/^[a-zA-ZäöüÄÖÜß0-9\s-]+$/.test(trimmed)) {
    return { valid: false, error: 'Name darf nur Buchstaben, Zahlen, Leerzeichen und Bindestriche enthalten' };
  }
  return { valid: true, name: trimmed };
}

/**
 * Validiert ein Passwort
 * @param {string} password - Das zu validierende Passwort
 * @returns {{valid: boolean, error?: string}}
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Passwort ist erforderlich' };
  }
  if (password.length < 8) {
    return { valid: false, error: 'Passwort muss mindestens 8 Zeichen haben' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Passwort muss mindestens einen Großbuchstaben enthalten' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Passwort muss mindestens eine Zahl enthalten' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=[/\]`~]/.test(password)) {
    return { valid: false, error: 'Passwort muss mindestens ein Sonderzeichen enthalten' };
  }
  return { valid: true };
}

/**
 * Validiert eine E-Mail-Adresse
 * @param {string} email - Die zu validierende E-Mail
 * @returns {{valid: boolean, error?: string, email?: string}}
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email ist erforderlich' };
  }
  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { valid: false, error: 'Ungültige Email-Adresse' };
  }
  return { valid: true, email: trimmed };
}

/**
 * Validiert optionale E-Mail (für Registrierung ohne Email)
 * @param {string|null|undefined} email - Die optionale E-Mail
 * @returns {{valid: boolean, error?: string, email?: string|null}}
 */
function validateOptionalEmail(email) {
  if (!email || !email.trim()) {
    return { valid: true, email: null };
  }
  return validateEmail(email);
}

module.exports = {
  validateName,
  validatePassword,
  validateEmail,
  validateOptionalEmail,
};
