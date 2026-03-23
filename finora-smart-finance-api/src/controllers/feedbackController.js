/**
 * Feedback Controller
 * Request/Response-Handling für Feedback-Endpoints (User + Public)
 */

const feedbackService = require('../services/feedbackService');
const { sendError, handleServerError } = require('../utils/responseHelper');
const {
  validateCreateFeedback,
  validateConsentUpdate,
} = require('../validators/feedbackValidation');

// ============================================
// USER-ENDPOINTS (auth required)
// ============================================

/**
 * POST /api/v1/feedback — Feedback erstellen
 */
async function createFeedback(req, res) {
  try {
    const { rating, text, consentGiven } = req.body || {};

    const validation = validateCreateFeedback({ rating, text });
    if (!validation.valid) {
      return sendError(res, req, {
        error: validation.errors.join(', '),
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    }

    const result = await feedbackService.createFeedback({
      userId: req.user._id,
      rating,
      text,
      consentGiven,
    });

    if (result.error) {
      return sendError(res, req, { error: result.error, code: result.code, status: 409 });
    }

    res.status(201).json({ success: true, data: result.feedback });
  } catch (error) {
    handleServerError(res, req, 'Feedback: Create', error);
  }
}

/**
 * GET /api/v1/feedback/mine — Eigenes Feedback abrufen
 */
async function getMyFeedback(req, res) {
  try {
    const feedback = await feedbackService.getMyFeedback(req.user._id);
    res.json({ success: true, data: feedback });
  } catch (error) {
    handleServerError(res, req, 'Feedback: Get mine', error);
  }
}

/**
 * PATCH /api/v1/feedback/mine/consent — Consent ändern
 */
async function updateMyConsent(req, res) {
  try {
    const validation = validateConsentUpdate(req.body || {});
    if (!validation.valid) {
      return sendError(res, req, {
        error: validation.errors.join(', '),
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    }

    const result = await feedbackService.updateMyConsent(req.user._id, req.body.consentGiven);

    if (result.error) {
      const status = result.code === 'FEEDBACK_NOT_FOUND' ? 404 : 400;
      return sendError(res, req, { error: result.error, code: result.code, status });
    }

    res.json({ success: true, data: result.feedback });
  } catch (error) {
    handleServerError(res, req, 'Feedback: Update consent', error);
  }
}

/**
 * DELETE /api/v1/feedback/mine — Eigenes Feedback löschen
 */
async function deleteMyFeedback(req, res) {
  try {
    const result = await feedbackService.deleteMyFeedback(req.user._id);

    if (result.error) {
      return sendError(res, req, { error: result.error, code: result.code, status: 404 });
    }

    res.json({ success: true, message: 'Feedback gelöscht' });
  } catch (error) {
    handleServerError(res, req, 'Feedback: Delete mine', error);
  }
}

// ============================================
// PUBLIC-ENDPOINTS (kein auth)
// ============================================

/**
 * GET /api/v1/feedback/public — Veröffentlichte Testimonials
 */
async function getPublicFeedbacks(req, res) {
  try {
    const feedbacks = await feedbackService.getPublicFeedbacks();
    res.json({ success: true, data: feedbacks });
  } catch (error) {
    handleServerError(res, req, 'Feedback: Get public', error);
  }
}

/**
 * GET /api/v1/feedback/count — Feedback-Anzahl (für Motivations-Texte)
 */
async function getFeedbackCount(req, res) {
  try {
    const count = await feedbackService.getFeedbackCount();
    res.json({ success: true, data: { count } });
  } catch (error) {
    handleServerError(res, req, 'Feedback: Get count', error);
  }
}

module.exports = {
  createFeedback,
  getMyFeedback,
  updateMyConsent,
  deleteMyFeedback,
  getPublicFeedbacks,
  getFeedbackCount,
};
