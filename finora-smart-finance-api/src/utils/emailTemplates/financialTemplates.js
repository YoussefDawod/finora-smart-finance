const { baseLayout, frontendBaseUrl } = require('./baseLayout');

/**
 * Benachrichtigung über neue Transaktion
 * @param {string} name - Benutzername
 * @param {Object} transaction - Transaktionsdaten
 * @returns {string} HTML-Template
 */
function transactionNotification(name, transaction) {
  const sign = transaction.type === 'income' ? '+' : '-';
  const amount = `${sign}${transaction.amount.toFixed(2)} €`;
  const date = new Date(transaction.date).toLocaleDateString('de-DE');

  return baseLayout(`
    <div class="content">
      <h2>Neue Transaktion erfasst</h2>
      <p>Hallo ${name},</p>
      <p>es wurde eine neue ${transaction.type === 'income' ? 'Einnahme' : 'Ausgabe'} gespeichert:</p>
      <div class="info">
        <strong>Betrag:</strong> ${amount}<br>
        <strong>Kategorie:</strong> ${transaction.category}<br>
        <strong>Datum:</strong> ${date}<br>
        <strong>Beschreibung:</strong> ${transaction.description}
      </div>
      <p style="text-align: center;">
        <a href="${frontendBaseUrl}/transactions" class="button">📊 Zu meinen Transaktionen</a>
      </p>
      <p style="font-size: 14px; color: #6b7280;">
        Wenn diese Buchung nicht von dir stammt, melde dich bitte sofort an und prüfe dein Konto.
      </p>
    </div>
    <div class="footer">
      <p>Du kannst Benachrichtigungen jederzeit in den Einstellungen deaktivieren.</p>
      <p>© ${new Date().getFullYear()} Finora - Smart Finance</p>
    </div>
  `);
}

/**
 * Budget-Warnung Template
 * @param {string} name - Benutzername
 * @param {Object} alertData - Warnungsdaten
 * @returns {string} HTML-Template
 */
function budgetAlert(name, alertData) {
  const { alertType } = alertData;

  // Negative Balance Alert
  if (alertType === 'negative_balance') {
    const { totalIncome, totalExpenses, balance, deficit, currency, latestTransaction } = alertData;
    const currencySymbol = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF', JPY: '¥' }[currency] || '€';

    return baseLayout(`
      <div class="content">
        <h2>⚠️ Achtung: Negativer Kontostand</h2>
        <p>Hallo ${name},</p>
        <p>Dein Gesamtsaldo ist ins Minus gerutscht. Hier die Details:</p>
        <div class="warning">
          <strong>Gesamteinnahmen:</strong> ${totalIncome.toFixed(2)} ${currencySymbol}<br>
          <strong>Gesamtausgaben:</strong> ${totalExpenses.toFixed(2)} ${currencySymbol}<br>
          <strong>Aktueller Saldo:</strong> <span style="color: #ef4444; font-weight: bold;">${balance.toFixed(2)} ${currencySymbol}</span><br>
          <strong>Defizit:</strong> ${deficit.toFixed(2)} ${currencySymbol}
        </div>
        ${latestTransaction ? `
        <div class="info">
          <strong>Letzte Transaktion:</strong><br>
          ${latestTransaction.description || latestTransaction.category}: -${latestTransaction.amount.toFixed(2)} ${currencySymbol}
        </div>
        ` : ''}
        <p>Überlege, wie du deine Finanzen wieder ausgleichen kannst. Vielleicht gibt es Ausgaben, die du reduzieren könntest?</p>
        <p style="text-align: center;">
          <a href="${frontendBaseUrl}/transactions" class="button">📊 Finanzen prüfen</a>
        </p>
      </div>
      <div class="footer">
        <p>Diese Benachrichtigung wird maximal einmal pro Woche gesendet.</p>
        <p>Du kannst diese Warnungen in den Einstellungen anpassen.</p>
        <p>© ${new Date().getFullYear()} Finora - Smart Finance</p>
      </div>
    `);
  }

  // Monthly Budget Limit Alert
  const { totalSpent, limit, percentUsed, currency, remainingBudget, exceededBy, latestTransaction } = alertData;
  const currencySymbol = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF', JPY: '¥' }[currency] || '€';
  const isExceeded = percentUsed > 100;

  return baseLayout(`
    <div class="content">
      <h2>${isExceeded ? '🚨 Budget überschritten!' : '⚠️ Budget-Warnung'}</h2>
      <p>Hallo ${name},</p>
      <p>${isExceeded 
        ? 'Du hast dein monatliches Budget überschritten!' 
        : `Du hast ${percentUsed}% deines monatlichen Budgets erreicht.`}</p>
      <div class="${isExceeded ? 'warning' : 'info'}">
        <strong>Monatliches Budget:</strong> ${limit.toFixed(2)} ${currencySymbol}<br>
        <strong>Bereits ausgegeben:</strong> ${totalSpent.toFixed(2)} ${currencySymbol}<br>
        <strong>Verbraucht:</strong> ${percentUsed}%<br>
        ${isExceeded 
          ? `<strong>Überschritten um:</strong> <span style="color: #ef4444;">${exceededBy.toFixed(2)} ${currencySymbol}</span>` 
          : `<strong>Verbleibend:</strong> ${remainingBudget.toFixed(2)} ${currencySymbol}`}
      </div>
      ${latestTransaction ? `
      <div class="info">
        <strong>Letzte Transaktion:</strong><br>
        ${latestTransaction.description || latestTransaction.category}: -${latestTransaction.amount.toFixed(2)} ${currencySymbol}
      </div>
      ` : ''}
      <p>Überlege, ob du in den verbleibenden Tagen des Monats noch Einsparungspotenzial hast.</p>
      <p style="text-align: center;">
        <a href="${frontendBaseUrl}/transactions" class="button">📊 Ausgaben prüfen</a>
      </p>
    </div>
    <div class="footer">
      <p>Du kannst Budget-Warnungen in den Einstellungen anpassen.</p>
      <p>© ${new Date().getFullYear()} Finora - Smart Finance</p>
    </div>
  `);
}

/**
 * Wöchentlicher/Monatlicher Bericht Template
 * @param {string} name - Benutzername
 * @param {Object} reportData - Berichtsdaten
 * @param {string} period - 'weekly' oder 'monthly'
 * @returns {string} HTML-Template
 */
function financialReport(name, reportData, period = 'weekly') {
  const { income, expenses, balance, topCategories, startDate, endDate } = reportData;
  const periodLabel = period === 'weekly' ? 'Wochenbericht' : 'Monatsbericht';

  const categoryList = topCategories
    .slice(0, 5)
    .map((cat) => `<li>${cat.category}: ${cat.amount.toFixed(2)} €</li>`)
    .join('');

  return baseLayout(`
    <div class="content">
      <h2>Dein ${periodLabel} 📊</h2>
      <p>Hallo ${name},</p>
      <p>hier ist deine Finanzübersicht für den Zeitraum ${startDate} - ${endDate}:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background: #f3f4f6;">
          <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Einnahmen</strong></td>
          <td style="padding: 12px; border: 1px solid #e5e7eb; color: #10b981;">+${income.toFixed(2)} €</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Ausgaben</strong></td>
          <td style="padding: 12px; border: 1px solid #e5e7eb; color: #ef4444;">-${expenses.toFixed(2)} €</td>
        </tr>
        <tr style="background: #f3f4f6;">
          <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Saldo</strong></td>
          <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: 700; color: ${balance >= 0 ? '#10b981' : '#ef4444'};">
            ${balance >= 0 ? '+' : ''}${balance.toFixed(2)} €
          </td>
        </tr>
      </table>

      ${topCategories.length > 0 ? `
      <div class="info">
        <strong>Top Ausgaben-Kategorien:</strong>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          ${categoryList}
        </ul>
      </div>
      ` : ''}

      <p style="text-align: center;">
        <a href="${frontendBaseUrl}/dashboard" class="button">📈 Zum Dashboard</a>
      </p>
    </div>
    <div class="footer">
      <p>Du kannst Berichte in den Einstellungen deaktivieren.</p>
      <p>© ${new Date().getFullYear()} Finora - Smart Finance</p>
    </div>
  `);
}

module.exports = {
  transactionNotification,
  budgetAlert,
  financialReport,
};
