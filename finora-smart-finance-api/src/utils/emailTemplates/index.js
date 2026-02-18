// Aggregator für alle Email-Templates
const { baseLayout } = require('./baseLayout');
const { verification, emailChange } = require('./authTemplates');
const { passwordReset } = require('./passwordTemplates');
const { welcome, securityAlert } = require('./accountTemplates');
const { transactionNotification, budgetAlert, financialReport } = require('./financialTemplates');
const { contactForm } = require('./contactTemplates');
const { newsletterConfirmation, newsletterWelcome, newsletterGoodbye } = require('./newsletterTemplates');

module.exports = {
  baseLayout,
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
};
