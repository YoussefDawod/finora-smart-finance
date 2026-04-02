/**
 * Registration Service
 * Handles user registration logic, validation, and setup
 */

const User = require('../models/User');
const Subscriber = require('../models/Subscriber');
const emailService = require('../utils/emailService');
const authService = require('./authService');
const auditLogService = require('./auditLogService');
const config = require('../config/env');
const logger = require('../utils/logger');
const {
  validateName,
  validatePassword,
  validateOptionalEmail,
} = require('../validators/authValidation');

/**
 * Validates registration input data
 * @returns {Object} { valid: boolean, error?: string, data?: { name, password, email } }
 */
async function validateRegistrationInput(name, password, email, understoodNoEmailReset) {
  // Validate name
  const nameValidation = validateName(name);
  if (!nameValidation.valid) {
    return { valid: false, error: nameValidation.error, code: 'INVALID_NAME' };
  }

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return { valid: false, error: passwordValidation.error, code: 'INVALID_PASSWORD' };
  }

  // Check if name already exists
  const existingName = await User.findOne({ name: nameValidation.name });
  if (existingName) {
    return { valid: false, error: 'Dieser Name ist bereits vergeben', code: 'NAME_EXISTS' };
  }

  // Validate email (optional)
  const emailValidation = validateOptionalEmail(email);
  if (!emailValidation.valid) {
    return { valid: false, error: emailValidation.error, code: 'INVALID_EMAIL' };
  }

  // Check if email already exists
  if (emailValidation.email) {
    const existingEmail = await User.findOne({ email: emailValidation.email });
    if (existingEmail) {
      return { valid: false, error: 'Diese Email ist bereits registriert', code: 'EMAIL_EXISTS' };
    }
  }

  // If no email: checkbox must be confirmed
  if (!emailValidation.email && !understoodNoEmailReset) {
    return {
      valid: false,
      error:
        'Bitte bestätigen Sie, dass Sie verstanden haben, dass ohne Email kein Passwort-Reset möglich ist',
      code: 'CHECKBOX_REQUIRED',
    };
  }

  return {
    valid: true,
    data: {
      name: nameValidation.name,
      password,
      email: emailValidation.email,
      understoodNoEmailReset: !emailValidation.email,
    },
  };
}

/**
 * Creates a new user and handles initial setup
 * @returns {Object} { user, tokens, verificationLink? }
 */
async function registerUser(validatedData, requestContext = {}) {
  const { name, password, email, understoodNoEmailReset } = validatedData;

  // Create user
  const user = new User({
    name,
    ...(email && { email }),
    understoodNoEmailReset,
  });
  await user.setPassword(password);

  // Handle email verification
  let verificationLink = null;
  if (email) {
    // Send verification email
    const verificationToken = user.generateVerification();
    await user.save();

    // Fire-and-forget: SMTP soll HTTP-Response nicht blockieren
    emailService.sendVerificationEmail(user, verificationToken).catch(err => {
      logger.warn(`Verification email failed for ${user.email}: ${err.message}`);
    });

    // Auto-Newsletter-Abo für neue User mit Email (fire & forget)
    Subscriber.findOne({ email: user.email })
      .then(existingSub => {
        if (!existingSub) {
          const sub = new Subscriber({
            email: user.email,
            userId: user._id,
            isConfirmed: true,
            subscribedAt: new Date(),
            confirmedAt: new Date(),
            language: 'de',
          });
          sub.generateUnsubscribeToken();
          return sub.save();
        }
      })
      .catch(() => {});
  } else {
    // Kein Email: User bleibt unverified bis eine Email nachgetragen und bestätigt wird
    await user.save();
  }

  // Generate auth tokens
  const tokens = await authService.generateAuthTokens(user, {
    userAgent: requestContext.userAgent,
    ip: requestContext.ip,
  });

  // Notify admins about new registration (fire & forget)
  emailService.notifyAdminsNewUser(user).catch(() => {});

  // Audit-Log: Neue Registrierung
  auditLogService.log({
    action: 'USER_REGISTERED',
    targetUserId: user._id,
    targetUserName: user.name,
    details: { hasEmail: !!email },
    ip: requestContext.ip,
    userAgent: requestContext.userAgent,
  });

  return {
    user,
    tokens,
    verificationLink,
  };
}

/**
 * Handles MongoDB duplicate key errors
 * @returns {Object} { error, code }
 */
function handleDuplicateError(err) {
  if (err.code !== 11000 || !err.keyPattern) {
    return null;
  }

  if (err.keyPattern.name) {
    return {
      error: 'Dieser Name ist bereits vergeben',
      code: 'NAME_EXISTS',
    };
  }

  if (err.keyPattern.email) {
    return {
      error: 'Diese Email ist bereits registriert',
      code: 'EMAIL_EXISTS',
    };
  }

  return null;
}

module.exports = {
  validateRegistrationInput,
  registerUser,
  handleDuplicateError,
};
