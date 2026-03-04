/**
 * HTML Entity Encoding — XSS-Schutz für E-Mail-Templates
 *
 * Escapes alle HTML-relevanten Sonderzeichen, damit User-Input
 * (Name, E-Mail, Beschreibung etc.) sicher in HTML-Templates
 * interpoliert werden kann.
 *
 * @param {string} str - Unescapter String (z.B. Benutzername)
 * @returns {string} Escapeter String (sichere HTML-Ausgabe)
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { escapeHtml };
