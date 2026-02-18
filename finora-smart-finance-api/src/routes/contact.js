const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Rate limiter: max 3 contact requests per hour per IP
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { error: 'Too many contact requests. Please try again later.', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/contact
router.post('/', contactLimiter, async (req, res) => {
  try {
    const { name, email, category, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, Email and Message are required', code: 'VALIDATION_ERROR' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format', code: 'INVALID_EMAIL' });
    }

    // Log the contact request (in production, this would send an email)
    logger.info(`Contact form submission: ${category} from ${email}`);

    // Try to send email if emailService is available
    try {
      const emailService = require('../utils/emailService');
      if (emailService && emailService.sendContactEmail) {
        await emailService.sendContactEmail({ name, email, category, message });
      }
    } catch {
      // Email service not available, log only
      logger.info('Contact email service not configured, request logged only');
    }

    return res.status(200).json({ success: true, message: 'Contact request received' });
  } catch (err) {
    logger.error(`Contact form error: ${err.message}`);
    return res.status(500).json({ error: 'Failed to process contact request', code: 'SERVER_ERROR' });
  }
});

module.exports = router;
