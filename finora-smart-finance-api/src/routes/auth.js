/**
 * Auth Routes
 * Schlanke Router-Datei - nur Routen-Definitionen
 */

const express = require('express');
const router = express.Router();
const {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  resendVerificationLimiter,
  apiLimiter,
  sensitiveOperationLimiter,
} = require('../middleware/rateLimiter');
const authController = require('../controllers/authController');

// ============================================
// PUBLIC ROUTES (No Auth Required)
// ============================================

// Registration & Login
router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);

// Token Management
router.post('/refresh', apiLimiter, authController.refresh);
router.post('/logout', authController.logout);

// Email Verification
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', resendVerificationLimiter, authController.resendVerification);

// Password Reset (Public)
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);
router.post('/reset-password', sensitiveOperationLimiter, authController.resetPassword);

module.exports = router;
