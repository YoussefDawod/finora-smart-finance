// Aggregator für alle Email-Templates
const { baseLayout } = require('./baseLayout');
const colors = require('./colors');
const { verification, emailChange } = require('./authTemplates');
const { passwordReset } = require('./passwordTemplates');
const { welcome, securityAlert } = require('./accountTemplates');
const { transactionNotification, budgetAlert, financialReport } = require('./financialTemplates');
const { contactForm } = require('./contactTemplates');
const { newsletterConfirmation, newsletterWelcome, newsletterGoodbye, campaignTemplate } = require('./newsletterTemplates');
const { newUserRegistration } = require('./adminTemplates');
const {
  retentionReminder,
  retentionFinalWarning,
  retentionDeletionExported,
  retentionDeletionNotExported,
} = require('./lifecycleTemplates');

module.exports = {
  baseLayout,
  colors,
  verification,
  passwordReset,
  emailChange,
  welcome,
  transactionNotification,
  securityAlert,
  budgetAlert,
  financialReport,
  contactForm,
  newsletterConfirmation,
  newsletterWelcome,
  newsletterGoodbye,
  campaignTemplate,
  newUserRegistration,
  // Lifecycle
  retentionReminder,
  retentionFinalWarning,
  retentionDeletionExported,
  retentionDeletionNotExported,
};
