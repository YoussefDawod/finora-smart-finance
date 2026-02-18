// Aggregates auth-related controllers split by domain to keep files focused
const registration = require('./auth/authRegistrationController');
const password = require('./auth/authPasswordController');
const emailVerification = require('./auth/authEmailVerificationController');
const emailAdd = require('./auth/authEmailAddController');

module.exports = {
  ...registration,
  ...password,
  ...emailVerification,
  ...emailAdd,
};
