/**
 * Feedback Routes
 * User-Feedback + öffentliche Testimonials
 */

const express = require('express');
const router = express.Router();
const { apiLimiter } = require('../middleware/rateLimiter');
const authMiddleware = require('../middleware/authMiddleware');
const feedbackController = require('../controllers/feedbackController');

// ============================================
// PUBLIC ROUTES (kein Auth)
// ============================================

// GET /api/v1/feedback/public — Veröffentlichte Testimonials
router.get('/public', apiLimiter, feedbackController.getPublicFeedbacks);

// GET /api/v1/feedback/count — Feedback-Anzahl
router.get('/count', apiLimiter, feedbackController.getFeedbackCount);

// ============================================
// AUTH-REQUIRED ROUTES
// ============================================

// POST /api/v1/feedback — Feedback erstellen
router.post('/', authMiddleware, feedbackController.createFeedback);

// GET /api/v1/feedback/mine — Eigenes Feedback abrufen
router.get('/mine', authMiddleware, feedbackController.getMyFeedback);

// PATCH /api/v1/feedback/mine/consent — Consent ändern
router.patch('/mine/consent', authMiddleware, feedbackController.updateMyConsent);

// DELETE /api/v1/feedback/mine — Eigenes Feedback löschen
router.delete('/mine', authMiddleware, feedbackController.deleteMyFeedback);

module.exports = router;
