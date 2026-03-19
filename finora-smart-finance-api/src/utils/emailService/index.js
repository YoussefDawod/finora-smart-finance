// Aggregator für Email Service - Exports all email senders
const { sendVerificationEmail, sendAddEmailVerification } = require('./authEmails');
const { sendPasswordResetEmail, sendEmailChangeVerification } = require('./passwordEmails');
const { sendWelcomeEmail, sendSecurityAlert } = require('./accountEmails');
const {
  sendTransactionNotification,
  sendBudgetAlert,
  sendFinancialReport,
} = require('./financialEmails');
const { sendContactEmail } = require('./contactEmails');
const {
  sendNewsletterConfirmation,
  sendNewsletterWelcome,
  sendNewsletterGoodbye,
  sendNewsletterCampaign,
} = require('./newsletterEmails');
const { notifyAdminsNewUser, sendAdminCreatedCredentialsEmail } = require('./adminEmails');
const { sendLifecycleEmail } = require('./lifecycleEmails');

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
  sendContactEmail,
  sendNewsletterConfirmation,
  sendNewsletterWelcome,
  sendNewsletterGoodbye,
  sendNewsletterCampaign,
  notifyAdminsNewUser,
  sendAdminCreatedCredentialsEmail,
  // Lifecycle
  sendLifecycleEmail,
};
