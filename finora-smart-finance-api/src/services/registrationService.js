/**
 * Registration Service
 * Handles user registration logic, validation, and setup
 */

const User = require('../models/User');
const emailService = require('../utils/emailService');
const authService = require('./authService');
const config = require('../config/env');
const { validateName, validatePassword, validateOptionalEmail } = require('../validators/authValidation');

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
      error: 'Bitte bestätigen Sie, dass Sie verstanden haben, dass ohne Email kein Passwort-Reset möglich ist',
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
    email,
    understoodNoEmailReset,
  });
  await user.setPassword(password);

  // Handle email verification
  let verificationLink = null;
  if (email) {
    // Send verification email
    const verificationToken = user.generateVerification();
    await user.save();

    const emailResult = await emailService.sendVerificationEmail(user, verificationToken);
    if (config.nodeEnv === 'development' && emailResult) {
      verificationLink = emailResult.link;
    }
  } else {
    // No email: auto-verify user
    user.isVerified = true;
    await user.save();
  }

  // Generate auth tokens
  const tokens = await authService.generateAuthTokens(user, {
    userAgent: requestContext.userAgent,
    ip: requestContext.ip,
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
