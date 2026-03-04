/**
 * Lifecycle Email Templates
 * Templates für Transaktions-Lifecycle-Benachrichtigungen in 4 Sprachen (de, en, ar, ka)
 *
 * Template-Typen:
 * 1. reminder         — Wöchentliche Erinnerung (Transaktionen > 12 Monate)
 * 2. finalWarning     — Finale Warnung (1 Woche vor Löschung)
 * 3. deletionExported — Löschbestätigung (User hat vorher exportiert)
 * 4. deletionNotExported — Löschbestätigung (User hat NICHT exportiert)
 */

const { baseLayout, frontendBaseUrl } = require('./baseLayout');
const { escapeHtml } = require('../escapeHtml');
const colors = require('./colors');

// ============================================
// ÜBERSETZUNGEN
// ============================================

const translations = {
  de: {
    reminder: {
      subject: 'Erinnerung: Alte Transaktionen werden bald gelöscht – Finora',
      title: 'Erinnerung: Daten-Export empfohlen',
      greeting: name => `Hallo ${name},`,
      body: (count, oldestDate) =>
        `du hast <strong>${count} Transaktionen</strong>, die älter als 12 Monate sind ` +
        `(älteste vom ${oldestDate}). ` +
        `Diese werden nach Ablauf der Export-Frist automatisch gelöscht, um Speicherplatz freizugeben.`,
      reminderNote: num => `Dies ist Erinnerung Nr. ${num}.`,
      action: 'Exportiere jetzt deine Daten, um sie dauerhaft zu sichern.',
      button: 'Daten exportieren',
      footer:
        'Du erhältst diese Erinnerung wöchentlich, bis du exportiert hast oder die Frist abläuft.',
    },
    finalWarning: {
      subject: 'Letzte Warnung: Löschung in 7 Tagen – Finora',
      title: 'Letzte Warnung: Löschung in 7 Tagen',
      greeting: name => `Hallo ${name},`,
      body: count =>
        `<strong>${count} deiner alten Transaktionen</strong> werden in <strong>7 Tagen endgültig gelöscht</strong>. ` +
        `Die 3-monatige Export-Frist ist abgelaufen.`,
      action: 'Bitte exportiere deine Daten JETZT, falls du sie noch benötigst.',
      button: 'Jetzt exportieren',
      footer: 'Nach der Löschung können die Daten nicht wiederhergestellt werden.',
    },
    deletionExported: {
      subject: 'Alte Transaktionen gelöscht (Export vorhanden) – Finora',
      title: 'Alte Transaktionen gelöscht',
      greeting: name => `Hallo ${name},`,
      body: (count, totalIncome, totalExpense) =>
        `<strong>${count} alte Transaktionen</strong> wurden planmäßig gelöscht. ` +
        `Da du deine Daten vorher exportiert hast, sind keine Informationen verloren gegangen.`,
      stats: (totalIncome, totalExpense) =>
        `<strong>Gelöschte Einnahmen:</strong> ${totalIncome}<br>` +
        `<strong>Gelöschte Ausgaben:</strong> ${totalExpense}`,
      note: 'Dein Export enthält alle gelöschten Transaktionen. Speicher ihn sicher auf.',
      button: 'Zum Dashboard',
      footer: 'Neue Transaktionen werden normal weitergezählt.',
    },
    deletionNotExported: {
      subject: 'Alte Transaktionen gelöscht (kein Export) – Finora',
      title: 'Alte Transaktionen gelöscht',
      greeting: name => `Hallo ${name},`,
      body: (count, totalIncome, totalExpense) =>
        `<strong>${count} alte Transaktionen</strong> wurden gelöscht. ` +
        `<strong>Leider wurde kein Export durchgeführt</strong> — die Daten sind unwiderruflich verloren.`,
      stats: (totalIncome, totalExpense) =>
        `<strong>Gelöschte Einnahmen:</strong> ${totalIncome}<br>` +
        `<strong>Gelöschte Ausgaben:</strong> ${totalExpense}`,
      note: 'Wir empfehlen, regelmäßig Daten zu exportieren, um Verluste zu vermeiden.',
      button: 'Zum Dashboard',
      footer: 'Exportiere regelmäßig, um deine Finanzdaten dauerhaft zu sichern.',
    },
    copyright: `© ${new Date().getFullYear()} Finora — Smart Finance`,
  },

  en: {
    reminder: {
      subject: 'Reminder: Old transactions will be deleted soon – Finora',
      title: 'Reminder: Data Export Recommended',
      greeting: name => `Hello ${name},`,
      body: (count, oldestDate) =>
        `you have <strong>${count} transactions</strong> older than 12 months ` +
        `(oldest from ${oldestDate}). ` +
        `These will be automatically deleted after the export deadline to free up storage.`,
      reminderNote: num => `This is reminder #${num}.`,
      action: 'Export your data now to save it permanently.',
      button: 'Export Data',
      footer: 'You will receive this reminder weekly until you export or the deadline passes.',
    },
    finalWarning: {
      subject: 'Final Warning: Deletion in 7 days – Finora',
      title: 'Final Warning: Deletion in 7 Days',
      greeting: name => `Hello ${name},`,
      body: count =>
        `<strong>${count} of your old transactions</strong> will be <strong>permanently deleted in 7 days</strong>. ` +
        `The 3-month export period has expired.`,
      action: 'Please export your data NOW if you still need it.',
      button: 'Export Now',
      footer: 'After deletion, the data cannot be recovered.',
    },
    deletionExported: {
      subject: 'Old transactions deleted (export available) – Finora',
      title: 'Old Transactions Deleted',
      greeting: name => `Hello ${name},`,
      body: count =>
        `<strong>${count} old transactions</strong> have been deleted as scheduled. ` +
        `Since you exported your data beforehand, no information has been lost.`,
      stats: (totalIncome, totalExpense) =>
        `<strong>Deleted income:</strong> ${totalIncome}<br>` +
        `<strong>Deleted expenses:</strong> ${totalExpense}`,
      note: 'Your export contains all deleted transactions. Store it safely.',
      button: 'Go to Dashboard',
      footer: 'New transactions will continue to be tracked as normal.',
    },
    deletionNotExported: {
      subject: 'Old transactions deleted (no export) – Finora',
      title: 'Old Transactions Deleted',
      greeting: name => `Hello ${name},`,
      body: count =>
        `<strong>${count} old transactions</strong> have been deleted. ` +
        `<strong>Unfortunately, no export was performed</strong> — the data is irrecoverably lost.`,
      stats: (totalIncome, totalExpense) =>
        `<strong>Deleted income:</strong> ${totalIncome}<br>` +
        `<strong>Deleted expenses:</strong> ${totalExpense}`,
      note: 'We recommend exporting data regularly to avoid future losses.',
      button: 'Go to Dashboard',
      footer: 'Export regularly to permanently save your financial data.',
    },
    copyright: `© ${new Date().getFullYear()} Finora — Smart Finance`,
  },

  ar: {
    reminder: {
      subject: 'تذكير: سيتم حذف المعاملات القديمة قريبًا – Finora',
      title: 'تذكير: يُنصح بتصدير البيانات',
      greeting: name => `مرحبًا ${name}،`,
      body: (count, oldestDate) =>
        `لديك <strong>${count} معاملة</strong> أقدم من 12 شهرًا ` +
        `(أقدمها من ${oldestDate}). ` +
        `سيتم حذفها تلقائيًا بعد انتهاء مهلة التصدير لتحرير مساحة التخزين.`,
      reminderNote: num => `هذا هو التذكير رقم ${num}.`,
      action: 'قم بتصدير بياناتك الآن لحفظها بشكل دائم.',
      button: 'تصدير البيانات',
      footer: 'ستتلقى هذا التذكير أسبوعيًا حتى تقوم بالتصدير أو تنتهي المهلة.',
    },
    finalWarning: {
      subject: 'تحذير أخير: الحذف خلال 7 أيام – Finora',
      title: 'تحذير أخير: الحذف خلال 7 أيام',
      greeting: name => `مرحبًا ${name}،`,
      body: count =>
        `سيتم <strong>حذف ${count} من معاملاتك القديمة نهائيًا خلال 7 أيام</strong>. ` +
        `انتهت مهلة التصدير البالغة 3 أشهر.`,
      action: 'يرجى تصدير بياناتك الآن إذا كنت لا تزال بحاجة إليها.',
      button: 'تصدير الآن',
      footer: 'بعد الحذف، لا يمكن استعادة البيانات.',
    },
    deletionExported: {
      subject: 'تم حذف المعاملات القديمة (التصدير متاح) – Finora',
      title: 'تم حذف المعاملات القديمة',
      greeting: name => `مرحبًا ${name}،`,
      body: count =>
        `تم حذف <strong>${count} معاملة قديمة</strong> كما هو مخطط. ` +
        `بما أنك قمت بتصدير بياناتك مسبقًا، لم تُفقد أي معلومات.`,
      stats: (totalIncome, totalExpense) =>
        `<strong>الإيرادات المحذوفة:</strong> ${totalIncome}<br>` +
        `<strong>المصروفات المحذوفة:</strong> ${totalExpense}`,
      note: 'يحتوي التصدير على جميع المعاملات المحذوفة. احفظه في مكان آمن.',
      button: 'إلى لوحة القيادة',
      footer: 'ستستمر المعاملات الجديدة في التتبع كالمعتاد.',
    },
    deletionNotExported: {
      subject: 'تم حذف المعاملات القديمة (بدون تصدير) – Finora',
      title: 'تم حذف المعاملات القديمة',
      greeting: name => `مرحبًا ${name}،`,
      body: count =>
        `تم حذف <strong>${count} معاملة قديمة</strong>. ` +
        `<strong>للأسف، لم يتم إجراء أي تصدير</strong> — البيانات مفقودة بشكل لا رجعة فيه.`,
      stats: (totalIncome, totalExpense) =>
        `<strong>الإيرادات المحذوفة:</strong> ${totalIncome}<br>` +
        `<strong>المصروفات المحذوفة:</strong> ${totalExpense}`,
      note: 'نوصي بتصدير البيانات بانتظام لتجنب الخسائر المستقبلية.',
      button: 'إلى لوحة القيادة',
      footer: 'قم بالتصدير بانتظام لحفظ بياناتك المالية بشكل دائم.',
    },
    copyright: `© ${new Date().getFullYear()} Finora — Smart Finance`,
  },

  ka: {
    reminder: {
      subject: 'შეხსენება: ძველი ტრანზაქციები მალე წაიშლება – Finora',
      title: 'შეხსენება: რეკომენდებულია მონაცემთა ექსპორტი',
      greeting: name => `გამარჯობა ${name},`,
      body: (count, oldestDate) =>
        `თქვენ გაქვთ <strong>${count} ტრანზაქცია</strong>, რომელიც 12 თვეზე ძველია ` +
        `(უძველესი ${oldestDate}-დან). ` +
        `ისინი ავტომატურად წაიშლება ექსპორტის ვადის ამოწურვის შემდეგ მეხსიერების გასათავისუფლებლად.`,
      reminderNote: num => `ეს არის შეხსენება #${num}.`,
      action: 'ექსპორტირეთ თქვენი მონაცემები ახლავე სამუდამოდ შესანახად.',
      button: 'მონაცემთა ექსპორტი',
      footer:
        'თქვენ მიიღებთ ამ შეხსენებას ყოველკვირეულად, სანამ არ მოახდენთ ექსპორტს ან ვადა არ ამოიწურება.',
    },
    finalWarning: {
      subject: 'ბოლო გაფრთხილება: წაშლა 7 დღეში – Finora',
      title: 'ბოლო გაფრთხილება: წაშლა 7 დღეში',
      greeting: name => `გამარჯობა ${name},`,
      body: count =>
        `<strong>${count} თქვენი ძველი ტრანზაქცია</strong> <strong>სამუდამოდ წაიშლება 7 დღეში</strong>. ` +
        `3-თვიანი ექსპორტის ვადა ამოიწურა.`,
      action: 'გთხოვთ, ექსპორტირეთ თქვენი მონაცემები ახლავე, თუ კიდევ გჭირდებათ.',
      button: 'ექსპორტი ახლავე',
      footer: 'წაშლის შემდეგ მონაცემთა აღდგენა შეუძლებელია.',
    },
    deletionExported: {
      subject: 'ძველი ტრანზაქციები წაიშალა (ექსპორტი ხელმისაწვდომია) – Finora',
      title: 'ძველი ტრანზაქციები წაიშალა',
      greeting: name => `გამარჯობა ${name},`,
      body: count =>
        `<strong>${count} ძველი ტრანზაქცია</strong> წაიშალა გეგმის მიხედვით. ` +
        `ვინაიდან თქვენ წინასწარ მოახდინეთ მონაცემთა ექსპორტი, ინფორმაცია არ დაკარგულა.`,
      stats: (totalIncome, totalExpense) =>
        `<strong>წაშლილი შემოსავალი:</strong> ${totalIncome}<br>` +
        `<strong>წაშლილი ხარჯები:</strong> ${totalExpense}`,
      note: 'თქვენი ექსპორტი შეიცავს ყველა წაშლილ ტრანზაქციას. შეინახეთ იგი უსაფრთხოდ.',
      button: 'დაფაზე გადასვლა',
      footer: 'ახალი ტრანზაქციები გაგრძელდება ჩვეულებისამებრ.',
    },
    deletionNotExported: {
      subject: 'ძველი ტრანზაქციები წაიშალა (ექსპორტის გარეშე) – Finora',
      title: 'ძველი ტრანზაქციები წაიშალა',
      greeting: name => `გამარჯობა ${name},`,
      body: count =>
        `<strong>${count} ძველი ტრანზაქცია</strong> წაიშალა. ` +
        `<strong>სამწუხაროდ, ექსპორტი არ ჩატარებულა</strong> — მონაცემები შეუქცევადად დაიკარგა.`,
      stats: (totalIncome, totalExpense) =>
        `<strong>წაშლილი შემოსავალი:</strong> ${totalIncome}<br>` +
        `<strong>წაშლილი ხარჯები:</strong> ${totalExpense}`,
      note: 'გირჩევთ რეგულარულად მოახდინოთ მონაცემთა ექსპორტი მომავალი დანაკარგების თავიდან ასაცილებლად.',
      button: 'დაფაზე გადასვლა',
      footer: 'რეგულარულად ექსპორტირეთ თქვენი ფინანსური მონაცემების სამუდამოდ შესანახად.',
    },
    copyright: `© ${new Date().getFullYear()} Finora — Smart Finance`,
  },
};

// ============================================
// HILFSFUNKTIONEN
// ============================================

const SUPPORTED_LANGUAGES = ['de', 'en', 'ar', 'ka'];

/**
 * Ermittelt die Sprache des Users (Fallback: 'de')
 * @param {Object} user - User-Objekt
 * @returns {string} Sprachcode (de, en, ar, ka)
 */
function getUserLanguage(user) {
  const lang = user?.preferences?.language || 'de';
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : 'de';
}

/**
 * Sicherer Zugriff auf Übersetzungen (vermeidet Object Injection)
 * @param {string} lang - Validierter Sprachcode
 * @returns {Object} Übersetzungsobjekt für die Sprache
 */
function getTranslations(lang) {
  switch (lang) {
    case 'en':
      return translations.en;
    case 'ar':
      return translations.ar;
    case 'ka':
      return translations.ka;
    default:
      return translations.de;
  }
}

/**
 * Gibt die Locale-ID für Datumsformatierung zurück
 * @param {string} lang - Sprachcode
 * @returns {string} Locale-ID
 */
function getLocale(lang) {
  switch (lang) {
    case 'en':
      return 'en-US';
    case 'ar':
      return 'ar-SA';
    case 'ka':
      return 'ka-GE';
    default:
      return 'de-DE';
  }
}

/**
 * Formatiert ein Datum lokalisiert
 * @param {Date|string} date - Datum
 * @param {string} lang - Sprachcode
 * @returns {string} Formatiertes Datum
 */
function formatDate(date, lang) {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString(getLocale(lang), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formatiert einen Betrag
 * @param {number} amount - Betrag
 * @returns {string} Formatierter Betrag
 */
function formatAmount(amount) {
  if (amount === undefined || amount === null) return '0.00 €';
  return `${Number(amount).toFixed(2)} €`;
}

/**
 * RTL-Attribut für arabische Emails
 * @param {string} lang - Sprachcode
 * @returns {string} dir-Attribut
 */
function getDir(lang) {
  return lang === 'ar' ? ' dir="rtl"' : '';
}

// ============================================
// TEMPLATE-GENERATOREN
// ============================================

/**
 * Wöchentliche Retention-Erinnerung
 * @param {Object} user - User mit name, preferences.language
 * @param {Object} data - { oldestDate, count, reminderNumber }
 * @returns {{ subject: string, html: string }}
 */
function retentionReminder(user, data) {
  const lang = getUserLanguage(user);
  const langData = getTranslations(lang);
  const t = langData.reminder;
  const name = escapeHtml(user.name || 'Nutzer');
  const oldestFormatted = formatDate(data.oldestDate, lang);

  const html = baseLayout(`
    <div class="content"${getDir(lang)}>
      <h2>${t.title}</h2>
      <p>${t.greeting(name)}</p>
      <p>${t.body(data.count, oldestFormatted)}</p>
      <div class="warning">
        ${t.reminderNote(data.reminderNumber)}
      </div>
      <p>${t.action}</p>
      <p style="text-align: center;">
        <a href="${frontendBaseUrl}/settings" class="button">${t.button}</a>
      </p>
    </div>
    <div class="footer"${getDir(lang)}>
      <p>${t.footer}</p>
      <p>${langData.copyright}</p>
    </div>
  `);

  return { subject: t.subject, html };
}

/**
 * Finale Warnung (1 Woche vor Löschung)
 * @param {Object} user - User
 * @param {Object} data - { count, daysRemaining }
 * @returns {{ subject: string, html: string }}
 */
function retentionFinalWarning(user, data) {
  const lang = getUserLanguage(user);
  const langData = getTranslations(lang);
  const t = langData.finalWarning;
  const name = escapeHtml(user.name || 'Nutzer');

  const html = baseLayout(`
    <div class="content"${getDir(lang)}>
      <h2 style="color: ${colors.error};">${t.title}</h2>
      <p>${t.greeting(name)}</p>
      <p>${t.body(data.count)}</p>
      <div class="warning">
        <strong style="color: ${colors.error};">⚠️ ${t.action}</strong>
      </div>
      <p style="text-align: center;">
        <a href="${frontendBaseUrl}/settings" class="button" style="background: ${colors.GRADIENTS.danger};">${t.button}</a>
      </p>
    </div>
    <div class="footer"${getDir(lang)}>
      <p>${t.footer}</p>
      <p>${langData.copyright}</p>
    </div>
  `);

  return { subject: t.subject, html };
}

/**
 * Löschbestätigung (User HAT exportiert)
 * @param {Object} user - User
 * @param {Object} data - { count, totalIncome, totalExpense, oldestDate, newestDate }
 * @returns {{ subject: string, html: string }}
 */
function retentionDeletionExported(user, data) {
  const lang = getUserLanguage(user);
  const langData = getTranslations(lang);
  const t = langData.deletionExported;
  const name = escapeHtml(user.name || 'Nutzer');

  const html = baseLayout(`
    <div class="content"${getDir(lang)}>
      <h2>${t.title}</h2>
      <p>${t.greeting(name)}</p>
      <p>${t.body(data.count)}</p>
      <div class="info">
        ${t.stats(formatAmount(data.totalIncome), formatAmount(data.totalExpense))}
      </div>
      <p>${t.note}</p>
      <p style="text-align: center;">
        <a href="${frontendBaseUrl}/dashboard" class="button">${t.button}</a>
      </p>
    </div>
    <div class="footer"${getDir(lang)}>
      <p>${t.footer}</p>
      <p>${langData.copyright}</p>
    </div>
  `);

  return { subject: t.subject, html };
}

/**
 * Löschbestätigung (User hat NICHT exportiert)
 * @param {Object} user - User
 * @param {Object} data - { count, totalIncome, totalExpense, oldestDate, newestDate }
 * @returns {{ subject: string, html: string }}
 */
function retentionDeletionNotExported(user, data) {
  const lang = getUserLanguage(user);
  const langData = getTranslations(lang);
  const t = langData.deletionNotExported;
  const name = escapeHtml(user.name || 'Nutzer');

  const html = baseLayout(`
    <div class="content"${getDir(lang)}>
      <h2 style="color: ${colors.error};">${t.title}</h2>
      <p>${t.greeting(name)}</p>
      <p>${t.body(data.count)}</p>
      <div class="warning">
        ${t.stats(formatAmount(data.totalIncome), formatAmount(data.totalExpense))}
      </div>
      <p>${t.note}</p>
      <p style="text-align: center;">
        <a href="${frontendBaseUrl}/dashboard" class="button">${t.button}</a>
      </p>
    </div>
    <div class="footer"${getDir(lang)}>
      <p>${t.footer}</p>
      <p>${langData.copyright}</p>
    </div>
  `);

  return { subject: t.subject, html };
}

module.exports = {
  retentionReminder,
  retentionFinalWarning,
  retentionDeletionExported,
  retentionDeletionNotExported,
  // Exportiert für Tests
  translations,
  getUserLanguage,
  formatDate,
  formatAmount,
  getDir,
};
