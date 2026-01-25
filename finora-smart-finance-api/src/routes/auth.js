/**
 * Auth Routes
 * Schlanke Router-Datei - nur Routen-Definitionen
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  resendVerificationLimiter,
  sensitiveOperationLimiter,
  emailOperationLimiter,
} = require('../middleware/rateLimiter');
const authController = require('../controllers/authController');

// ============================================
// PUBLIC ROUTES (No Auth Required)
// ============================================

// Registration & Login
router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);

// Token Management
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Email Verification
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', resendVerificationLimiter, authController.resendVerification);

// Password Reset (Public)
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Email Change Verification (Token-based, no auth)
router.post('/verify-email-change', authController.verifyEmailChange);
router.get('/verify-add-email', authController.verifyAddEmailGet);
router.post('/verify-add-email', authController.verifyAddEmailPost);

// ============================================
// PROTECTED ROUTES (Auth Required)
// ============================================

// Profile Management
router.get('/me', auth, authController.getMe);
router.put('/me', auth, authController.updateMe);
router.delete('/me', auth, sensitiveOperationLimiter, authController.deleteMe);

// Password Change (Authenticated)
router.post('/change-password', auth, sensitiveOperationLimiter, authController.changePassword);

// Email Management
router.post('/change-email', auth, authController.changeEmail);
router.post('/add-email', auth, emailOperationLimiter, authController.addEmail);
router.delete('/remove-email', auth, emailOperationLimiter, authController.removeEmail);
router.post('/resend-add-email-verification', auth, emailOperationLimiter, authController.resendAddEmailVerification);
router.get('/email-status', auth, authController.getEmailStatus);

// Preferences
router.put('/preferences', auth, authController.updatePreferences);

// Data Export & Deletion
router.post('/export-data', auth, authController.exportData);
router.delete('/transactions', auth, authController.deleteTransactions);

module.exports = router;
