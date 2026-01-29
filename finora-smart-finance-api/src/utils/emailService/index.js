// Aggregator für Email Service - Exports all email senders
const { sendVerificationEmail, sendAddEmailVerification } = require('./authEmails');
const { sendPasswordResetEmail, sendEmailChangeVerification } = require('./passwordEmails');
const { sendWelcomeEmail, sendSecurityAlert } = require('./accountEmails');
const { sendTransactionNotification, sendBudgetAlert, sendFinancialReport } = require('./financialEmails');

module.exports = {
  sendVerificationEmail,
  sendAddEmailVerification,
  sendPasswordResetEmail,
  sendEmailChangeVerification,
  sendWelcomeEmail,
  sendTransactionNotification,
  sendSecurityAlert,
  sendBudgetAlert,
  sendFinancialReport,
};
