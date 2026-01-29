// Aggregates auth-related controllers split by domain to keep files focused
const registration = require('./auth/authRegistrationController');
const password = require('./auth/authPasswordController');
const profile = require('./auth/authProfileController');
const emailVerification = require('./auth/authEmailVerificationController');
const emailChange = require('./auth/authEmailChangeController');
const emailAdd = require('./auth/authEmailAddController');
const data = require('./auth/authDataController');

module.exports = {
  ...registration,
  ...password,
  ...profile,
  ...emailVerification,
  ...emailChange,
  ...emailAdd,
  ...data,
};
