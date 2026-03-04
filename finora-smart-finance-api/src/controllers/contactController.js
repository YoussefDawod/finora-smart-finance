/**
 * Contact Controller
 * Request/Response-Handling für Kontaktformular.
 *
 * Express 5 leitet Fehler aus async-Handlern automatisch
 * an die Error-Middleware weiter – kein try/catch nötig.
 */

const logger = require('../utils/logger');
const { sendError } = require('../utils/responseHelper');

// ============================================
// POST /api/contact
// ============================================
async function submitContact(req, res) {
  const { name, email, category, message } = req.body;

  // ── Validierung ─────────────────────────────
  if (!name || !email || !message) {
    return sendError(res, req, {
      error: 'Name, Email and Message are required',
      code: 'VALIDATION_ERROR',
      status: 400,
    });
  }

  // Typ- und Längen-Validierung
  if (typeof name !== 'string' || name.trim().length > 100) {
    return sendError(res, req, {
      error: 'Name darf max. 100 Zeichen haben',
      code: 'VALIDATION_ERROR',
      status: 400,
    });
  }
  if (typeof email !== 'string' || email.trim().length > 254) {
    return sendError(res, req, {
      error: 'Email darf max. 254 Zeichen haben',
      code: 'VALIDATION_ERROR',
      status: 400,
    });
  }
  if (typeof message !== 'string' || message.trim().length > 2000) {
    return sendError(res, req, {
      error: 'Nachricht darf max. 2000 Zeichen haben',
      code: 'VALIDATION_ERROR',
      status: 400,
    });
  }
  if (
    category !== undefined &&
    category !== null &&
    (typeof category !== 'string' || category.length > 50)
  ) {
    return sendError(res, req, {
      error: 'Kategorie darf max. 50 Zeichen haben',
      code: 'VALIDATION_ERROR',
      status: 400,
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return sendError(res, req, {
      error: 'Invalid email format',
      code: 'INVALID_EMAIL',
      status: 400,
    });
  }

  // ── Verarbeitung ────────────────────────────
  const safeCategory = (category || 'general').slice(0, 50);
  const safeEmail = email.trim().slice(0, 100);
  logger.info(`Contact form submission: ${safeCategory} from ${safeEmail}`);

  // E-Mail senden (falls Service konfiguriert)
  try {
    const emailService = require('../utils/emailService');
    if (emailService?.sendContactEmail) {
      await emailService.sendContactEmail({ name, email, category, message });
    }
  } catch {
    logger.info('Contact email service not configured, request logged only');
  }

  return res.status(200).json({
    success: true,
    message: 'Contact request received',
  });
}

module.exports = { submitContact };
