/**
 * Admin Email Templates
 * Benachrichtigungen für Admins (z.B. neue Registrierung)
 */

const { baseLayout } = require('./baseLayout');
const { escapeHtml } = require('../escapeHtml');
const colors = require('./colors');

/**
 * Neue Registrierung — Admin-Benachrichtigung
 * @param {Object} opts
 * @param {string} opts.adminName - Name des Admins
 * @param {string} opts.userName  - Name des neuen Users
 * @param {string} [opts.userEmail] - Email des neuen Users (optional)
 * @param {string} opts.registeredAt - Zeitpunkt der Registrierung
 * @returns {string} HTML
 */
function newUserRegistration({ adminName, userName, userEmail, registeredAt }) {
  const safeAdminName = escapeHtml(adminName);
  const safeUserName = escapeHtml(userName);
  const safeUserEmail = escapeHtml(userEmail);
  const emailRow = userEmail
    ? `<tr><td style="padding:8px 12px;color:${colors.textMuted};">E-Mail</td><td style="padding:8px 12px;font-weight:600;">${safeUserEmail}</td></tr>`
    : `<tr><td style="padding:8px 12px;color:${colors.textMuted};">E-Mail</td><td style="padding:8px 12px;color:${colors.textSubtle};font-style:italic;">Nicht angegeben</td></tr>`;

  return baseLayout(`
    <div class="content">
      <h2>👋 Hallo ${safeAdminName},</h2>
      <p>Ein neuer Benutzer hat sich bei <strong>Finora</strong> registriert:</p>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;background:${colors.surfaceLight};border-radius:8px;overflow:hidden;">
        <tr><td style="padding:8px 12px;color:${colors.textMuted};">Name</td><td style="padding:8px 12px;font-weight:600;">${safeUserName}</td></tr>
        ${emailRow}
        <tr><td style="padding:8px 12px;color:${colors.textMuted};">Registriert am</td><td style="padding:8px 12px;">${registeredAt}</td></tr>
      </table>

      <p style="color:${colors.textMuted};font-size:14px;">
        Du kannst den Benutzer im <strong>Admin-Panel</strong> verwalten.
      </p>
    </div>
  `);
}

/**
 * Vom Admin erstellte Zugangsdaten — Email an den neuen User
 * @param {Object} opts
 * @param {string} opts.name              - Name des neuen Users
 * @param {string} opts.username          - Login-Name (identisch mit name)
 * @param {string} opts.password          - Klartextpasswort (einmalig)
 * @param {string} [opts.activationLink]  - Aktivierungslink, falls isVerified === false
 * @param {string} [opts.loginLink]       - Login-Link für bereits verifizierte User
 * @param {string} [opts.language='de']   - Sprache der Email (de, en, ar, ka)
 * @returns {string} HTML
 */
function adminCreatedCredentials({
  name,
  username,
  password,
  activationLink,
  loginLink,
  language = 'de',
}) {
  const safeName = escapeHtml(name);
  const safeUsername = escapeHtml(username);
  const safePassword = escapeHtml(password);

  const isRtl = language === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';
  const borderSide = isRtl ? 'border-right' : 'border-left';

  const i18n = {
    de: {
      welcome: n => `Willkommen bei Finora, ${n}!`,
      intro: 'Dein Konto wurde vom Administrator erstellt. Hier sind deine Zugangsdaten:',
      usernameLabel: 'Benutzername',
      passwordLabel: 'Passwort',
      copyHint: 'Zum Kopieren markieren',
      activateText: 'Um dein Konto zu aktivieren, klicke bitte auf den folgenden Button:',
      activateButton: 'Konto aktivieren',
      activateLinkExpiry: 'Der Aktivierungslink ist 24 Stunden gültig.',
      alreadyActivated: 'Dein Konto wurde bereits vom Administrator aktiviert.',
      loginButton: 'Jetzt einloggen',
      alreadyActivatedNoLink:
        'Dein Konto wurde bereits vom Administrator aktiviert. Du kannst dich sofort anmelden.',
      securityTitle: 'Sicherheitshinweis:',
      securityText: 'Bitte ändere dein Passwort nach der ersten Anmeldung im Profil-Bereich.',
      footerSlogan: 'Intelligente Finanzverwaltung f&uuml;r dein smartes Leben',
    },
    en: {
      welcome: n => `Welcome to Finora, ${n}!`,
      intro: 'Your account has been created by an administrator. Here are your login credentials:',
      usernameLabel: 'Username',
      passwordLabel: 'Password',
      copyHint: 'Select to copy',
      activateText: 'To activate your account, please click the button below:',
      activateButton: 'Activate Account',
      activateLinkExpiry: 'The activation link is valid for 24 hours.',
      alreadyActivated: 'Your account has already been activated by the administrator.',
      loginButton: 'Log in now',
      alreadyActivatedNoLink:
        'Your account has already been activated by the administrator. You can log in right away.',
      securityTitle: 'Security notice:',
      securityText: 'Please change your password after your first login in the profile section.',
      footerSlogan: 'Smart finance management for your smart life',
    },
    ar: {
      welcome: n => `مرحبًا بك في Finora، ${n}!`,
      intro: 'تم إنشاء حسابك بواسطة المسؤول. إليك بيانات تسجيل الدخول الخاصة بك:',
      usernameLabel: 'اسم المستخدم',
      passwordLabel: 'كلمة المرور',
      copyHint: 'حدد للنسخ',
      activateText: 'لتفعيل حسابك، يرجى النقر على الزر أدناه:',
      activateButton: 'تفعيل الحساب',
      activateLinkExpiry: 'رابط التفعيل صالح لمدة 24 ساعة.',
      alreadyActivated: 'تم تفعيل حسابك بالفعل بواسطة المسؤول.',
      loginButton: 'تسجيل الدخول الآن',
      alreadyActivatedNoLink: 'تم تفعيل حسابك بالفعل بواسطة المسؤول. يمكنك تسجيل الدخول الآن.',
      securityTitle: 'ملاحظة أمنية:',
      securityText: 'يرجى تغيير كلمة المرور بعد تسجيل الدخول الأول في صفحة الملف الشخصي.',
      footerSlogan: 'إدارة مالية ذكية لحياتك الذكية',
    },
    ka: {
      welcome: n => `კეთილი იყოს თქვენი მობრძანება Finora-ში, ${n}!`,
      intro: 'თქვენი ანგარიში შეიქმნა ადმინისტრატორის მიერ. აქ არის თქვენი შესვლის მონაცემები:',
      usernameLabel: 'მომხმარებლის სახელი',
      passwordLabel: 'პაროლი',
      copyHint: 'მონიშნეთ კოპირებისთვის',
      activateText: 'ანგარიშის გასააქტიურებლად, გთხოვთ დააჭიროთ ქვემოთ მოცემულ ღილაკს:',
      activateButton: 'ანგარიშის გააქტიურება',
      activateLinkExpiry: 'გააქტიურების ბმული მოქმედებს 24 საათის განმავლობაში.',
      alreadyActivated: 'თქვენი ანგარიში უკვე გააქტიურებულია ადმინისტრატორის მიერ.',
      loginButton: 'შესვლა',
      alreadyActivatedNoLink:
        'თქვენი ანგარიში უკვე გააქტიურებულია ადმინისტრატორის მიერ. შეგიძლიათ შეხვიდეთ ახლავე.',
      securityTitle: 'უსაფრთხოების შეტყობინება:',
      securityText: 'გთხოვთ შეცვალოთ პაროლი პირველი შესვლის შემდეგ პროფილის განყოფილებაში.',
      footerSlogan: 'ჭკვიანი ფინანსური მართვა თქვენი ჭკვიანი ცხოვრებისთვის',
    },
  };

  const txt = i18n[language] || i18n.de;

  const credentialRow = (label, value) => `
    <table dir="${dir}" style="width:100%;border-collapse:collapse;margin:20px 0 0;" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:0 0 6px;">
          <span style="font-size:11px;color:${colors.textMuted};font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${label}</span>
          <span style="font-size:10px;color:${colors.textDisabled};font-weight:400;letter-spacing:normal;text-transform:none;margin-${isRtl ? 'right' : 'left'}:10px;">${txt.copyHint}</span>
        </td>
      </tr>
      <tr>
        <td style="background:${colors.surfaceLight};border:1px solid ${colors.border};border-radius:8px;padding:14px 18px;-webkit-user-select:all;user-select:all;cursor:text;">
          <span style="font-family:'Courier New',Courier,monospace;font-size:16px;font-weight:700;letter-spacing:0.05em;color:${colors.text || '#1a1a2e'};direction:ltr;unicode-bidi:bidi-override;">${value}</span>
        </td>
      </tr>
    </table>
  `;

  const actionBlock = activationLink
    ? `
      <p style="margin:24px 0 10px;color:${colors.textMuted};font-size:14px;">${txt.activateText}</p>
      <div style="text-align:center;margin:20px 0;">
        <a href="${activationLink}" style="display:inline-block;padding:12px 32px;background:${colors.primary};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">${txt.activateButton}</a>
      </div>
      <p style="color:${colors.textMuted};font-size:13px;">${txt.activateLinkExpiry}</p>
    `
    : loginLink
      ? `
        <p style="color:${colors.textMuted};font-size:14px;margin-top:20px;">${txt.alreadyActivated}</p>
        <div style="text-align:center;margin:20px 0;">
          <a href="${loginLink}" style="display:inline-block;padding:12px 32px;background:${colors.primary};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">${txt.loginButton}</a>
        </div>
      `
      : `<p style="color:${colors.textMuted};font-size:14px;margin-top:20px;">${txt.alreadyActivatedNoLink}</p>`;

  return baseLayout(
    `
    <div class="content" dir="${dir}">
      <h2 style="margin-bottom:4px;">${txt.welcome(safeName)}</h2>
      <p style="color:${colors.textMuted};margin-top:0;">${txt.intro}</p>

      ${credentialRow(txt.usernameLabel, safeUsername)}
      ${credentialRow(txt.passwordLabel, safePassword)}

      ${actionBlock}

      <div style="background:${colors.warningLight || '#fff8e1'};${borderSide}:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin-top:24px;">
        <p style="margin:0;font-size:13px;color:${colors.textMuted};">
          <strong>${txt.securityTitle}</strong> ${txt.securityText}
        </p>
      </div>
    </div>
    <div class="footer">
      <p style="margin:0;font-size:13px;">&copy; ${new Date().getFullYear()} Finora &middot; Smart Finance</p>
      <p style="margin:6px 0 0;font-size:12px;color:${colors.textDisabled};">${txt.footerSlogan}</p>
    </div>
  `,
    { lang: language }
  );
}

module.exports = {
  newUserRegistration,
  adminCreatedCredentials,
};
